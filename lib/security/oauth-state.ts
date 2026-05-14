import "server-only";

import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_SECONDS = 600; // 10 minutes

/**
 * Generate and store an OAuth state parameter in a secure cookie.
 * Prevents OAuth CSRF attacks.
 * Ref: audit-report.md SEC-05
 */
export async function generateOAuthState(): Promise<string> {
  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });

  return state;
}

/**
 * Validate the OAuth state parameter from the callback against the stored cookie.
 * Returns true if valid, false if missing or mismatched.
 */
export async function validateOAuthState(state: string | null): Promise<boolean> {
  if (!state) return false;

  const cookieStore = await cookies();
  const stored = cookieStore.get(STATE_COOKIE)?.value;

  // Clear the cookie regardless of outcome (one-time use)
  cookieStore.delete(STATE_COOKIE);

  if (!stored) return false;

  return stored === state;
}
