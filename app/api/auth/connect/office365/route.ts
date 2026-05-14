import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOAuthState } from "@/lib/security/oauth-state";

/**
 * Initiate Office 365 OAuth flow with state parameter.
 * Ref: specs/006-provider-integration-spec.md §3, audit-report.md SEC-05
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
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/office365`,
    response_type: "code",
    scope: "Mail.ReadWrite Mail.Send offline_access User.Read",
    state,
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  );
}
