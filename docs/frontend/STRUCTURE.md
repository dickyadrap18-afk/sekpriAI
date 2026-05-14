# Frontend Structure

Peta folder dan file untuk kontributor yang fokus di frontend web.

---

## Folder Map

```
sekpriAI/
│
├── app/                          ← Next.js App Router (FRONTEND)
│   ├── (app)/                    ← Protected routes (requires auth)
│   │   ├── inbox/page.tsx        ← Email dashboard
│   │   ├── memory/page.tsx       ← AI Memory management
│   │   ├── channels/page.tsx     ← Telegram/WhatsApp channels
│   │   ├── settings/page.tsx     ← Account settings
│   │   ├── layout.tsx            ← Auth guard + AppShell wrapper
│   │   └── actions.ts            ← Server actions (signOut)
│   ├── api/                      ← API routes (BACKEND — tidak disentuh dari frontend)
│   ├── login/page.tsx            ← Login page
│   ├── signup/page.tsx           ← Signup page
│   ├── page.tsx                  ← Homepage (public)
│   ├── layout.tsx                ← Root layout (metadata, fonts, ToastProvider)
│   ├── globals.css               ← Design tokens + global styles
│   └── favicon.ico               ← App icon (custom sekpriAI)
│
├── components/                   ← Shared UI components (FRONTEND)
│   ├── app-shell.tsx             ← Sidebar + layout wrapper + AmbientBg
│   ├── ambient-bg.tsx            ← Canvas particles + breathing orbs
│   ├── hero-canvas.tsx           ← Three.js homepage hero scene
│   ├── toast.tsx                 ← Global toast notification system
│   └── submit-button.tsx         ← Form submit button with loading state
│
├── features/                     ← Feature modules (MIXED frontend + backend logic)
│   ├── email/
│   │   ├── components/           ← Email UI components (FRONTEND)
│   │   │   ├── inbox-view.tsx    ← Root orchestrator — owns all inbox state
│   │   │   ├── inbox-toolbar.tsx ← Search + filters + compose button
│   │   │   ├── message-list.tsx  ← Scrollable list + pagination + skeletons
│   │   │   ├── message-list-item.tsx ← Single email row
│   │   │   ├── message-detail.tsx    ← Full email view + inline reply
│   │   │   ├── compose-sheet.tsx     ← New/reply/forward modal
│   │   │   ├── priority-badge.tsx    ← High/medium/low pill
│   │   │   ├── search-bar.tsx        ← Debounced search input
│   │   │   ├── account-switcher.tsx  ← Account filter select
│   │   │   ├── folder-nav.tsx        ← Folder tab strip
│   │   │   ├── message-context-menu.tsx ← Right-click menu
│   │   │   └── drag-drop-zones.tsx   ← Archive/delete drop targets
│   │   ├── hooks/                ← React hooks (FRONTEND)
│   │   │   ├── use-inbox.ts      ← Paginated message list
│   │   │   ├── use-message.ts    ← Single message detail
│   │   │   └── use-accounts.ts   ← Email accounts list
│   │   └── types.ts              ← TypeScript types for email domain
│   │
│   ├── channels/
│   │   ├── telegram/             ← Telegram integration
│   │   │   ├── notify.ts         ← High-priority push notification (BACKEND)
│   │   │   └── components/       ← (empty — UI handled in channels page)
│   │   ├── whatsapp/
│   │   │   ├── mock-handler.ts   ← WhatsApp mock API handler (BACKEND)
│   │   │   └── components/
│   │   │       └── whatsapp-mock.tsx ← Chat UI mock (FRONTEND)
│   │   └── server/
│   │       └── router.ts         ← Intent → handler routing (BACKEND)
│   │
│   ├── ai/
│   │   ├── clients/              ← AI provider clients (BACKEND)
│   │   └── prompts/              ← AI prompt functions (BACKEND)
│   │
│   ├── memory/
│   │   └── components/
│   │       └── memory-view.tsx   ← Memory management UI (FRONTEND)
│   │
│   ├── settings/
│   │   └── components/           ← Settings UI (FRONTEND)
│   │       ├── settings-view.tsx
│   │       ├── connect-imap-dialog.tsx
│   │       └── provider-icon.tsx
│   │
│   ├── rag/                      ← RAG/retrieval logic (BACKEND)
│   └── scheduler/                ← Email scheduling (BACKEND)
│
├── lib/                          ← Shared utilities (MIXED)
│   ├── supabase/                 ← Supabase client + types (used by both)
│   ├── providers/                ← Email provider adapters (BACKEND)
│   ├── security/                 ← Encryption utils (BACKEND)
│   └── utils/                    ← General helpers (FRONTEND + BACKEND)
│
├── public/                       ← Static assets (FRONTEND)
│   ├── icons/
│   │   ├── favicon.ico           ← App favicon
│   │   └── icon.svg              ← PWA icon
│   ├── logo.png                  ← sekpriAI logo
│   └── manifest.json             ← PWA manifest
│
├── docs/
│   ├── frontend/                 ← Frontend-specific docs (FRONTEND)
│   │   ├── DESIGN_SYSTEM.md      ← Colors, animations, component patterns
│   │   └── STRUCTURE.md          ← This file
│   ├── audit-report.md
│   ├── production-readiness-report.md
│   └── sekpriAI_Source_of_Truth_Blueprint.md
│
├── specs/                        ← Product/technical specs (GENERAL)
├── supabase/                     ← DB migrations + config (BACKEND/INFRA)
├── tests/                        ← Tests (GENERAL)
├── scripts/                      ← Dev/ops scripts (GENERAL)
│
└── [root config files]
    ├── next.config.ts            ← Next.js config
    ├── tailwind / postcss        ← CSS tooling
    ├── tsconfig.json             ← TypeScript config
    ├── eslint.config.mjs         ← Linting
    ├── vitest.config.ts          ← Unit test runner
    ├── playwright.config.ts      ← E2E test runner
    └── vercel.json               ← Deployment config (cron jobs)
```

---

## Frontend vs Backend — quick reference

**Touch these for UI work:**
- `app/(app)/*/page.tsx` — page layouts
- `app/page.tsx`, `app/login/`, `app/signup/` — public pages
- `app/globals.css` — design tokens
- `components/` — all shared UI
- `features/*/components/` — feature UI
- `features/*/hooks/` — data fetching hooks
- `public/` — static assets

**Do NOT touch for UI work (backend):**
- `app/api/` — API routes
- `features/ai/` — AI prompt logic
- `features/channels/server/` — channel routing
- `features/channels/telegram/notify.ts`
- `features/rag/` — retrieval logic
- `features/scheduler/` — scheduling
- `lib/providers/` — IMAP/SMTP adapters
- `lib/security/` — encryption
- `supabase/` — database

---

## Data flow (frontend perspective)

```
User action
  → React component (features/*/components/)
  → Hook (features/*/hooks/) or direct Supabase client
  → Supabase DB / REST API (app/api/)
  → State update → re-render
```

AI features go through REST:
- Draft reply: `POST /api/messages/draft`
- Analyze email: `POST /api/ai/summarize`
- AI compose: `POST /api/ai/compose`
