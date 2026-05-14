import "server-only";

import type { EmailAccount } from "@/lib/supabase/types";
import type {
  EmailProviderAdapter,
  NormalizedMessage,
  SendMessageInput,
  SendMessageResult,
} from "../types";
import { decrypt } from "@/lib/security/crypto";

/**
 * IMAP/SMTP adapter for Yahoo, AOL, and custom IMAP providers.
 *
 * Dependencies (install when ready for live testing):
 * - imapflow: IMAP client
 * - nodemailer: SMTP sending
 * - mailparser: MIME parsing
 *
 * For now, this adapter defines the interface and basic structure.
 * Full implementation requires the above packages installed.
 */

function getImapCredentials(account: EmailAccount) {
  if (!account.imap_password_encrypted) {
    throw new Error("IMAP account missing password");
  }
  return {
    host: account.imap_host!,
    port: account.imap_port!,
    username: account.imap_username || account.email_address,
    password: decrypt(account.imap_password_encrypted),
    smtpHost: account.smtp_host!,
    smtpPort: account.smtp_port!,
  };
}

export function createImapAdapter(account: EmailAccount): EmailProviderAdapter {
  return {
    provider: "imap",

    async syncMessages({ since }) {
      const creds = getImapCredentials(account);

      // Dynamic import to avoid bundling issues when packages aren't installed
      const { ImapFlow } = await import("imapflow");
      const { simpleParser } = await import("mailparser");

      const client = new ImapFlow({
        host: creds.host,
        port: creds.port,
        secure: true,
        auth: { user: creds.username, pass: creds.password },
        logger: false,
      });

      const messages: NormalizedMessage[] = [];

      try {
        await client.connect();
        const lock = await client.getMailboxLock("INBOX");

        try {
          const searchCriteria = since
            ? { since: since }
            : { since: new Date(Date.now() - 24 * 60 * 60 * 1000) };

          const uids = await client.search(searchCriteria, { uid: true });

          const uidList = Array.isArray(uids) ? uids.slice(0, 50) : [];
          for (const uid of uidList) {
            const raw = await client.download(String(uid), undefined, { uid: true });
            if (!raw?.content) continue;

            const chunks: Buffer[] = [];
            for await (const chunk of raw.content) {
              chunks.push(Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);
            const parsed = await simpleParser(buffer);

            // Derive thread key from headers
            const threadId =
              parsed.inReplyTo?.toString() ||
              parsed.messageId?.toString() ||
              undefined;

            messages.push({
              providerMessageId: String(uid),
              providerThreadId: threadId,
              fromName: parsed.from?.value?.[0]?.name || undefined,
              fromEmail: parsed.from?.value?.[0]?.address || "",
              toEmails:
                parsed.to
                  ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
                      .flatMap((t) => t.value.map((v) => v.address || ""))
                  : [],
              ccEmails:
                parsed.cc
                  ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
                      .flatMap((c) => c.value.map((v) => v.address || ""))
                  : [],
              subject: parsed.subject || undefined,
              bodyText: parsed.text || undefined,
              bodyHtml: parsed.html || undefined,
              snippet: parsed.text?.slice(0, 200) || undefined,
              receivedAt: parsed.date || new Date(),
              labels: ["INBOX"],
              attachments: (parsed.attachments || []).map((att) => ({
                providerAttachmentId: att.checksum || att.filename || "",
                filename: att.filename || "attachment",
                mimeType: att.contentType || "application/octet-stream",
                sizeBytes: att.size || 0,
                content: att.content,
              })),
            });
          }
        } finally {
          lock.release();
        }

        await client.logout();
      } catch (err) {
        throw new Error(
          `IMAP sync failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      return messages;
    },

    async sendMessage(params: SendMessageInput): Promise<SendMessageResult> {
      const creds = getImapCredentials(account);
      const nodemailer = await import("nodemailer");

      // Port 465 = SSL (secure:true), port 587 = STARTTLS (secure:false + requireTLS:true)
      const isSSL = creds.smtpPort === 465;

      const transport = nodemailer.createTransport({
        host: creds.smtpHost,
        port: creds.smtpPort,
        secure: isSSL,
        requireTLS: !isSSL,
        auth: { user: creds.username, pass: creds.password },
        tls: {
          // Allow self-signed certs in dev; in prod Gmail/Outlook have valid certs
          rejectUnauthorized: true,
        },
      });

      // Verify connection before sending
      try {
        await transport.verify();
      } catch (err) {
        throw new Error(
          `SMTP connection failed for ${creds.smtpHost}:${creds.smtpPort} — ` +
          `${err instanceof Error ? err.message : String(err)}. ` +
          `For Gmail, make sure you are using an App Password, not your regular password.`
        );
      }

      const info = await transport.sendMail({
        from: `"${account.display_name || account.email_address}" <${account.email_address}>`,
        to: params.to.join(", "),
        cc: params.cc?.join(", "),
        subject: params.subject,
        text: params.bodyText,
        html: params.bodyHtml,
        inReplyTo: params.inReplyToMessageId,
        references: params.references?.join(" "),
      });

      return {
        providerMessageId: info.messageId || `sent-${Date.now()}`,
        providerThreadId: undefined,
      };
    },

    async archiveMessage(providerMessageId: string) {
      const creds = getImapCredentials(account);
      const { ImapFlow } = await import("imapflow");

      const client = new ImapFlow({
        host: creds.host,
        port: creds.port,
        secure: true,
        auth: { user: creds.username, pass: creds.password },
        logger: false,
      });

      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        await client.messageMove(providerMessageId, "Archive", { uid: true });
      } finally {
        lock.release();
      }
      await client.logout();
    },

    async deleteMessage(providerMessageId: string) {
      const creds = getImapCredentials(account);
      const { ImapFlow } = await import("imapflow");

      const client = new ImapFlow({
        host: creds.host,
        port: creds.port,
        secure: true,
        auth: { user: creds.username, pass: creds.password },
        logger: false,
      });

      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        await client.messageMove(providerMessageId, "Trash", { uid: true });
      } finally {
        lock.release();
      }
      await client.logout();
    },

    async applyLabel(_providerMessageId: string, _label: string) {
      // IMAP doesn't have labels in the Gmail sense.
      // Moving to a folder is the closest equivalent, but we skip for MVP.
      console.warn("applyLabel not supported for IMAP provider");
    },
  };
}
