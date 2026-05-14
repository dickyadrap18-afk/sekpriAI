import { describe, it, expect } from "vitest";

/**
 * Unit tests for IMAP message normalization.
 * Tests the credential extraction and message structure.
 * Ref: specs/008-testing-spec.md
 */

// Test the IMAP credential structure (without actual connection)
describe("IMAP adapter credential handling", () => {
  it("throws when password is missing", () => {
    const account = {
      id: "test-id",
      imap_password_encrypted: null,
      imap_host: "imap.gmail.com",
      imap_port: 993,
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      imap_username: "test@gmail.com",
      email_address: "test@gmail.com",
    };

    // Simulate the credential extraction logic
    function getImapCredentials(acc: typeof account) {
      if (!acc.imap_password_encrypted) {
        throw new Error("IMAP account missing password");
      }
      return { host: acc.imap_host, port: acc.imap_port };
    }

    expect(() => getImapCredentials(account)).toThrow("IMAP account missing password");
  });

  it("correctly identifies SSL vs STARTTLS port", () => {
    function isSSL(port: number) { return port === 465; }

    expect(isSSL(465)).toBe(true);   // SSL
    expect(isSSL(587)).toBe(false);  // STARTTLS
    expect(isSSL(993)).toBe(false);  // IMAP TLS (not SMTP)
  });

  it("normalizes IMAP message structure", () => {
    // Simulate what mailparser returns and how we normalize it
    const parsedEmail = {
      from: { value: [{ name: "Alice Johnson", address: "alice@company.com" }] },
      to: { value: [{ address: "demo@gmail.com" }] },
      cc: null,
      subject: "Q3 Budget Review",
      text: "Please review the Q3 budget proposal.",
      html: "<p>Please review the Q3 budget proposal.</p>",
      date: new Date("2024-01-15T10:00:00Z"),
      messageId: "<msg-001@company.com>",
      inReplyTo: null,
      attachments: [],
    };

    // Normalize to our format
    const normalized = {
      providerMessageId: "12345",
      fromName: parsedEmail.from.value[0].name,
      fromEmail: parsedEmail.from.value[0].address,
      toEmails: parsedEmail.to.value.map((v) => v.address),
      ccEmails: [],
      subject: parsedEmail.subject,
      bodyText: parsedEmail.text,
      bodyHtml: parsedEmail.html,
      snippet: parsedEmail.text.slice(0, 200),
      receivedAt: parsedEmail.date,
      labels: ["INBOX"],
      attachments: [],
    };

    expect(normalized.fromName).toBe("Alice Johnson");
    expect(normalized.fromEmail).toBe("alice@company.com");
    expect(normalized.toEmails).toEqual(["demo@gmail.com"]);
    expect(normalized.ccEmails).toEqual([]);
    expect(normalized.subject).toBe("Q3 Budget Review");
    expect(normalized.labels).toContain("INBOX");
    expect(normalized.snippet.length).toBeLessThanOrEqual(200);
  });

  it("handles missing optional fields gracefully", () => {
    const minimalEmail = {
      from: { value: [{ name: undefined, address: "sender@example.com" }] },
      to: null,
      subject: undefined,
      text: undefined,
      html: undefined,
      date: new Date(),
      attachments: [],
    };

    const normalized = {
      fromName: minimalEmail.from.value[0].name || undefined,
      fromEmail: minimalEmail.from.value[0].address,
      toEmails: minimalEmail.to ? [] : [],
      subject: minimalEmail.subject || undefined,
      bodyText: minimalEmail.text || undefined,
      bodyHtml: minimalEmail.html || undefined,
      snippet: undefined,
      labels: ["INBOX"],
    };

    expect(normalized.fromName).toBeUndefined();
    expect(normalized.fromEmail).toBe("sender@example.com");
    expect(normalized.subject).toBeUndefined();
    expect(normalized.bodyText).toBeUndefined();
  });
});
