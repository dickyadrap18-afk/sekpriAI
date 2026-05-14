import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOAuthState } from "@/lib/security/oauth-state";

/**
 * Initiate Gmail OAuth flow with state parameter.
 * Ref: specs/006-provider-integration-spec.md §2, audit-report.md SEC-05
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL!));
  }

  const state = await generateOAuthState();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/gmail`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
