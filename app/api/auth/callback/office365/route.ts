import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/security/crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/settings?error=office365_auth_failed", request.url)
    );
  }

  // Exchange code for tokens
  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/office365`,
        grant_type: "authorization_code",
        scope: "Mail.ReadWrite Mail.Send offline_access User.Read",
      }),
    }
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/settings?error=office365_token_exchange_failed", request.url)
    );
  }

  const tokens = await tokenRes.json();

  // Get user profile from Graph
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json();

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Upsert email account
  await supabase.from("email_accounts").upsert(
    {
      user_id: user.id,
      provider: "office365",
      email_address: profile.mail || profile.userPrincipalName,
      display_name: profile.displayName || profile.mail,
      access_token_encrypted: encrypt(tokens.access_token),
      refresh_token_encrypted: encrypt(tokens.refresh_token),
      sync_status: "idle",
    },
    { onConflict: "user_id,provider,email_address" as never }
  );

  return NextResponse.redirect(
    new URL("/settings?success=office365_connected", request.url)
  );
}
