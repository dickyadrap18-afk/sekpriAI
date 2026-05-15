import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
    const pathname = request.nextUrl.pathname;
    const isPublic =
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/onboarding" ||
      pathname.startsWith("/api/");
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
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup" ||
    request.nextUrl.pathname === "/onboarding" ||
    request.nextUrl.pathname.startsWith("/api/");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/inbox";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
