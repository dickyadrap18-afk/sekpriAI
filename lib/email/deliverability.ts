import "server-only";

/**
 * Email deliverability utilities.
 * Prevents AI-generated emails from being flagged as spam.
 *
 * Spam filters (SpamAssassin, Gmail, Outlook, Yahoo) score emails based on:
 * - Content patterns (ALL CAPS, excessive punctuation, spam keywords)
 * - Header completeness (missing Date, Message-ID, proper From)
 * - Sending behavior (volume, frequency, bounce rate)
 * - Structural issues (HTML without text, broken MIME)
 */

// ── Spam trigger patterns ──────────────────────────────────────────────────

const SPAM_PATTERNS: { pattern: RegExp; reason: string; severity: "block" | "warn" }[] = [
  // Hard blocks — these almost always trigger spam filters
  { pattern: /\b(click here|click now|act now|limited time|urgent|free money|make money fast)\b/i, reason: "spam trigger phrase", severity: "block" },
  { pattern: /\b(winner|you've been selected|congratulations you won|claim your prize)\b/i, reason: "lottery/prize spam phrase", severity: "block" },
  { pattern: /\b(100% free|no cost|risk free|guaranteed|no obligation)\b/i, reason: "marketing spam phrase", severity: "block" },
  { pattern: /\b(unsubscribe|opt.?out|remove me from)\b/i, reason: "bulk email indicator", severity: "warn" },
  { pattern: /[A-Z]{10,}/, reason: "excessive ALL CAPS", severity: "warn" },
  { pattern: /!{3,}/, reason: "excessive exclamation marks", severity: "warn" },
  { pattern: /\${2,}/, reason: "excessive dollar signs", severity: "warn" },
  { pattern: /(https?:\/\/[^\s]+){5,}/i, reason: "too many URLs", severity: "warn" },
  { pattern: /\b(viagra|cialis|pharmacy|prescription|medication)\b/i, reason: "pharmaceutical spam", severity: "block" },
  { pattern: /\b(bitcoin|crypto|investment opportunity|passive income)\b/i, reason: "financial spam phrase", severity: "warn" },
];

export interface DeliverabilityCheck {
  safe: boolean;
  score: number;        // 0-100, higher = more likely spam
  warnings: string[];
  blocked: boolean;
  blockedReason?: string;
}

/**
 * Analyze email content for spam signals.
 * Returns a score and list of issues.
 */
export function checkDeliverability(subject: string, body: string): DeliverabilityCheck {
  const text = `${subject} ${body}`;
  const warnings: string[] = [];
  let score = 0;
  let blocked = false;
  let blockedReason: string | undefined;

  for (const { pattern, reason, severity } of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      if (severity === "block") {
        blocked = true;
        blockedReason = reason;
        score += 40;
      } else {
        warnings.push(reason);
        score += 15;
      }
    }
  }

  // Check subject line issues
  if (subject.length > 78) { warnings.push("subject too long (>78 chars)"); score += 5; }
  if (/^re:/i.test(subject) && !/^re: .+/i.test(subject)) { warnings.push("malformed Re: subject"); score += 5; }
  if (subject === subject.toUpperCase() && subject.length > 5) { warnings.push("subject all caps"); score += 10; }

  // Check body issues
  const wordCount = body.split(/\s+/).length;
  if (wordCount < 5) { warnings.push("body too short"); score += 10; }
  if (body.length > 50000) { warnings.push("body too long"); score += 5; }

  // HTML-only without text alternative (handled at send level)
  const htmlRatio = (body.match(/<[^>]+>/g) || []).length;
  if (htmlRatio > 20 && !body.replace(/<[^>]+>/g, "").trim()) {
    warnings.push("HTML-only body without plain text");
    score += 15;
  }

  return {
    safe: score < 30 && !blocked,
    score: Math.min(score, 100),
    warnings,
    blocked,
    blockedReason,
  };
}

/**
 * Clean AI-generated text to reduce spam signals.
 * Fixes common AI writing patterns that trigger filters.
 */
export function sanitizeEmailContent(text: string): string {
  return text
    // Remove excessive punctuation
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    .replace(/\.{4,}/g, "...")
    // Normalize whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    // Remove zero-width characters (sometimes added by AI)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Fix ALL CAPS words (keep acronyms ≤4 chars)
    .replace(/\b([A-Z]{5,})\b/g, (match) => {
      // Keep if it looks like an acronym or proper noun context
      return match.length > 8 ? match.charAt(0) + match.slice(1).toLowerCase() : match;
    })
    .trim();
}

/**
 * Build complete SMTP headers for maximum deliverability.
 * These headers are checked by spam filters and email clients.
 */
export function buildDeliverabilityHeaders(params: {
  messageId: string;
  fromEmail: string;
  inReplyTo?: string;
  isAiGenerated?: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = {
    // Standard headers that improve trust
    "Message-ID": `<${params.messageId}>`,
    "Date": new Date().toUTCString(),
    "MIME-Version": "1.0",

    // Priority — "3" = normal, avoids spam triggers from "1" (high)
    "X-Priority": "3",
    "X-MSMail-Priority": "Normal",
    "Importance": "Normal",

    // Mailer identification — honest, not spoofed
    "X-Mailer": "sekpriAI/1.0",

    // Prevent auto-replies and out-of-office loops
    "Auto-Submitted": "auto-generated",
    "X-Auto-Response-Suppress": "OOF, AutoReply",

    // Feedback loop — important for bulk senders
    "Precedence": "normal",
  };

  if (params.inReplyTo) {
    headers["In-Reply-To"] = params.inReplyTo;
    // Replies have much better deliverability — mark as conversation
    headers["Auto-Submitted"] = "auto-replied";
  }

  // Transparent AI disclosure — some filters reward honesty
  // Also required by emerging regulations (EU AI Act)
  if (params.isAiGenerated) {
    headers["X-AI-Generated"] = "assisted";  // "assisted" not "generated" — human reviewed
  }

  return headers;
}

/**
 * Generate a proper RFC 5322 Message-ID.
 * Format: <timestamp.random@domain>
 */
export function generateMessageId(fromEmail: string): string {
  const domain = fromEmail.split("@")[1] || "mail.local";
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}.${random}@${domain}`;
}

/**
 * Rate limit check — prevent sending too many emails too fast.
 * Returns true if sending is allowed.
 *
 * Simple in-memory rate limiter (per process).
 * For production, use Redis or Supabase-based rate limiting.
 */
const sendCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(accountId: string, limitPerHour = 20): boolean {
  const now = Date.now();
  const entry = sendCounts.get(accountId);

  if (!entry || now > entry.resetAt) {
    sendCounts.set(accountId, { count: 1, resetAt: now + 3600000 });
    return true;
  }

  if (entry.count >= limitPerHour) {
    return false;
  }

  entry.count++;
  return true;
}
