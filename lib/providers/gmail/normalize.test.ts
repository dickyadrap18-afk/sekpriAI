import { describe, it, expect } from "vitest";

// Test the Gmail message parsing logic inline (extracted for testability)
function parseGmailHeaders(headers: Array<{ name: string; value: string }>) {
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const fromFull = getHeader("From");
  const fromMatch = fromFull.match(/^(.+?)\s*<(.+?)>$/);
  const fromName = fromMatch ? fromMatch[1].replace(/"/g, "").trim() : undefined;
  const fromEmail = fromMatch ? fromMatch[2] : fromFull;

  const toEmails = getHeader("To")
    .split(",")
    .map((e) => e.replace(/.*<(.+?)>.*/, "$1").trim())
    .filter(Boolean);

  return { fromName, fromEmail, toEmails, subject: getHeader("Subject") };
}

describe("Gmail normalize", () => {
  it("should parse From header with name and email", () => {
    const headers = [
      { name: "From", value: '"Alice Johnson" <alice@company.com>' },
      { name: "To", value: "bob@example.com" },
      { name: "Subject", value: "Test Subject" },
    ];

    const result = parseGmailHeaders(headers);

    expect(result.fromName).toBe("Alice Johnson");
    expect(result.fromEmail).toBe("alice@company.com");
    expect(result.subject).toBe("Test Subject");
  });

  it("should parse From header with email only", () => {
    const headers = [
      { name: "From", value: "alice@company.com" },
      { name: "To", value: "bob@example.com" },
      { name: "Subject", value: "" },
    ];

    const result = parseGmailHeaders(headers);

    expect(result.fromName).toBeUndefined();
    expect(result.fromEmail).toBe("alice@company.com");
  });

  it("should parse multiple To recipients", () => {
    const headers = [
      { name: "From", value: "alice@company.com" },
      { name: "To", value: "Bob <bob@example.com>, carol@example.com" },
      { name: "Subject", value: "Multi" },
    ];

    const result = parseGmailHeaders(headers);

    expect(result.toEmails).toContain("bob@example.com");
    expect(result.toEmails).toContain("carol@example.com");
  });

  it("should handle missing headers gracefully", () => {
    const result = parseGmailHeaders([]);

    expect(result.fromName).toBeUndefined();
    expect(result.fromEmail).toBe("");
    expect(result.toEmails).toEqual([]);
    expect(result.subject).toBe("");
  });
});
