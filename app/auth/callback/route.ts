import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/inbox";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  // The response object must be created BEFORE the Supabase client so that
  // setAll() can write session cookies onto the same response that gets returned.
  const redirectTo = new URL(next.startsWith("/") ? next : `/${next}`, appUrl);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read cookies from the incoming request (includes PKCE verifier)
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write session cookies onto the redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] error:", error.message, "| code:", error.code ?? "n/a");
    const errUrl = new URL("/login", appUrl);
    errUrl.searchParams.set("error", "auth_callback_failed");
    errUrl.searchParams.set("reason", error.message);
    return NextResponse.redirect(errUrl);
  }

  return response;
}
