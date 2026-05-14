"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function login(formData: FormData) {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  // Validate input
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Invalid input";
    redirect(`/login?error=${encodeURIComponent(firstError)}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    let message = error.message;
    if (message.includes("Invalid login credentials")) {
      message = "Invalid email or password. Please check and try again.";
    } else if (message.includes("Email not confirmed")) {
      message = "Please confirm your email address first. Check your inbox for the confirmation link.";
    } else if (message.includes("rate")) {
      message = "Too many login attempts. Please wait a moment and try again.";
    }
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/inbox");
}
