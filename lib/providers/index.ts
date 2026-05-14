import "server-only";

import type { EmailAccount } from "@/lib/supabase/types";
import type { EmailProviderAdapter } from "./types";
import { createGmailAdapter } from "./gmail";
import { createOffice365Adapter } from "./office365";
import { createImapAdapter } from "./imap";

/**
 * Factory: resolve the correct adapter for an email account.
 * This is the ONLY entry point for provider logic from feature modules.
 */
export function createAdapter(account: EmailAccount): EmailProviderAdapter {
  switch (account.provider) {
    case "gmail":
      return createGmailAdapter(account);
    case "office365":
      return createOffice365Adapter(account);
    case "imap":
      return createImapAdapter(account);
    default:
      throw new Error(`Unknown provider: ${account.provider}`);
  }
}
