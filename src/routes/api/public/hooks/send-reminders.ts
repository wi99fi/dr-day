import { createFileRoute } from "@tanstack/react-router";

// Called every minute by a scheduler with: Authorization: Bearer <REMINDER_CRON_SECRET>
async function authorized(request: Request) {
  const secret = process.env["REMINDER_CRON_SECRET"];
  if (!secret) return false;
  const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return false;
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (v: string) => createHash("sha256").update(v, "utf8").digest();
  return timingSafeEqual(digest(token), digest(secret));
}

async function handle(request: Request) {
  if (!(await authorized(request))) return new Response("Unauthorized", { status: 401 });
  try {
    const { sendDueReminders } = await import("@/lib/push/send-reminders.server");
    return Response.json({ ok: true, ...(await sendDueReminders()) });
  } catch (e) {
    console.error("send-reminders failed", e);
    return Response.json({ ok: false, error: "failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: { handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) } },
});
