import { supabase } from "@/integrations/supabase/client";
import { loadPrayerSettings } from "../prayer-times";

export const REMINDER_KEY = "dr-day-reminder-minutes";
export type PushStatus = "unsupported" | "unconfigured" | "denied" | "off" | "on";

const VAPID_PUBLIC_KEY = import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined;

function urlBase64ToUint8Array(s: string) {
  const padded = (s + "=".repeat((4 - (s.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function pushSupported() {
  return typeof window !== "undefined" && window.self === window.top && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function getRegistration() {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "unconfigured";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    return sub && Notification.permission === "granted" ? "on" : "off";
  } catch {
    return "off";
  }
}

async function saveRow(userId: string, sub: PushSubscription, leadMinutes: number) {
  const json = sub.toJSON();
  const p = loadPrayerSettings();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId, endpoint: sub.endpoint, p256dh: json.keys?.["p256dh"] ?? "", auth: json.keys?.["auth"] ?? "",
      lead_minutes: leadMinutes, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Damascus",
      prayer_tz: p.tz, lat: p.lat, lng: p.lng, method: p.method, madhab: p.madhab, updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

/** Ask permission, subscribe this device, and store it so the server can push reminders. */
export async function enablePush(userId: string, leadMinutes: number): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "unconfigured";
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "off";
  const reg = await getRegistration();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  await saveRow(userId, sub, leadMinutes);
  return "on";
}

export async function disablePush(userId: string) {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/** Keep the stored row in sync (city, method, lead time, time zone). Safe to call often. */
export async function syncPush(userId: string) {
  try {
    const lead = Number(localStorage.getItem(REMINDER_KEY) ?? 0);
    if (!lead || (await getPushStatus()) !== "on") return;
    const reg = await getRegistration();
    const sub = await reg.pushManager.getSubscription();
    if (sub) await saveRow(userId, sub, lead);
  } catch {
    /* offline or not signed in yet — try again next time */
  }
}
