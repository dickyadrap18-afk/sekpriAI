import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase service-role client for server-side operations.
 * Use ONLY in server modules (features/X/server, app/api).
 * Never expose to the browser.
 * Ref: audit-report.md CQ-01
 */
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
