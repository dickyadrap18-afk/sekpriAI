import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/security/crypto";
import { validateOAuthState } from "@/lib/security/oauth-state";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/settings?error=gmail_auth_failed", request.url)
    );
  }

  // Validate OAuth state parameter (SEC-05)
  const stateValid = await validateOAuthState(state);
  if (!stateValid) {
    return NextResponse.redirect(
      new URL("/settings?error=gmail_auth_invalid_state", request.url)
    );
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/gmail`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/settings?error=gmail_token_exchange_failed", request.url)
    );
  }

  const tokens = await tokenRes.json();

  // Get user email from Google
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
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
      provider: "gmail",
      email_address: profile.email,
      display_name: profile.name || profile.email,
      access_token_encrypted: encrypt(tokens.access_token),
      refresh_token_encrypted: encrypt(tokens.refresh_token),
      sync_status: "idle",
    },
    { onConflict: "user_id,provider,email_address" as never }
  );

  return NextResponse.redirect(
    new URL("/settings?success=gmail_connected", request.url)
  );
}
