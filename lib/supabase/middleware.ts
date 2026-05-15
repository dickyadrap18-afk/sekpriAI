import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── OAuth code forwarding ──────────────────────────────────────────────────
  // Supabase redirects back to the Site URL with ?code=... appended.
  // If the code lands on any page other than /auth/callback, forward it there
  // so exchangeCodeForSession() runs in the right server-side handler.
  const code = searchParams.get("code");
  if (code && pathname !== "/auth/callback") {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    // Keep only the code (and optional next) — drop everything else
    callbackUrl.search = "";
    callbackUrl.searchParams.set("code", code);
    const next = searchParams.get("next");
    if (next) callbackUrl.searchParams.set("next", next);
    return NextResponse.redirect(callbackUrl);
  }
  // ──────────────────────────────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() returns { data: { user }, error } — never throws.
  // "Invalid Refresh Token" comes back as error.code === 'refresh_token_not_found'
  // Treat it as unauthenticated and clear stale cookies silently.
  const { data: { user }, error } = await supabase.auth.getUser();

  // If refresh token is invalid/expired, clear stale sb- cookies
  // so the browser stops retrying with the bad token.
  if (error && (error as { code?: string }).code === "refresh_token_not_found") {
    const response = NextResponse.next({ request });
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith("sb-")) {
        response.cookies.delete(name);
      }
    });
    // Redirect to login only if not already on a public route
    const isPublic =
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/onboarding" ||
      pathname === "/auth/callback" ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms");
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      const redirect = NextResponse.redirect(url);
      request.cookies.getAll().forEach(({ name }) => {
        if (name.startsWith("sb-")) redirect.cookies.delete(name);
      });
      return redirect;
    }
    return response;
  }

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding" ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/inbox";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
