import { describe, it, expect } from "vitest";

/**
 * Unit tests for Office 365 message normalization.
 * Ref: specs/008-testing-spec.md
 */

// Simulate the Office 365 normalization logic
function normalizeOffice365Message(raw: Record<string, unknown>) {
  const from = raw.from as { emailAddress: { name?: string; address: string } };
  const toRecipients = (raw.toRecipients as Array<{ emailAddress: { address: string } }>) || [];
  const ccRecipients = (raw.ccRecipients as Array<{ emailAddress: { address: string } }>) || [];
  const body = raw.body as { contentType: string; content: string };
  const categories = (raw.categories as string[]) || [];

  return {
    providerMessageId: raw.id as string,
    providerThreadId: raw.conversationId as string,
    fromName: from?.emailAddress?.name || undefined,
    fromEmail: from?.emailAddress?.address || "",
    toEmails: toRecipients.map((r) => r.emailAddress.address),
    ccEmails: ccRecipients.map((r) => r.emailAddress.address),
    subject: (raw.subject as string) || undefined,
    bodyText: body?.contentType === "text" ? body.content : undefined,
    bodyHtml: body?.contentType === "html" ? body.content : undefined,
    snippet: (raw.bodyPreview as string) || undefined,
    receivedAt: new Date(raw.receivedDateTime as string),
    labels: categories.length > 0 ? categories : ["INBOX"],
    attachments: [],
  };
}

describe("Office 365 message normalization", () => {
  it("normalizes a standard message correctly", () => {
    const raw = {
      id: "AAMkAGI2...",
      conversationId: "AAQkAGI2...",
      subject: "Project Update",
      bodyPreview: "Here is the latest project update...",
      body: { contentType: "html", content: "<p>Here is the latest project update...</p>" },
      from: { emailAddress: { name: "Bob Smith", address: "bob@company.com" } },
      toRecipients: [{ emailAddress: { address: "me@example.com" } }],
      ccRecipients: [{ emailAddress: { address: "team@company.com" } }],
      receivedDateTime: "2024-01-15T10:00:00Z",
      categories: [],
    };

    const result = normalizeOffice365Message(raw);

    expect(result.providerMessageId).toBe("AAMkAGI2...");
    expect(result.fromName).toBe("Bob Smith");
    expect(result.fromEmail).toBe("bob@company.com");
    expect(result.toEmails).toEqual(["me@example.com"]);
    expect(result.ccEmails).toEqual(["team@company.com"]);
    expect(result.subject).toBe("Project Update");
    expect(result.bodyHtml).toContain("project update");
    expect(result.bodyText).toBeUndefined();
    expect(result.labels).toContain("INBOX");
  });

  it("maps categories to labels", () => {
    const raw = {
      id: "msg-002",
      conversationId: "conv-002",
      subject: "Important",
      bodyPreview: "...",
      body: { contentType: "text", content: "Important message" },
      from: { emailAddress: { name: "Alice", address: "alice@example.com" } },
      toRecipients: [],
      ccRecipients: [],
      receivedDateTime: "2024-01-15T10:00:00Z",
      categories: ["IMPORTANT", "WORK"],
    };

    const result = normalizeOffice365Message(raw);
    expect(result.labels).toContain("IMPORTANT");
    expect(result.labels).toContain("WORK");
  });

  it("handles plain text body", () => {
    const raw = {
      id: "msg-003",
      conversationId: "conv-003",
      subject: "Plain text email",
      bodyPreview: "Hello world",
      body: { contentType: "text", content: "Hello world" },
      from: { emailAddress: { address: "sender@example.com" } },
      toRecipients: [],
      ccRecipients: [],
      receivedDateTime: "2024-01-15T10:00:00Z",
      categories: [],
    };

    const result = normalizeOffice365Message(raw);
    expect(result.bodyText).toBe("Hello world");
    expect(result.bodyHtml).toBeUndefined();
  });

  it("handles missing optional fields", () => {
    const raw = {
      id: "msg-004",
      conversationId: "conv-004",
      subject: null,
      bodyPreview: "",
      body: { contentType: "text", content: "" },
      from: { emailAddress: { address: "sender@example.com" } },
      toRecipients: [],
      ccRecipients: [],
      receivedDateTime: "2024-01-15T10:00:00Z",
      categories: [],
    };

    const result = normalizeOffice365Message(raw);
    expect(result.fromName).toBeUndefined();
    expect(result.subject).toBeUndefined();
    expect(result.toEmails).toEqual([]);
    expect(result.ccEmails).toEqual([]);
  });

  it("parses receivedDateTime correctly", () => {
    const raw = {
      id: "msg-005",
      conversationId: "conv-005",
      subject: "Test",
      bodyPreview: "",
      body: { contentType: "text", content: "" },
      from: { emailAddress: { address: "a@b.com" } },
      toRecipients: [],
      ccRecipients: [],
      receivedDateTime: "2024-06-15T14:30:00Z",
      categories: [],
    };

    const result = normalizeOffice365Message(raw);
    expect(result.receivedAt).toBeInstanceOf(Date);
    expect(result.receivedAt.getFullYear()).toBe(2024);
    expect(result.receivedAt.getMonth()).toBe(5); // June = 5 (0-indexed)
  });
});
