/**
 * Feature-level types for the email module.
 * These extend the database types with UI-specific concerns.
 * Ref: specs/002-design-spec.md, specs/004-erd.md
 */

import type { Message, EmailAccount } from "@/lib/supabase/types";

export type { Message, EmailAccount };

export interface MessageListItem {
  id: string;
  from_name: string | null;
  from_email: string;
  subject: string | null;
  snippet: string | null;
  received_at: string | null;
  is_read: boolean;
  labels: string[];
  ai_priority: "high" | "medium" | "low" | null;
  provider: string;
  account_id: string;
}

export interface ComposeFormData {
  from_account_id: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  in_reply_to_message_id?: string;
  schedule_for?: string;
  draft_id?: string;
}

export type ComposeMode = "new" | "reply" | "forward";

export interface InboxFilters {
  account_id?: string;
  search?: string;
  label?: string;
  priority?: "high" | "medium" | "low";
  folder?: "inbox" | "starred" | "important" | "sent" | "drafts" | "archive" | "trash";
}
