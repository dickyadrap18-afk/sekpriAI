/**
 * Feature-level types for the email module.
 * UI-specific types live here; database types are re-exported for convenience
 * so consumers don't need to know where they originate.
 * Ref: specs/002-design-spec.md, specs/004-erd.md
 */

// Re-export database types used throughout the email feature.
// Consumers may also import directly from @/lib/supabase/types.
export type { Message, EmailAccount } from "@/lib/supabase/types";

// ── UI-specific types ──────────────────────────────────────────────────────

export interface MessageListItem {
  id: string;
  account_id: string;
  subject: string | null;
  from_name: string | null;
  from_email: string;
  snippet: string | null;
  received_at: string;
  is_read: boolean;
  is_starred?: boolean;
  labels: string[];
  ai_summary?: string | null;
  ai_priority: "high" | "medium" | "low" | null;
  folder?: string;
  provider?: string;
}

export interface ComposeFormData {
  from_account_id: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  in_reply_to_message_id?: string;
  forward_of_message_id?: string;
  draft_id?: string;
  schedule_for?: string;
}

export type ComposeMode = "new" | "reply" | "forward";

export interface InboxFilters {
  folder?: string;
  account_id?: string | null;
  search?: string;
  priority?: string;
  label?: string;
}
