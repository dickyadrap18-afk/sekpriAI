import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/security/crypto";

/**
 * Debug endpoint: test SMTP connection for a specific account.
 * Protected by CRON_SECRET. Remove after debugging.
 * GET /api/debug/smtp?email=wondertechgadget@gmail.com&to=dicky.adrap18@gmail.com
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get("email");
  const to = request.nextUrl.searchParams.get("to");

  if (!email || !to) {
    return NextResponse.json({ error: "Missing ?email= and ?to= params" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: account, error: accErr } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("email_address", email)
    .single();

  if (accErr || !account) {
    return NextResponse.json({ error: "Account not found", detail: accErr?.message }, { status: 404 });
  }

  const result: Record<string, unknown> = {
    account_id: account.id,
    email_address: account.email_address,
    provider: account.provider,
    smtp_host: account.smtp_host,
    smtp_port: account.smtp_port,
    imap_username: account.imap_username,
    has_password: !!account.imap_password_encrypted,
  };

  // Try to decrypt password
  let password: string;
  try {
    password = decrypt(account.imap_password_encrypted);
    result.password_length = password.length;
    result.password_preview = password.slice(0, 4) + "****";
  } catch (e) {
    return NextResponse.json({ ...result, error: "Decrypt failed: " + (e instanceof Error ? e.message : String(e)) });
  }

  // Try SMTP verify
  try {
    const nodemailer = await import("nodemailer");
    const isSSL = account.smtp_port === 465;
    const transport = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: isSSL,
      requireTLS: !isSSL,
      auth: { user: account.imap_username || account.email_address, pass: password },
      tls: { rejectUnauthorized: true },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    await transport.verify();
    result.smtp_verify = "OK";

    // Try actual send
    const info = await transport.sendMail({
      from: `"${account.display_name || account.email_address}" <${account.email_address}>`,
      to,
      subject: "[sekpriAI Debug] SMTP Test",
      text: `SMTP test from sekpriAI debug endpoint.\nAccount: ${account.email_address}\nTimestamp: ${new Date().toISOString()}`,
    });

    result.send_result = "OK";
    result.message_id = info.messageId;
    result.accepted = info.accepted;
    result.rejected = info.rejected;
    result.response = info.response;

  } catch (e) {
    result.smtp_error = e instanceof Error ? e.message : String(e);
    if ((e as NodeJS.ErrnoException).code) {
      result.error_code = (e as NodeJS.ErrnoException).code;
    }
  }

  return NextResponse.json(result);
}
