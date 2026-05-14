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

  const systemPrompt = `You are an AI email secretary helping a human write emails.

CRITICAL: Write emails that sound like a real person wrote them, not an AI or marketing bot.

Rules to avoid spam filters:
- Natural, conversational tone matching the context
- Varied sentence structure — not formulaic
- No spam trigger words: "click here", "act now", "free", "guaranteed", "limited time", "urgent"
- No excessive punctuation or ALL CAPS
- No generic filler phrases like "I hope this finds you well"
- Specific and direct — get to the point
- Appropriate length — not padded with unnecessary content
- Plain text body (no HTML markup)

${memoryContext ? `\nContext about the sender:\n${memoryContext}` : ""}

Return ONLY a JSON object with exactly:
- "subject": concise subject line (max 60 chars)
- "body": the email body as plain text`;

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
