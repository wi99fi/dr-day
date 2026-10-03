import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const Appointment = z.object({
  id: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
  durationMinutes: z.number().int().min(5).max(1440).default(30),
  clinicName: z.string().max(200).default(""),
  note: z.string().max(1000).default(""),
  revenue: z.number().min(0).max(1e9).default(0),
  sharePercent: z.number().min(0).max(100).default(100),
  type: z.enum(["ownClinic", "percentageClinic"]).default("percentageClinic"),
  deleted: z.boolean().default(false),
});
const Body = z.object({ appointments: z.array(Appointment).max(1000) });

async function sha256(v: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: CORS });

export const Route = createFileRoute("/api/public/clinic-sync")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
        if (!token || token.length < 20) return json({ error: "unauthorized" }, 401);
        let parsed;
        try {
          parsed = Body.safeParse(await request.json());
        } catch {
          return json({ error: "invalid json" }, 400);
        }
        if (!parsed.success) return json({ error: "invalid body", details: parsed.error.flatten() }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const hash = await sha256(token);
        const { data: tok } = await supabaseAdmin.from("clinic_sync_tokens").select("user_id").eq("token_hash", hash).maybeSingle();
        if (!tok) return json({ error: "unauthorized" }, 401);
        const userId = tok.user_id;

        const { data: row } = await supabaseAdmin.from("planner_collections").select("items")
          .eq("user_id", userId).eq("collection", "events").maybeSingle();
        const events = new Map<string, Record<string, unknown>>();
        for (const e of (Array.isArray(row?.items) ? row.items : []) as Record<string, unknown>[]) events.set(String(e["id"]), e);

        let upserted = 0, removed = 0;
        for (const a of parsed.data.appointments) {
          const id = `clinic-${a.id}`;
          if (a.deleted) { if (events.delete(id)) removed++; continue; }
          events.set(id, {
            id, date: a.date, startTime: a.startTime, durationMinutes: a.durationMinutes, type: a.type,
            place: a.clinicName, note: a.note, clinicName: a.clinicName, sharePercent: a.sharePercent, revenue: a.revenue,
          });
          upserted++;
        }
        const now = new Date().toISOString();
        const { error } = await supabaseAdmin.from("planner_collections").upsert({
          user_id: userId, collection: "events", items: Array.from(events.values()) as never, updated_at: now,
        });
        if (error) return json({ error: "save failed" }, 500);
        await supabaseAdmin.from("clinic_sync_tokens").update({ last_sync_at: now }).eq("user_id", userId);
        return json({ ok: true, upserted, removed });
      },
    },
  },
});
