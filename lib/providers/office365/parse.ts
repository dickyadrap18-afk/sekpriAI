import "server-only";

import type { NormalizedMessage } from "../types";

export function parseGraphMessage(msg: Record<string, unknown>): NormalizedMessage {
  const from = msg.from as { emailAddress?: { name?: string; address?: string } } | undefined;
  const toRecipients = (msg.toRecipients as Array<{ emailAddress: { address: string } }>) || [];
  const ccRecipients = (msg.ccRecipients as Array<{ emailAddress: { address: string } }>) || [];
  const body = msg.body as { contentType?: string; content?: string } | undefined;
  const categories = (msg.categories as string[]) || [];

  return {
    providerMessageId: msg.id as string,
    providerThreadId: (msg.conversationId as string) || undefined,
    fromName: from?.emailAddress?.name || undefined,
    fromEmail: from?.emailAddress?.address || "",
    toEmails: toRecipients.map((r) => r.emailAddress.address),
    ccEmails: ccRecipients.map((r) => r.emailAddress.address),
    subject: (msg.subject as string) || undefined,
    bodyText: body?.contentType === "text" ? body.content : undefined,
    bodyHtml: body?.contentType === "html" ? body.content : undefined,
    snippet: (msg.bodyPreview as string) || undefined,
    receivedAt: new Date(msg.receivedDateTime as string),
    labels: categories,
    attachments: [],
  };
}
