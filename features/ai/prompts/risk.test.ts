import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockChat = vi.fn();

vi.mock("../clients", () => ({
  getAIClient: () => ({ provider: "gemini", chat: mockChat }),
}));

vi.mock("./system", () => ({
  SYSTEM_PROMPT: "You are a helpful assistant.",
}));

import { runRisk } from "./risk";

describe("runRisk", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("classifies high-risk email correctly", async () => {
    mockChat.mockResolvedValueOnce({
      text: JSON.stringify({ risk_level: "high", requires_approval: true, reason: "Payment and contract terms" }),
      tokensInput: 100, tokensOutput: 50, model: "gemini-2.0-flash",
    });

    const result = await runRisk({
      from: "legal@company.com",
      subject: "Contract Amendment - Payment Terms",
      body: "Please review and sign the contract amendment regarding payment terms of $50,000.",
    });

    expect(result.risk_level).toBe("high");
    expect(result.requires_approval).toBe(true);
    expect(result.reason).toBeTruthy();
  });

  it("classifies low-risk newsletter as low", async () => {
    mockChat.mockResolvedValueOnce({
      text: JSON.stringify({ risk_level: "low", requires_approval: false, reason: "Newsletter, no action required" }),
      tokensInput: 80, tokensOutput: 30, model: "gemini-2.0-flash",
    });

    const result = await runRisk({
      from: "newsletter@techdigest.com",
      subject: "Weekly Tech Digest #142",
      body: "This week in tech: AI breakthroughs, new frameworks, cloud tips.",
    });

    expect(result.risk_level).toBe("low");
    expect(result.requires_approval).toBe(false);
  });

  it("classifies medium-risk scheduling email correctly", async () => {
    mockChat.mockResolvedValueOnce({
      text: JSON.stringify({ risk_level: "medium", requires_approval: true, reason: "Scheduling commitment" }),
      tokensInput: 90, tokensOutput: 40, model: "gemini-2.0-flash",
    });

    const result = await runRisk({
      from: "client@business.com",
      subject: "Meeting Request - Q3 Review",
      body: "Can we schedule a meeting next Tuesday at 2pm to review Q3 results?",
    });

    expect(result.risk_level).toBe("medium");
    expect(result.requires_approval).toBe(true);
  });

  it("retries on malformed JSON response", async () => {
    mockChat
      .mockResolvedValueOnce({
        text: "Here is the assessment: ```json\n{invalid}```",
        tokensInput: 100, tokensOutput: 50, model: "gemini-2.0-flash",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ risk_level: "low", requires_approval: false, reason: "Informational" }),
        tokensInput: 50, tokensOutput: 30, model: "gemini-2.0-flash",
      });

    const result = await runRisk({
      from: "info@example.com",
      subject: "FYI",
      body: "The report is ready.",
    });

    expect(result.risk_level).toBe("low");
    expect(mockChat).toHaveBeenCalledTimes(2);
  });

  it("validates output schema — rejects unknown risk_level", async () => {
    mockChat
      .mockResolvedValueOnce({
        text: JSON.stringify({ risk_level: "critical", requires_approval: true, reason: "test" }),
        tokensInput: 50, tokensOutput: 20, model: "gemini-2.0-flash",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ risk_level: "high", requires_approval: true, reason: "Corrected" }),
        tokensInput: 50, tokensOutput: 20, model: "gemini-2.0-flash",
      });

    const result = await runRisk({ from: "test@test.com", subject: "Test", body: "Test body" });
    expect(["low", "medium", "high"]).toContain(result.risk_level);
  });
});
