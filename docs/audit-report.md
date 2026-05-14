# sekpriAI Deep Audit Report

**Date**: 2026-05-14
**Auditor**: security-auditor + code-reviewer agents
**Scope**: Full codebase (app/, components/, features/, lib/, middleware.ts)

---

## Summary

| Severity | Security | UI/UX | Code Quality | Architecture | Total |
|----------|----------|-------|--------------|--------------|-------|
| Critical | 3        | 0     | 0            | 0            | 3     |
| High     | 3        | 3     | 5            | 4            | 15    |
| Medium   | 5        | 3     | 3            | 3            | 14    |
| Low      | 0        | 2     | 0            | 0            | 2     |
| **Total**| **11**   | **8** | **8**        | **7**        | **34**|

---

## 1. SECURITY FINDINGS

### CRITICAL

#### SEC-01: XSS via `dangerouslySetInnerHTML` — No Sanitization
- **File**: `features/email/components/message-detail.tsx` ~line 128
- **Issue**: `<div dangerouslySetInnerHTML={{ __html: message.body_html }} />` renders raw HTML email bodies without sanitization. Email HTML is attacker-controlled.
- **Impact**: Arbitrary JavaScript execution in user's browser session. Cookie theft, session hijacking, phishing.
- **Fix**: Install `dompurify` + `@types/dompurify`, sanitize before rendering.

#### SEC-02: Cron Endpoints Unprotected — No Auth
- **Files**: `app/api/cron/sync/route.ts`, `app/api/scheduled/send/route.ts`
- **Issue**: Both accept unauthenticated POST/GET. Anyone can trigger sync for all users or flush scheduled emails.
- **Impact**: Unauthorized data access, premature email sending, resource exhaustion.
- **Fix**: Validate `Authorization: Bearer <CRON_SECRET>` header.

#### SEC-03: Memory API — Missing User Ownership Check (IDOR)
- **Files**: `app/api/memory/[id]/approve/route.ts`, `reject/route.ts`, `delete/route.ts`
- **Issue**: Routes verify auth but don't filter by `user_id`. Any authenticated user can modify any user's memory items.
- **Impact**: Unauthorized data modification across users.
- **Fix**: Add `.eq("user_id", user.id)` to all memory update queries.

### HIGH

