import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/features/ai/clients";

/**
 * Generate a new email draft from a user prompt.
 * Uses active memory for context.
 * POST /api/ai/compose
 */

const schema = z.object({
  prompt: z.string().min(1).max(1000),
  to: z.string().optional(),
  subject: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { prompt, to, subject } = parsed.data;

  // Retrieve active memory for context
  const { data: memoryItems } = await supabase
    .from("memory_items")
    .select("content, memory_type")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(8);

  const memoryContext = memoryItems?.length
    ? "Active memory context:\n" + memoryItems.map((m) => `- [${m.memory_type}] ${m.content}`).join("\n")
    : "";

  const systemPrompt = `You are an AI email secretary. Write professional, clear, and concise emails.
${memoryContext ? `\n${memoryContext}` : ""}

Return a JSON object with exactly two fields:
- "subject": a concise email subject line (string)
- "body": the full email body text (string, no HTML)

Do not include any other text outside the JSON.`;

  const userPrompt = [
    `Write an email based on this request: "${prompt}"`,
    to ? `Recipient: ${to}` : "",
    subject ? `Suggested subject: ${subject}` : "",
  ].filter(Boolean).join("\n");

  try {
    const ai = getAIClient();
    const response = await ai.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 800,
    });

    // Parse JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    const result = JSON.parse(jsonMatch[0]);

    // Log
    await supabase.from("ai_actions").insert({
      user_id: user.id,
      feature: "compose",
      input: { prompt, to, subject },
      output: result,
      model: "default",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("AI compose error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI compose failed" },
      { status: 500 }
    );
  }
}
