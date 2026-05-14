/**
 * Database types matching the schema in specs/004-erd.md.
 * These are manually maintained until we set up Supabase CLI type generation.
 */

export type Provider = "gmail" | "office365" | "imap";
export type AIPriority = "high" | "medium" | "low";
export type AIRiskLevel = "low" | "medium" | "high";
export type MemoryStatus = "pending" | "active" | "rejected" | "deleted";
export type ScheduledEmailStatus = "pending" | "approved" | "sent" | "cancelled" | "failed";
export type ApprovalKind = "send" | "schedule" | "memory_activate";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";
export type RAGSourceType = "email" | "attachment" | "memory";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  provider: Provider;
  provider_label: string | null;
  email_address: string;
  display_name: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  imap_host: string | null;
  imap_port: number | null;
  smtp_host: string | null;
  smtp_port: number | null;
  imap_username: string | null;
  imap_password_encrypted: string | null;
  last_synced_at: string | null;
  sync_status: string;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  account_id: string;
  provider: string;
  provider_message_id: string;
  provider_thread_id: string | null;
  thread_id: string | null;
  from_name: string | null;
  from_email: string;
  to_emails: string[];
  cc_emails: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  received_at: string | null;
  is_read: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  labels: string[];
  ai_summary: string | null;
  ai_priority: AIPriority | null;
  ai_priority_reason: string | null;
  ai_risk_level: AIRiskLevel | null;
  ai_risk_reason: string | null;
  ai_processed_at: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  user_id: string;
  message_id: string;
  provider_attachment_id: string | null;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string | null;
  extracted_text: string | null;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  user_id: string;
  source_message_id: string | null;
  memory_type: string | null;
  content: string;
  status: MemoryStatus;
  confidence: number | null;
  created_by: string;
  approved_at: string | null;
  created_at: string;
}

export interface ScheduledEmail {
  id: string;
  user_id: string;
  account_id: string;
  payload: Record<string, unknown>;
  scheduled_for: string;
  approved_at: string | null;
  sent_at: string | null;
  status: ScheduledEmailStatus;
  error_text: string | null;
  created_at: string;
}

export interface TelegramBinding {
  id: string;
  user_id: string;
  binding_code: string | null;
  telegram_user_id: string | null;
  telegram_chat_id: string | null;
  bound_at: string | null;
  created_at: string;
}

export interface AIAction {
  id: string;
  user_id: string;
  feature: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  model: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  user_id: string;
  message_id: string | null;
  scheduled_email_id: string | null;
  kind: ApprovalKind;
  payload: Record<string, unknown> | null;
  status: ApprovalStatus;
  decided_at: string | null;
  created_at: string;
}
