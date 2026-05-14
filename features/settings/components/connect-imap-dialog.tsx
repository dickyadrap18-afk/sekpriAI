"use client";

import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { showToast } from "@/components/toast";

interface AccountRow {
  id: string;
  provider: string;
  email_address: string;
  display_name: string | null;
  sync_status: string;
  last_synced_at: string | null;
  created_at: string;
}

interface ConnectImapDialogProps {
  open: boolean;
  onClose: () => void;
  onConnected: (account: AccountRow) => void;
}

const PRESETS: Record<string, { imap_host: string; imap_port: number; smtp_host: string; smtp_port: number }> = {
  gmail: {
    imap_host: "imap.gmail.com",
    imap_port: 993,
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
  },
  outlook: {
    imap_host: "outlook.office365.com",
    imap_port: 993,
    smtp_host: "smtp.office365.com",
    smtp_port: 587,
  },
  yahoo: {
    imap_host: "imap.mail.yahoo.com",
    imap_port: 993,
    smtp_host: "smtp.mail.yahoo.com",
    smtp_port: 587,
  },
  custom: {
    imap_host: "",
    imap_port: 993,
    smtp_host: "",
    smtp_port: 587,
  },
};

interface FormState {
  display_name: string;
  email_address: string;
  username: string;
  password: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
}

export function ConnectImapDialog({ open, onClose, onConnected }: ConnectImapDialogProps) {
  const [preset, setPreset] = useState<string>("gmail");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>({
    display_name: "",
    email_address: "",
    username: "",
    password: "",
    ...PRESETS.gmail,
  });

  function applyPreset(key: string) {
    setPreset(key);
    setForm((prev) => ({ ...prev, ...PRESETS[key] }));
  }

  function set(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.email_address.trim()) e.email_address = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_address)) e.email_address = "Invalid email";
    if (!form.username.trim()) e.username = "Required";
    if (!form.password.trim()) e.password = "Required";
    if (!form.imap_host.trim()) e.imap_host = "Required";
    if (!form.smtp_host.trim()) e.smtp_host = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/accounts/imap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_address: form.email_address.trim(),
          display_name: form.display_name.trim() || undefined,
          username: form.username.trim(),
          password: form.password,
          imap_host: form.imap_host.trim(),
          imap_port: Number(form.imap_port),
          smtp_host: form.smtp_host.trim(),
          smtp_port: Number(form.smtp_port),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to connect account", "error");
        return;
      }

      // Fetch the newly created account row to pass back
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: account } = await supabase
        .from("email_accounts")
        .select("id, provider, email_address, display_name, sync_status, last_synced_at, created_at")
        .eq("email_address", form.email_address.trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (account) {
        onConnected(account as AccountRow);
      }

      // Reset form
      setForm({
        display_name: "",
        email_address: "",
        username: "",
        password: "",
        ...PRESETS[preset],
      });
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="imap-dialog-title"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-t-xl sm:rounded-xl border bg-background shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 sticky top-0 bg-background z-10">
          <h3 id="imap-dialog-title" className="text-sm font-semibold">
            Connect Email Account
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Provider presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Provider</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                    preset === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  {key === "custom" ? "Other" : key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            {preset === "gmail" && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
                Gmail requires an <strong>App Password</strong> (not your regular password).{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Generate one here
                </a>
                .
              </p>
            )}
          </div>

          {/* Display name */}
          <Field
            label="Display Name"
            hint="Optional — shown in the inbox"
            error={errors.display_name}
          >
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              placeholder="My Gmail"
              className="input-base"
            />
          </Field>

          {/* Email */}
          <Field label="Email Address" error={errors.email_address} required>
            <input
              type="email"
              value={form.email_address}
              onChange={(e) => {
                set("email_address", e.target.value);
                // Auto-fill username if empty
                if (!form.username) set("username", e.target.value);
              }}
              placeholder="you@gmail.com"
              className="input-base"
              autoComplete="email"
            />
          </Field>

          {/* Username */}
          <Field label="IMAP Username" hint="Usually your email address" error={errors.username} required>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="you@gmail.com"
              className="input-base"
              autoComplete="username"
            />
          </Field>

          {/* Password */}
          <Field label="Password / App Password" error={errors.password} required>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••••••"
                className="input-base pr-9"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-accent"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </Field>

          {/* IMAP / SMTP — collapsible for non-custom */}
          <details open={preset === "custom"} className="group">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground select-none list-none flex items-center gap-1">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              Server settings
              {preset !== "custom" && (
                <span className="ml-1 text-muted-foreground/60">(auto-filled)</span>
              )}
            </summary>

            <div className="mt-3 space-y-3 pl-1">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Field label="IMAP Host" error={errors.imap_host} required>
                    <input
                      type="text"
                      value={form.imap_host}
                      onChange={(e) => set("imap_host", e.target.value)}
                      placeholder="imap.gmail.com"
                      className="input-base"
                    />
                  </Field>
                </div>
                <Field label="Port" error={errors.imap_port}>
                  <input
                    type="number"
                    value={form.imap_port}
                    onChange={(e) => set("imap_port", Number(e.target.value))}
                    className="input-base"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Field label="SMTP Host" error={errors.smtp_host} required>
                    <input
                      type="text"
                      value={form.smtp_host}
                      onChange={(e) => set("smtp_host", e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="input-base"
                    />
                  </Field>
                </div>
                <Field label="Port" error={errors.smtp_port}>
                  <input
                    type="number"
                    value={form.smtp_port}
                    onChange={(e) => set("smtp_port", Number(e.target.value))}
                    className="input-base"
                  />
                </Field>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Connecting..." : "Connect Account"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1 font-normal text-muted-foreground/70">— {hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
