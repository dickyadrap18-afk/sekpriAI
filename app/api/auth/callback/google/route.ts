import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { validateOAuthState } from "@/lib/security/oauth-state";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/login?error=google_auth_failed`, request.url)
    );
  }

  // Validate OAuth state parameter (SEC-05)
  const stateValid = await validateOAuthState(state);
  if (!stateValid) {
    return NextResponse.redirect(
      new URL("/login?error=google_auth_invalid_state", request.url)
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
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/login?error=google_token_exchange_failed", request.url)
    );
  }

  const tokens = await tokenRes.json();

  // Get user info from Google
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  const profile = await profileRes.json();

  // Create Supabase client
  const response = NextResponse.redirect(new URL("/inbox", request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Try to sign in with ID token first (requires Supabase Google provider enabled)
  const { data: idTokenData, error: idTokenError } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: tokens.id_token,
  });

  // If ID token sign-in fails, try to find or create user with email
  if (idTokenError) {
    console.log("ID token sign-in failed, trying email-based auth:", idTokenError.message);
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", profile.email)
      .single();

    if (existingUser) {
      // User exists, create a session manually
      // This is a fallback - ideally Supabase Google provider should be configured
      return NextResponse.redirect(
        new URL("/login?error=google_auth_config_required", request.url)
      );
    } else {
      // Create new user via email signup with a random password
      // User can reset password later if needed
      const randomPassword = crypto.randomUUID();
      const { error: signUpError } = await supabase.auth.signUp({
        email: profile.email,
        password: randomPassword,
        options: {
          data: {
            full_name: profile.name,
            avatar_url: profile.picture,
            provider: "google",
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/inbox`,
        },
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        return NextResponse.redirect(
          new URL("/login?error=google_auth_failed", request.url)
        );
      }

      // Sign in the newly created user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: randomPassword,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        return NextResponse.redirect(
          new URL("/login?error=google_auth_failed", request.url)
        );
      }
    }
  }

  return response;
}
