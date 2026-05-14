import "server-only";

import type { EmailAccount } from "@/lib/supabase/types";
import type {
  EmailProviderAdapter,
  NormalizedMessage,
  SendMessageInput,
  SendMessageResult,
} from "../types";
import { decrypt } from "@/lib/security/crypto";
import { parseGmailMessage } from "./normalize";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailTokens {
  access_token: string;
  refresh_token: string;
}

async function getTokens(account: EmailAccount): Promise<GmailTokens> {
  if (!account.access_token_encrypted || !account.refresh_token_encrypted) {
    throw new Error("Gmail account missing tokens");
  }
  return {
    access_token: decrypt(account.access_token_encrypted),
    refresh_token: decrypt(account.refresh_token_encrypted),
  };
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Gmail token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function gmailFetch(
  path: string,
  accessToken: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${GMAIL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

export function createGmailAdapter(account: EmailAccount): EmailProviderAdapter {
  let accessToken: string | null = null;

  async function ensureToken(): Promise<string> {
    if (accessToken) return accessToken;
    const tokens = await getTokens(account);
    // Try existing token first, refresh if needed
    const testRes = await gmailFetch("/profile", tokens.access_token);
    if (testRes.ok) {
      accessToken = tokens.access_token;
      return accessToken;
    }
    accessToken = await refreshAccessToken(tokens.refresh_token);
    return accessToken;
  }

  return {
    provider: "gmail",

    async syncMessages({ since }) {
      const token = await ensureToken();
      const query = since
        ? `after:${Math.floor(since.getTime() / 1000)}`
        : "newer_than:1d";

      const listRes = await gmailFetch(
        `/messages?q=${encodeURIComponent(query)}&maxResults=50`,
        token
      );

      if (!listRes.ok) {
        throw new Error(`Gmail list failed: ${listRes.status}`);
      }

      const listData = await listRes.json();
      const messageIds = (listData.messages || []) as Array<{ id: string }>;

      const messages: NormalizedMessage[] = [];

      for (const { id } of messageIds) {
        const msgRes = await gmailFetch(`/messages/${id}?format=full`, token);
        if (!msgRes.ok) continue;
        const msgData = await msgRes.json();
        messages.push(parseGmailMessage(msgData));
      }

      return messages;
    },

    async sendMessage(params: SendMessageInput) {
      const token = await ensureToken();

      // Build RFC 2822 MIME message
      const boundary = `boundary_${Date.now()}`;
      const mimeLines = [
        `To: ${params.to.join(", ")}`,
        params.cc ? `Cc: ${params.cc.join(", ")}` : "",
        `Subject: ${params.subject}`,
        params.inReplyToMessageId
          ? `In-Reply-To: ${params.inReplyToMessageId}`
          : "",
        params.references
          ? `References: ${params.references.join(" ")}`
          : "",
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset="UTF-8"`,
        "",
        params.bodyText || "",
      ]
        .filter(Boolean)
        .join("\r\n");

      const encodedMessage = Buffer.from(mimeLines)
        .toString("base64url");

      const sendRes = await gmailFetch("/messages/send", token, {
        method: "POST",
        body: JSON.stringify({ raw: encodedMessage }),
      });

      if (!sendRes.ok) {
        throw new Error(`Gmail send failed: ${sendRes.status}`);
      }

      const sendData = await sendRes.json();
      return {
        providerMessageId: sendData.id,
        providerThreadId: sendData.threadId,
      };
    },

    async archiveMessage(providerMessageId: string) {
      const token = await ensureToken();
      await gmailFetch(`/messages/${providerMessageId}/modify`, token, {
        method: "POST",
        body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
      });
    },

    async deleteMessage(providerMessageId: string) {
      const token = await ensureToken();
      await gmailFetch(`/messages/${providerMessageId}/trash`, token, {
        method: "POST",
      });
    },

    async applyLabel(providerMessageId: string, label: string) {
      const token = await ensureToken();
      await gmailFetch(`/messages/${providerMessageId}/modify`, token, {
        method: "POST",
        body: JSON.stringify({ addLabelIds: [label] }),
      });
    },
  };
}
