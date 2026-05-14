import "server-only";

import type { EmailAccount } from "@/lib/supabase/types";
import type {
  EmailProviderAdapter,
  NormalizedMessage,
  SendMessageInput,
  SendMessageResult,
} from "../types";
import { decrypt } from "@/lib/security/crypto";

const GRAPH_API = "https://graph.microsoft.com/v1.0/me";

async function getAccessToken(account: EmailAccount): Promise<string> {
  if (!account.access_token_encrypted || !account.refresh_token_encrypted) {
    throw new Error("Office 365 account missing tokens");
  }

  const refreshToken = decrypt(account.refresh_token_encrypted);

  const res = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "Mail.ReadWrite Mail.Send offline_access User.Read",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Office 365 token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function graphFetch(
  path: string,
  token: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${GRAPH_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

function parseGraphMessage(msg: Record<string, unknown>): NormalizedMessage {
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

export function createOffice365Adapter(account: EmailAccount): EmailProviderAdapter {
  let token: string | null = null;

  async function ensureToken(): Promise<string> {
    if (!token) {
      token = await getAccessToken(account);
    }
    return token;
  }

  return {
    provider: "office365",

    async syncMessages({ since }) {
      const accessToken = await ensureToken();

      let url = "/mailFolders/Inbox/messages?$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,from,toRecipients,ccRecipients,subject,bodyPreview,body,receivedDateTime,categories";

      if (since) {
        url += `&$filter=receivedDateTime ge ${since.toISOString()}`;
      }

      const res = await graphFetch(url, accessToken);
      if (!res.ok) {
        throw new Error(`Office 365 sync failed: ${res.status}`);
      }

      const data = await res.json();
      const messages = (data.value || []) as Array<Record<string, unknown>>;

      return messages.map(parseGraphMessage);
    },

    async sendMessage(params: SendMessageInput) {
      const accessToken = await ensureToken();

      const message = {
        subject: params.subject,
        body: {
          contentType: params.bodyHtml ? "HTML" : "Text",
          content: params.bodyHtml || params.bodyText || "",
        },
        toRecipients: params.to.map((email) => ({
          emailAddress: { address: email },
        })),
        ccRecipients: (params.cc || []).map((email) => ({
          emailAddress: { address: email },
        })),
      };

      const res = await graphFetch("/sendMail", accessToken, {
        method: "POST",
        body: JSON.stringify({ message, saveToSentItems: true }),
      });

      if (!res.ok) {
        throw new Error(`Office 365 send failed: ${res.status}`);
      }

      return {
        providerMessageId: `sent-${Date.now()}`,
        providerThreadId: undefined,
      };
    },

    async archiveMessage(providerMessageId: string) {
      const accessToken = await ensureToken();
      await graphFetch(`/messages/${providerMessageId}/move`, accessToken, {
        method: "POST",
        body: JSON.stringify({ destinationId: "archive" }),
      });
    },

    async deleteMessage(providerMessageId: string) {
      const accessToken = await ensureToken();
      await graphFetch(`/messages/${providerMessageId}`, accessToken, {
        method: "DELETE",
      });
    },

    async applyLabel(providerMessageId: string, label: string) {
      const accessToken = await ensureToken();
      // Office 365 uses categories
      const getRes = await graphFetch(
        `/messages/${providerMessageId}?$select=categories`,
        accessToken
      );
      const msg = await getRes.json();
      const categories = [...(msg.categories || []), label];

      await graphFetch(`/messages/${providerMessageId}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({ categories }),
      });
    },
  };
}
