import type { NormalizedMessage } from "../types";

/**
 * Parse a Gmail API message payload into a NormalizedMessage.
 * Extracted from gmail/index.ts for maintainability.
 * Ref: audit-report.md CQ-02
 */
export function parseGmailMessage(raw: Record<string, unknown>): NormalizedMessage {
  const payload = raw.payload as Record<string, unknown>;
  const headers = (payload?.headers as Array<{ name: string; value: string }>) || [];

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

  const ccEmails = getHeader("Cc")
    .split(",")
    .map((e) => e.replace(/.*<(.+?)>.*/, "$1").trim())
    .filter(Boolean);

  // Extract body from parts
  let bodyText = "";
  let bodyHtml = "";
  const parts = (payload?.parts as Array<Record<string, unknown>>) || [];

  function extractParts(partList: Array<Record<string, unknown>>) {
    for (const part of partList) {
      const mimeType = part.mimeType as string;
      const body = part.body as { data?: string } | undefined;

      if (mimeType === "text/plain" && body?.data) {
        bodyText = Buffer.from(body.data, "base64url").toString("utf8");
      } else if (mimeType === "text/html" && body?.data) {
        bodyHtml = Buffer.from(body.data, "base64url").toString("utf8");
      } else if (part.parts) {
        extractParts(part.parts as Array<Record<string, unknown>>);
      }
    }
  }

  if (parts.length > 0) {
    extractParts(parts);
  } else if (payload?.body) {
    const body = payload.body as { data?: string };
    const mimeType = payload.mimeType as string;
    if (body?.data) {
      const decoded = Buffer.from(body.data, "base64url").toString("utf8");
      if (mimeType === "text/html") bodyHtml = decoded;
      else bodyText = decoded;
    }
  }

  const labels = (raw.labelIds as string[]) || [];

  return {
    providerMessageId: raw.id as string,
    providerThreadId: raw.threadId as string,
    fromName,
    fromEmail,
    toEmails,
    ccEmails,
    subject: getHeader("Subject") || undefined,
    bodyText: bodyText || undefined,
    bodyHtml: bodyHtml || undefined,
    snippet: (raw.snippet as string) || undefined,
    receivedAt: new Date(parseInt(raw.internalDate as string, 10)),
    labels,
    attachments: [],
  };
}
