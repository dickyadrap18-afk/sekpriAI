import "server-only";

import type { EmailAccount } from "@/lib/supabase/types";
import { decrypt } from "@/lib/security/crypto";

export async function getAccessToken(account: EmailAccount): Promise<string> {
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
  return data.access_token as string;
}
