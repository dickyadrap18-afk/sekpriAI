/**
 * EmailProviderAdapter contract.
 * Ref: specs/003-technical-spec.md §4, specs/006-provider-integration-spec.md
 *
 * All provider adapters must implement this interface.
 * UI components must NEVER import this file directly.
 */

export type Provider = "gmail" | "office365" | "imap";

export interface NormalizedMessage {
  providerMessageId: string;
  providerThreadId?: string;
  fromName?: string;
  fromEmail: string;
  toEmails: string[];
  ccEmails: string[];
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  snippet?: string;
  receivedAt: Date;
  labels: string[];
  attachments: NormalizedAttachment[];
}

export interface NormalizedAttachment {
  providerAttachmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  content?: Buffer; // raw content for storage upload
}

export interface SendMessageInput {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  inReplyToMessageId?: string;
  references?: string[];
  attachments?: { filename: string; mimeType: string; storagePath: string }[];
  isAiGenerated?: boolean;  // Flag for deliverability headers + content checks
}

export interface SendMessageResult {
  providerMessageId: string;
  providerThreadId?: string;
}

export interface EmailProviderAdapter {
  provider: Provider;
  syncMessages(params: {
    accountId: string;
    since?: Date;
  }): Promise<NormalizedMessage[]>;
  sendMessage(params: SendMessageInput): Promise<SendMessageResult>;
  archiveMessage(providerMessageId: string): Promise<void>;
  deleteMessage(providerMessageId: string): Promise<void>;
  applyLabel(providerMessageId: string, label: string): Promise<void>;
}