#### SEC-04: SQL Injection via Supabase `.or()` with Unsanitized Input
- **Files**: `features/email/hooks/use-inbox.ts` ~line 30, `features/channels/server/router.ts` ~line 75
- **Issue**: User search input interpolated directly into PostgREST filter string. Special chars (`%`, `_`, `\`) can manipulate queries.
- **Impact**: Data leakage, filter bypass.
- **Fix**: Escape PostgREST special characters before interpolation.

#### SEC-05: OAuth Callback Missing State Parameter (CSRF)
- **Files**: `app/api/auth/callback/gmail/route.ts`, `office365/route.ts`
- **Issue**: No `state` parameter validation. Attacker can craft OAuth redirect to bind their email to victim's session.
- **Impact**: Account takeover via OAuth CSRF.
- **Fix**: Generate random state, store in session, validate on callback.

#### SEC-06: Telegram Notification HTML Injection
- **File**: `features/channels/telegram/notify.ts` ~line 55
- **Issue**: `parse_mode: "HTML"` with unescaped user content (from, subject).
- **Impact**: Display manipulation, link injection in Telegram messages.
- **Fix**: Escape HTML entities or switch to plain text mode.

### MEDIUM

#### SEC-07: No Rate Limiting on Auth
- **Files**: `app/login/actions.ts`, `app/signup/actions.ts`
- **Issue**: No rate limiting on login/signup attempts.
- **Fix**: Rely on Supabase's built-in rate limits + add note in docs.

#### SEC-08: No Error Display on Login Failure
- **Files**: `app/login/page.tsx`, `app/signup/page.tsx`
- **Issue**: Error redirects to `?error=...` but pages never display it.
- **Fix**: Read searchParams and show error message.

#### SEC-09: `as string` on FormData Without Validation
- **Files**: `app/login/actions.ts`, `app/signup/actions.ts`
- **Issue**: `formData.get("email") as string` — no validation of format or presence.
- **Fix**: Validate with zod before passing to Supabase.

#### SEC-10: AI Summarize Route — No Explicit Ownership Check
- **File**: `app/api/ai/summarize/route.ts`
- **Issue**: Fetches message by ID without `user_id` filter. Relies solely on RLS.
- **Fix**: Add `.eq("user_id", user.id)` for defense-in-depth.

#### SEC-11: Draft Route — Same Ownership Concern
- **File**: `app/api/messages/draft/route.ts`
- **Issue**: Same as SEC-10.

---

## 2. UI/UX FINDINGS

### HIGH

#### UX-01: Compose Sheet — No Focus Trap, No Escape, No ARIA Dialog
- **File**: `features/email/components/compose-sheet.tsx`
- **Issue**: Modal has no focus trap, no Escape key handler, no `role="dialog"`, no `aria-modal`.
- **Fix**: Add focus trap, Escape handler, ARIA attributes.

#### UX-02: Search Bar — Missing Accessible Label
- **File**: `features/email/components/search-bar.tsx`
- **Issue**: No `aria-label` on input, no `role="search"` on container.
- **Fix**: Add `aria-label="Search emails"` and `role="search"`.

#### UX-03: Login/Signup — No Loading State on Submit
- **Files**: `app/login/page.tsx`, `app/signup/page.tsx`
- **Issue**: No loading indicator, no button disable during submission.
- **Fix**: Add pending state with `useFormStatus`.

### MEDIUM

#### UX-04: Memory Tabs — Not WAI-ARIA Compliant
- **File**: `features/memory/components/memory-view.tsx`
- **Issue**: Missing `role="tablist"`, `role="tab"`, `role="tabpanel"`, arrow key nav.

#### UX-05: Compose Sheet — Form Doesn't Reset on Prefill Change
- **File**: `features/email/components/compose-sheet.tsx`
- **Issue**: `useState` initializer doesn't re-run when `prefill` changes.
- **Fix**: Add `useEffect` to sync form state.

#### UX-06: WhatsApp Mock — No `aria-live` Region
- **File**: `features/channels/whatsapp/components/whatsapp-mock.tsx`
- **Issue**: New messages not announced to screen readers.

### LOW

#### UX-07: Priority Badge — Color-Only Information
- **File**: `features/email/components/priority-badge.tsx`
- **Issue**: No `aria-label` providing context.

#### UX-08: Inbox View — Uses `alert()` for Feedback
- **File**: `features/email/components/inbox-view.tsx` ~line 75
- **Issue**: `alert()` blocks UI, not accessible. Should use toast.

---

## 3. CODE QUALITY FINDINGS

### HIGH

#### CQ-01: Duplicated `getServiceClient()` Pattern (8 files)
- **Files**: `features/ai/server/process.ts`, `features/rag/server/index.ts`, `features/rag/server/retrieve.ts`, `features/channels/server/router.ts`, `features/channels/telegram/notify.ts`, `features/memory/server/actions.ts`, `features/email/server/sync.ts`, `features/scheduler/server/approval.ts`
- **Fix**: Extract to `lib/supabase/service.ts`.

#### CQ-02: Gmail Provider — Approaching 200 Lines
- **File**: `lib/providers/gmail/index.ts`
- **Fix**: Extract `parseGmailMessage` to `gmail/normalize.ts`.

#### CQ-03: IMAP Provider — Approaching 200 Lines
- **File**: `lib/providers/imap/index.ts`
- **Fix**: Extract parsing and connection logic.

#### CQ-04: Duplicated AI Prompt Retry Pattern (5 files)
- **Files**: All `features/ai/prompts/*.ts`
- **Fix**: Extract `parseWithRetry<T>()` utility.

#### CQ-05: `as never` Type Assertions in OAuth Callbacks
- **Files**: Gmail and Office365 callback routes
- **Fix**: Use proper typing or helper function.

### MEDIUM

#### CQ-06: `eslint-disable` for `require()` in Extract Module
- **File**: `features/rag/server/extract.ts`
- **Fix**: Use dynamic `import()` consistently.

#### CQ-07: Unused `useTransition` Semantics
- **File**: `features/email/hooks/use-inbox.ts`
- **Issue**: `startTransition` wraps async function that doesn't benefit from transition semantics.

#### CQ-08: Office365 Provider — 170 Lines
- **File**: `lib/providers/office365/index.ts`
- **Fix**: Extract `parseGraphMessage`.

---

## 4. ARCHITECTURE FINDINGS

### HIGH

#### ARCH-01: `features/ai/prompts/system.ts` — Missing `server-only`
- **Issue**: System prompt (with security rules) could leak to browser bundle.
- **Fix**: Add `import "server-only"`.

#### ARCH-02: `compose-sheet.tsx` Imports from `lib/supabase/types`
- **Issue**: UI component directly imports from infrastructure layer.
- **Fix**: Import from `features/email/types` instead.

#### ARCH-03: Cross-Feature Dependency: email → ai
- **File**: `features/email/server/sync.ts` imports `features/ai/server/process`
- **Fix**: Acceptable for server orchestration but document the dependency.

#### ARCH-04: Cross-Feature Dependency: channels → ai
- **File**: `features/channels/server/router.ts` imports `features/ai/prompts/parse-channel-intent`
- **Fix**: Same — acceptable for server modules, document it.

### MEDIUM

#### ARCH-05: Cross-Feature Dependency: memory → ai
- **File**: `features/memory/server/actions.ts` imports `features/ai/prompts/extract-memory`

#### ARCH-06: Route Handler Orchestrates Multiple Features
- **File**: `app/api/messages/draft/route.ts` imports from ai + rag
- **Fix**: Acceptable for route handlers (they are orchestrators).

#### ARCH-07: `features/email/types.ts` Re-exports from `lib/supabase/types`
- **Issue**: Creates transitive coupling for type imports.
- **Fix**: Define feature-specific types independently.

---

## 5. FEATURE COMPLETENESS vs BLUEPRINT

Quick gap check against `docs/sekpriAI_Source_of_Truth_Blueprint.md`:

| Feature | Status | Gap |
|---------|--------|-----|
| Multi-user auth | ✅ | — |
| Gmail OAuth + sync | ✅ | State param missing |
| Office 365 OAuth + sync | ✅ | State param missing |
| IMAP/SMTP | ✅ | — |
| Unified inbox | ✅ | — |
| Account switching | ✅ | — |
| Compose/reply/forward | ✅ | Form reset bug |
| Search | ✅ | SQL injection risk |
| Labels | ✅ | — |
| Archive/delete | ✅ | — |
| AI summary | ✅ | — |
| AI priority | ✅ | — |
| AI risk | ✅ | — |
| AI draft reply | ✅ | — |
| Memory extraction | ✅ | — |
| Memory approval | ✅ | IDOR vulnerability |
| RAG (email + attachments) | ✅ | — |
| Telegram binding | ✅ | — |
| Telegram notifications | ✅ | HTML injection |
| Telegram commands | ✅ | — |
| WhatsApp mock | ✅ | — |
| Scheduled sending | ✅ | Cron unprotected |
| Human-in-the-loop approval | ✅ | — |
| PWA manifest | ✅ | — |
| Responsive mobile | ✅ | — |

**All MVP features are implemented.** Issues are security/quality, not missing features.

---

## Recommended Remediation Priority

1. **SEC-01** (XSS) — Install DOMPurify, sanitize HTML
2. **SEC-02** (Cron auth) — Add CRON_SECRET validation
3. **SEC-03** (IDOR) — Add user_id filter to memory routes
4. **SEC-04** (SQL injection) — Escape search input
5. **SEC-05** (OAuth CSRF) — Add state parameter
6. **UX-01** (Focus trap) — Fix compose dialog accessibility
7. **CQ-01** (DRY) — Extract shared service client
8. **CQ-04** (DRY) — Extract prompt retry utility
9. **ARCH-01** (server-only) — Add missing guard
10. Remaining medium/low items
