# Changelog

All notable changes outside of spec, UI/UX additions, and contributor-relevant details are documented here.

Format: `[date] type: description` — types: `feat`, `fix`, `style`, `refactor`, `chore`, `dx`

---

## [2026-05-14]

### feat: Telegram webhook registration script
- Added `scripts/set-telegram-webhook.mjs` — registers bot webhook to Vercel production URL
- Reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` from `.env.local`
- Run once after deploy: `node scripts/set-telegram-webhook.mjs`
- Production URL: `https://sekpri-ai-pi.vercel.app`

### feat: Telegram bot response overhaul — natural secretary tone
**Files:** `features/channels/server/router.ts`, `app/api/telegram/webhook/[secret]/route.ts`, `features/channels/telegram/notify.ts`

- All bot responses rewritten from robotic system messages to warm, conversational secretary tone
- `router.ts`: Added `relativeTime()` helper — emails now show "2h ago", "Mon", etc.
- `router.ts`: Empty states are human ("Your inbox looks clear" not "No messages found")
- `router.ts`: Draft/schedule/send responses include direct app link via `NEXT_PUBLIC_APP_URL`
- `route.ts`: `/start` without code now guides user to Settings → Channels
- `route.ts`: Binding success greets user by Telegram first name (`message.from.first_name`)
- `route.ts`: `sendTelegramMessage()` now logs errors (was silent on failure)
- `notify.ts`: High-priority notification uses `⚡` and adds CTA "Reply or open the app"
- Welcome message rewritten with emoji anchors and natural language examples

### style: Icon audit — replaced AI-looking icons with neutral alternatives
**File:** `components/app-shell.tsx`, `features/memory/components/memory-view.tsx`, `features/email/components/message-detail.tsx`, `features/email/components/inbox-toolbar.tsx`, `features/email/components/compose-sheet.tsx`

| Removed | Replaced with | Reason |
|---|---|---|
| `Brain` | `BookMarked` | Less "AI robot", more "notes/memory" |
| `Sparkles` | `FileText` / `Cpu` | Sparkles screams AI assistant |
| `Wand2` | `PenLine` | Magic wand → natural writing |
| `Zap` | `SlidersHorizontal` | Priority filter, not energy |

### feat: Full visual redesign — agentmail.to inspired
**Theme:** Pure black base, monochrome, clean typography, minimal decoration

**Files changed:**
- `app/globals.css` — token reset: `--background: #000000`, `--primary: #f0f0f0`, removed glow effects
- `app/page.tsx` — homepage rebuilt: dot grid bg, hero with badge + large heading, feature grid, footer
- `app/login/page.tsx` — new layout: top nav + centered form, no card/glass box
- `app/signup/page.tsx` — same pattern as login
- `components/app-shell.tsx` — sidebar: pure black, `white/[0.07]` active state, smaller logo

### feat: Three.js hero canvas + Framer Motion animations
**Files:** `components/hero-canvas.tsx` (new), `app/page.tsx`

- `hero-canvas.tsx`: Three.js scene — 120 gold/champagne particles, 2 wireframe torus rings, mouse parallax
- Particles use warm palette: `#c9a96e`, `#e8d5b0`, `#ffffff`, `#a07840`
- Torus opacity "breathes" via sine wave on `clock.getElapsedTime()`
- Lazy loaded via `next/dynamic` with `ssr: false` — no SSR penalty
- Homepage: all hero elements use staggered `fadeUp` Framer Motion variants
- Features section: scroll-triggered `whileInView` animations
- Login/signup: logo slides down, form fades up with 150ms delay

### feat: Ambient background system for app shell
**File:** `components/ambient-bg.tsx` (new)

- Canvas-based particle system: 55 gold/peach/champagne dots with sinusoidal drift
- 3 Framer Motion breathing orbs: rose-warm (top-left), gold (bottom-right), champagne (center)
- All orbs use `blur(40-60px)` — visible through glass panels without being distracting
- Dot grid with gold tint `rgba(201,169,110,0.06)`
- Integrated into `AppShell` — renders behind all panels

