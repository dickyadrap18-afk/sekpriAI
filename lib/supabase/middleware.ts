import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── /auth/callback — let the route handler deal with it untouched ─────────
  // Do NOT call getUser() here — it would consume the PKCE verifier cookie
  // before exchangeCodeForSession() in the route handler gets a chance to use it.
  if (pathname === "/auth/callback") {
    return NextResponse.next({ request });
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ── OAuth code forwarding ──────────────────────────────────────────────────
  // Supabase redirects back to the Site URL with ?code=... appended.
  // If the code lands on any page other than /auth/callback, forward it there
  // so exchangeCodeForSession() runs in the right server-side handler.
  const code = searchParams.get("code");
  if (code) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
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

  const { data: { user }, error } = await supabase.auth.getUser();

  // If refresh token is invalid/expired, clear stale sb- cookies
  if (error && (error as { code?: string }).code === "refresh_token_not_found") {
    const response = NextResponse.next({ request });
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith("sb-")) response.cookies.delete(name);
    });
    const isPublic = isPublicPath(pathname);
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

  if (!user && !isPublicPath(pathname)) {
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

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms")
  );
}
