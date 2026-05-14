import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the priority output schema validation
const outputSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  reason: z.string(),
  should_notify: z.boolean(),
});

describe("priority schema", () => {
  it("should validate high priority with notification", () => {
    const result = outputSchema.parse({
      priority: "high",
      reason: "Contains urgent deadline",
      should_notify: true,
    });

    expect(result.priority).toBe("high");
    expect(result.should_notify).toBe(true);
  });

  it("should validate low priority without notification", () => {
    const result = outputSchema.parse({
      priority: "low",
      reason: "Newsletter, no action needed",
      should_notify: false,
    });

    expect(result.priority).toBe("low");
    expect(result.should_notify).toBe(false);
  });

  it("should reject invalid priority value", () => {
    expect(() =>
      outputSchema.parse({
        priority: "critical",
        reason: "test",
        should_notify: true,
      })
    ).toThrow();
  });

  it("should reject missing reason", () => {
    expect(() =>
      outputSchema.parse({
        priority: "high",
        should_notify: true,
      })
    ).toThrow();
  });

  it("should accept all three priority levels", () => {
    for (const p of ["high", "medium", "low"]) {
      const result = outputSchema.safeParse({
        priority: p,
        reason: "test reason",
        should_notify: false,
      });
      expect(result.success).toBe(true);
    }
  });
});
