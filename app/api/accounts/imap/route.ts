import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/security/crypto";

/**
 * Save IMAP account credentials (encrypted).
 * Ref: specs/006-provider-integration-spec.md §4
 */

const imapSchema = z.object({
  email_address: z.string().email(),
  display_name: z.string().optional(),
  imap_host: z.string().min(1),
  imap_port: z.number().int().positive(),
  smtp_host: z.string().min(1),
  smtp_port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = imapSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data } = parsed;

  const { error } = await supabase.from("email_accounts").insert({
    user_id: user.id,
    provider: "imap",
    email_address: data.email_address,
    display_name: data.display_name || data.email_address,
    imap_host: data.imap_host,
    imap_port: data.imap_port,
    smtp_host: data.smtp_host,
    smtp_port: data.smtp_port,
    imap_username: data.username,
    imap_password_encrypted: encrypt(data.password),
    sync_status: "idle",
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to save account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
