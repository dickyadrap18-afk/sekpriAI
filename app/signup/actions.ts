"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  // Validate input
  const parsed = signupSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Invalid input";
    redirect(`/signup?error=${encodeURIComponent(firstError)}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Provide user-friendly error messages
    let message = error.message;
    if (message.includes("invalid")) {
      message = "This email address is not accepted. Please use a real email (e.g., Gmail).";
    } else if (message.includes("already registered")) {
      message = "An account with this email already exists. Try signing in instead.";
    }
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  // If email confirmation is required (no session returned)
  if (data.user && !data.session) {
    redirect(
      `/login?message=${encodeURIComponent("Account created! Check your email to confirm, then sign in here.")}`
    );
  }

  // If confirmation is disabled, user gets a session immediately
  redirect("/inbox");
}
