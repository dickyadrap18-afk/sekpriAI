import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the output schema validation (without calling the actual AI)
const outputSchema = z.object({
  intent_type: z.enum([
    "summarize_latest",
    "draft_reply",
    "reply_with_text",
    "list_urgent",
    "search",
    "schedule_send",
    "send_approved",
    "cancel_scheduled",
    "unknown",
  ]),
  target: z.string().nullable(),
  instruction: z.string().nullable(),
  requires_confirmation: z.boolean(),
});

describe("parse-channel-intent schema", () => {
  it("should validate a summarize_latest intent", () => {
    const result = outputSchema.parse({
      intent_type: "summarize_latest",
      target: null,
      instruction: null,
      requires_confirmation: false,
    });

    expect(result.intent_type).toBe("summarize_latest");
    expect(result.requires_confirmation).toBe(false);
  });

  it("should validate a draft_reply intent with target", () => {
    const result = outputSchema.parse({
      intent_type: "draft_reply",
      target: "Sarah",
      instruction: null,
      requires_confirmation: true,
    });

    expect(result.intent_type).toBe("draft_reply");
    expect(result.target).toBe("Sarah");
    expect(result.requires_confirmation).toBe(true);
  });

  it("should validate a search intent", () => {
    const result = outputSchema.parse({
      intent_type: "search",
      target: "pricing proposal",
      instruction: null,
      requires_confirmation: false,
    });

    expect(result.target).toBe("pricing proposal");
  });

  it("should reject invalid intent_type", () => {
    expect(() =>
      outputSchema.parse({
        intent_type: "invalid_type",
        target: null,
        instruction: null,
        requires_confirmation: false,
      })
    ).toThrow();
  });

  it("should reject missing requires_confirmation", () => {
    expect(() =>
      outputSchema.parse({
        intent_type: "summarize_latest",
        target: null,
        instruction: null,
      })
    ).toThrow();
  });

  it("should validate all intent types", () => {
    const types = [
      "summarize_latest",
      "draft_reply",
      "reply_with_text",
      "list_urgent",
      "search",
      "schedule_send",
      "send_approved",
      "cancel_scheduled",
      "unknown",
    ];

    for (const type of types) {
      const result = outputSchema.safeParse({
        intent_type: type,
        target: null,
        instruction: null,
        requires_confirmation: false,
      });
      expect(result.success).toBe(true);
    }
  });
});
