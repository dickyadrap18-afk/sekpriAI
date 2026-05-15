import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/inbox";

  // Build the redirect target using the app's public URL so it always
  // points to the right host (avoids localhost vs production mismatch).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
  const redirectTo = new URL(next.startsWith("/") ? next : `/${next}`, appUrl);

  if (!code) {
    // No code — send to login
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const response = NextResponse.redirect(redirectTo);

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    const errUrl = new URL("/login", appUrl);
    errUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(errUrl);
  }

  return response;
}
