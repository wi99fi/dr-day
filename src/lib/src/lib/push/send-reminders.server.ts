import { buildPushPayload } from "@block65/webcrypto-web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PlannerEvent } from "../planner";
import { prayerInstants, sanitizePrayerSettings } from "../prayer-times";
import { dateKeyInTz } from "../zoned-time";
import { computeDue, type PrayerInstantLite } from "./due";

const MAX_SENT_KEYS = 120;

function vapid() {
  const publicKey = process.env["VAPID_PUBLIC_KEY"] ?? process.env["VITE_VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) throw new Error("Missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY");
  return { subject, publicKey, privateKey };
}

export async function sendDueReminders(now = Date.now()) {
  const keys = vapid();
  const { data: subs, error } = await supabaseAdmin.from("push_subscriptions").select("*").gt("lead_minutes", 0);
  if (error) throw error;

  const eventsByUser = new Map<string, PlannerEvent[]>();
  let sent = 0, removed = 0, failed = 0;

  for (const sub of subs ?? []) {
    if (!eventsByUser.has(sub.user_id)) {
      const { data: row } = await supabaseAdmin.from("planner_collections").select("items").eq("user_id", sub.user_id).eq("collection", "events").maybeSingle();
      eventsByUser.set(sub.user_id, (Array.isArray(row?.items) ? row.items : []) as unknown as PlannerEvent[]);
    }
    const settings = sanitizePrayerSettings({ cityId: "custom", lat: sub.lat, lng: sub.lng, tz: sub.prayer_tz, method: sub.method, madhab: sub.madhab });
    const prayers: PrayerInstantLite[] = [now, now + 24 * 3600_000].flatMap((t) => {
      const key = dateKeyInTz(t, settings.tz);
      const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
      return prayerInstants(new Date(y, m - 1, d), settings).map((p) => ({ ...p, date: key }));
    });

    const sentKeys = Array.isArray(sub.sent_keys) ? (sub.sent_keys as string[]) : [];
    const due = computeDue({ events: eventsByUser.get(sub.user_id) ?? [], prayers, tz: sub.tz, leadMinutes: sub.lead_minutes, now, sentKeys });
    if (!due.length) continue;

    const delivered: string[] = [];
    for (const item of due) {
      try {
        const payload = await buildPushPayload(
          { data: JSON.stringify({ title: "تذكير", body: item.body, tag: item.key, url: "/" }), options: { ttl: 600, urgency: "high" } },
          { endpoint: sub.endpoint, expirationTime: null, keys: { auth: sub.auth, p256dh: sub.p256dh } },
          keys,
        );
        const res = await fetch(sub.endpoint, payload);
        if (res.status === 404 || res.status === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          removed++;
          break;
        }
        if (res.ok) { delivered.push(item.key); sent++; } else failed++;
      } catch {
        failed++;
      }
    }
    if (delivered.length)
      await supabaseAdmin.from("push_subscriptions").update({ sent_keys: [...sentKeys, ...delivered].slice(-MAX_SENT_KEYS) }).eq("id", sub.id);
  }
  return { subscriptions: subs?.length ?? 0, sent, removed, failed };
}
