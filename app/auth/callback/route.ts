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

  // Response must be created before the Supabase client so setAll() can
  // write session cookies onto the same response object that gets returned.
  // We'll update the redirect target after we know if this is a new user.
  const response = NextResponse.redirect(new URL("/inbox", appUrl));

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
    console.error("[auth/callback] error:", error.message, "| code:", error.code ?? "n/a");
    const errUrl = new URL("/login", appUrl);
    errUrl.searchParams.set("error", "auth_callback_failed");
    errUrl.searchParams.set("reason", error.message);
    return NextResponse.redirect(errUrl);
  }

  // Detect new users by checking user_metadata.onboarding_done.
  // On first OAuth login this flag is absent → send to onboarding.
  // On subsequent logins it's true → send to inbox (or requested next).
  const { data: { user } } = await supabase.auth.getUser();
  const onboardingDone = user?.user_metadata?.onboarding_done === true;

  const destination = onboardingDone
    ? (next.startsWith("/") ? next : `/${next}`)
    : "/onboarding";

  return NextResponse.redirect(new URL(destination, appUrl));
}