### style: Premium secretary theme — gold accent system
**Color tokens added:**
```
--primary:        #c9a96e   (gold, replaces indigo)
--background:     #080810   (deep charcoal, not pure black)
--muted-foreground: #9a9080 (warm gray)
--border:         rgba(201,169,110,0.1)
--glass-bg:       rgba(8,8,16,0.7)
```

**Applied across:**
- Sidebar: gold left border on active nav, gold gradient avatar, gold dividers
- Email list: gold left accent bar on selected item, gold unread dot
- Toolbar: gold compose button gradient, gold focus ring on search
- Message detail: gold AI summary box border, gold AI Draft button
- Compose: gold gradient Send button
- All panels: `backdrop-filter: blur(16-20px)` glass effect

### fix: Framer Motion `ease` type error on Vercel build
**Files:** `app/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`

- `ease: [0.22, 1, 0.36, 1]` inferred as `number[]` — not assignable to Framer Motion's `Easing` type
- Fix: cast to `[number, number, number, number]` tuple
- `fadeUp` variants typed as `Variants` from framer-motion
- Root cause: Framer Motion v12 tightened `Transition.ease` type — `number[]` no longer accepted

### fix: Framer Motion `onDragStart`/`onDragEnd` type conflict
**File:** `features/email/components/message-list-item.tsx`

- `motion.div` overrides `onDragStart` with Framer's `(event, info: PanInfo) => void`
- React's native `DragEvent<Element>` is incompatible with that signature
- Fix: split into `<motion.div>` (animation only) wrapping `<div draggable>` (drag events)
- `motion.div` handles: `layout`, `initial`, `animate`, `transition`
- Native `div` handles: `draggable`, `onDragStart`, `onDragEnd`, `onContextMenu`, `onClick`

### chore: Replace hardcoded old background colors
**Old value:** `#0d1424`, `#0f1829`, `#131f35` (dark navy from previous theme)
**New value:** `#0a0a0a` (neutral dark, consistent with black theme)

**Files cleaned:**
- `features/email/components/compose-sheet.tsx`
- `features/email/components/inbox-toolbar.tsx`
- `features/email/components/message-context-menu.tsx`
- `features/email/components/message-detail.tsx`
- `features/settings/components/connect-imap-dialog.tsx`

### chore: favicon replaced
- `app/favicon.ico` replaced with `public/icons/favicon.ico` (custom sekpriAI icon)
- Removed unused Next.js default SVGs: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`

### dx: Telegram webhook helper script
**File:** `scripts/set-telegram-webhook.mjs`
- Standalone script to register/update Telegram webhook without Vercel CLI
- Usage: `node scripts/set-telegram-webhook.mjs`
- Reads env from `.env.local` automatically

---

## Notes for contributors

### Color system
All gold values use `#c9a96e` (mid-gold) and `#e8d5b0` (champagne). Never use raw `amber-*` Tailwind classes for brand gold — use the hex directly for consistency.

### Animation conventions
- Page-level entrance: `framer-motion` `fadeUp` variants with `custom` index for stagger
- Scroll-triggered: `whileInView` + `viewport={{ once: true }}`
- Micro-interactions: `whileHover={{ scale }}` on CTAs, `transition-all duration-150` for hover states
- Background effects: canvas + CSS `backdrop-filter` — never JS-animated on every frame for perf

### Glass panel pattern
```tsx
style={{
  background: "rgba(8,8,16,0.7)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(201,169,110,0.08)",
}}
```
Use this for modals, sidebars, and floating panels. Do not use Tailwind `glass` class for new components — use inline style for precise control.

### Telegram bot tone rules
- Always address user by name when available (`message.from.first_name`)
- Never say "Feature available in the app" — always include a direct link
- Error messages explain what to do next, not just what went wrong
- Use emoji sparingly as visual anchors, not decoration
