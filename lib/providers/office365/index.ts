import "server-only";

import type { EmailAccount } from "@/lib/supabase/types";
import type { EmailProviderAdapter, SendMessageInput } from "../types";
import { getAccessToken } from "./token";
import { graphFetch } from "./graph-client";
import { parseGraphMessage } from "./parse";

export function createOffice365Adapter(account: EmailAccount): EmailProviderAdapter {
  let token: string | null = null;

  async function ensureToken(): Promise<string> {
    if (!token) token = await getAccessToken(account);
    return token;
  }

  return {
    provider: "office365",

    async syncMessages({ since }) {
      const accessToken = await ensureToken();

      let url =
        "/mailFolders/Inbox/messages?$top=50&$orderby=receivedDateTime desc" +
        "&$select=id,conversationId,from,toRecipients,ccRecipients,subject,bodyPreview,body,receivedDateTime,categories";

      if (since) {
        url += `&$filter=receivedDateTime ge ${since.toISOString()}`;
      }

      const res = await graphFetch(url, accessToken);
      if (!res.ok) throw new Error(`Office 365 sync failed: ${res.status}`);

      const data = await res.json();
      return ((data.value || []) as Array<Record<string, unknown>>).map(parseGraphMessage);
    },

    async sendMessage(params: SendMessageInput) {
      const accessToken = await ensureToken();

      const message = {
        subject: params.subject,
        body: {
          contentType: params.bodyHtml ? "HTML" : "Text",
          content: params.bodyHtml || params.bodyText || "",
        },
        toRecipients: params.to.map((email) => ({ emailAddress: { address: email } })),
        ccRecipients: (params.cc || []).map((email) => ({ emailAddress: { address: email } })),
      };

      const res = await graphFetch("/sendMail", accessToken, {
        method: "POST",
        body: JSON.stringify({ message, saveToSentItems: true }),
      });

      if (!res.ok) throw new Error(`Office 365 send failed: ${res.status}`);

      return { providerMessageId: `sent-${Date.now()}`, providerThreadId: undefined };
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
      await graphFetch(`/messages/${providerMessageId}`, accessToken, { method: "DELETE" });
    },

    async applyLabel(providerMessageId: string, label: string) {
      const accessToken = await ensureToken();
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
