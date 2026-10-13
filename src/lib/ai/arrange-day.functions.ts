import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TYPES = ["hospital", "shift", "ownClinic", "percentageClinic", "lunch", "break", "gym", "prayer", "other"] as const;

const InputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  text: z.string().trim().min(3).max(4000),
  existing: z.array(z.object({ startTime: z.string(), durationMinutes: z.number(), label: z.string() })).max(50),
});

export type ArrangedItem = {
  startTime: string; durationMinutes: number; type: (typeof TYPES)[number];
  title: string; place: string; note: string; activityIcon: string;
};

export const arrangeDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<{ items: ArrangedItem[]; summary: string; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { items: [], summary: "", error: "خدمة الذكاء غير مهيأة." };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const { createLovableAiGatewayRunIdFetch } = await import("./run-id.server");
    const runId = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runId.fetch,
    });
    const schema = z.object({
      summary: z.string(),
      items: z.array(z.object({
        startTime: z.string(), durationMinutes: z.number(), type: z.enum(TYPES),
        title: z.string(), place: z.string(), note: z.string(),
        activityIcon: z.enum(["utensils", "coffee", "dumbbell", "prayer", "book", "walk", "heart", "star"]),
      })),
    });
    const instructions = `أنت مساعد تنظيم يوم لطبيب جراحة الوجه والفكين. يكتب الطبيب قائمة مواعيده ونشاطاته بالعربية بشكل حر.
رتّبها في جدول يومي واضح بلا تعارض بين الأوقات قدر الإمكان، واحترم أي وقت يذكره الطبيب حرفياً.
الأنواع: hospital دوام مشفى/عمليات، shift مناوبة، ownClinic عيادته الخاصة، percentageClinic عيادة بالنسبة، lunch غداء، break استراحة، gym نادي، prayer صلاة، other أي نشاط آخر.
startTime بصيغة HH:MM (24 ساعة)، durationMinutes بين 5 و1440. title اسم قصير بالعربية. place وnote نص فارغ إن لم يذكر.
activityIcon مناسب للنشاط (star إن لم يناسب شيء). المواعيد الموجودة مسبقاً لا تكررها وتجنب التعارض معها.
summary جملة قصيرة بالعربية تشرح الترتيب.`;
    const prompt = `التاريخ: ${data.date}\nالمواعيد الموجودة مسبقاً: ${data.existing.map((e) => `${e.startTime} (${e.durationMinutes}د) ${e.label}`).join("، ") || "لا شيء"}\n\nقائمة الطبيب:\n${data.text}`;
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions,
        messages: [{ role: "user", content: prompt }],
        output: Output.object({ schema }),
        providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
      } as Parameters<typeof streamText>[0]);
      const out = (await result.output) as z.infer<typeof schema>;
      const items = out.items
        .filter((i) => /^([01]\d|2[0-3]):[0-5]\d$/.test(i.startTime))
        .map((i) => ({ ...i, durationMinutes: Math.max(5, Math.min(1440, Math.round(i.durationMinutes))) }))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { items, summary: out.summary };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error("arrangeDay failed", status, e);
      const error = status === 429 ? "طلبات كثيرة، حاول بعد قليل." : status === 402 || status === 403 ? "رصيد الذكاء الاصطناعي غير متاح حالياً." : "تعذر ترتيب اليوم، حاول مرة أخرى.";
      return { items: [], summary: "", error };
    }
  });
