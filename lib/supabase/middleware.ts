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

  // getUser() may throw "Invalid Refresh Token" when the stored token has
  // expired or been revoked (e.g., user signed out on another device, or
  // Supabase rotated the token). Treat this as unauthenticated — clear the
  // stale auth cookies and redirect to login.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err: unknown) {
    const isAuthError =
      err !== null &&
      typeof err === "object" &&
      "__isAuthError" in err &&
      (err as { __isAuthError: boolean }).__isAuthError;

    if (isAuthError) {
      // Clear stale auth cookies so the browser doesn't keep retrying
      const clearResponse = NextResponse.redirect(
        new URL("/login", request.url)
      );
      // Delete all Supabase auth cookies
      request.cookies.getAll().forEach(({ name }) => {
        if (name.startsWith("sb-")) {
          clearResponse.cookies.delete(name);
        }
      });
      return clearResponse;
    }
    // Non-auth errors: log and treat as unauthenticated
    console.error("[middleware] getUser error:", err);
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
