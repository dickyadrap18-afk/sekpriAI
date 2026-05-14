import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("should return empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("should return single chunk for short text", () => {
    const text = "This is a short email body.";
    const chunks = chunkText(text);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
    expect(chunks[0].index).toBe(0);
  });

  it("should split long text into multiple chunks", () => {
    // Create text longer than 2000 chars
    const text = "A".repeat(5000);
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be <= 2000 chars
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(2000);
    }
  });

  it("should have sequential indexes", () => {
    const text = "Word ".repeat(1000);
    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i);
    }
  });

  it("should have overlapping content between chunks", () => {
    const text = "Sentence one. ".repeat(200);
    const chunks = chunkText(text);

    if (chunks.length >= 2) {
      // The end of chunk 0 should overlap with the start of chunk 1
      const endOfFirst = chunks[0].content.slice(-100);
      const startOfSecond = chunks[1].content.slice(0, 200);
      // There should be some overlap
      expect(startOfSecond).toContain(endOfFirst.slice(-50));
    }
  });
});
