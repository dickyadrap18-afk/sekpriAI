import { NextResponse } from "next/server";
import { generateOAuthState } from "@/lib/security/oauth-state";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  // Generate and store OAuth state for CSRF protection
  const state = await generateOAuthState();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return NextResponse.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  });
}
