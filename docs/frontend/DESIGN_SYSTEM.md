# sekpriAI Design System

Visual language, color tokens, animation conventions, and component patterns for the frontend.

---

## Color Tokens

All values defined in `app/globals.css` under `:root`.

| Token | Value | Usage |
|---|---|---|
| `--background` | `#080810` | App shell, page backgrounds |
| `--foreground` | `#f0ece4` | Primary text |
| `--muted-foreground` | `#9a9080` | Secondary text, placeholders |
| `--primary` | `#c9a96e` | Gold accent — CTAs, active states, highlights |
| `--border` | `rgba(201,169,110,0.1)` | Subtle gold borders |
| `--glass-bg` | `rgba(8,8,16,0.7)` | Glass panel backgrounds |
| `--glass-border` | `rgba(201,169,110,0.08)` | Glass panel borders |

### Gold palette (use hex directly, not Tailwind amber)
```
#c9a96e  — mid gold (primary accent)
#e8d5b0  — champagne (gradient end, headings)
#a07840  — deep gold (gradient start, shadows)
```

---

## Glass Panel Pattern

Used for sidebar, modals, floating panels, email list/detail panels.

```tsx
style={{
  background: "rgba(8,8,16,0.7)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(201,169,110,0.08)",
}}
```

Do not use the `.glass` Tailwind utility for new components — use inline style for precise control.

---

## Gold Gradient (CTA buttons, headings)

```tsx
// Button
style={{ background: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 100%)" }}

// Text gradient
className="bg-clip-text text-transparent"
style={{ backgroundImage: "linear-gradient(135deg, #e8d5b0 0%, #c9a96e 40%, #a07840 100%)" }}
```

---

## Animation Conventions

### Page entrance (staggered)
```tsx
import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.12,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

// Usage
<motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
```

### Scroll-triggered
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
```

### Micro-interactions
```tsx
// CTA hover
whileHover={{ scale: 1.03 }}
active:scale-[0.98]

// List item hover — CSS only, no JS
className="transition-all duration-150 hover:bg-white/[0.04]"
```

### Background effects
- Canvas particles + CSS `backdrop-filter` — never animate on every frame for perf
- Breathing orbs: `animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}` with long duration (9–14s)

---

## Framer Motion gotchas

### `ease` must be a typed tuple
```tsx
// ❌ Breaks on Vercel build (TypeScript strict)
ease: [0.22, 1, 0.36, 1]

// ✅ Correct
ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
```

### `motion.div` + native drag events conflict
`motion.div` overrides `onDragStart`/`onDragEnd` with Framer's `PanInfo` signature.
Wrap with a native `div` for drag, use `motion.div` only for animation:

```tsx
<motion.div layout initial={...} animate={...}>
  <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    {/* content */}
  </div>
</motion.div>
```

---

## Component Inventory

| Component | File | Purpose |
|---|---|---|
| `AmbientBg` | `components/ambient-bg.tsx` | Canvas particles + breathing orbs for app shell |
| `HeroCanvas` | `components/hero-canvas.tsx` | Three.js scene for homepage hero |
| `AppShell` | `components/app-shell.tsx` | Sidebar + main layout wrapper |
| `Toast` | `components/toast.tsx` | Global toast notifications |
| `SubmitButton` | `components/submit-button.tsx` | Form submit with loading state |

---

## Icon System

Using `lucide-react`. Avoid icons that look "AI-generated" or overly futuristic.

| Avoid | Use instead | Context |
|---|---|---|
| `Brain` | `BookMarked` | Memory/notes |
| `Sparkles` | `FileText`, `Cpu` | AI processing |
| `Wand2` | `PenLine` | Draft/write |
| `Zap` | `SlidersHorizontal` | Filters |

---

## Typography

Font: `Inter` (system fallback: `ui-sans-serif, system-ui, sans-serif`)

| Role | Class |
|---|---|
| Hero heading | `text-7xl font-bold tracking-[-0.03em]` |
| Section heading | `text-4xl font-bold tracking-tight` |
| Section label | `text-[11px] uppercase tracking-[0.25em] text-[#c9a96e]/60` |
| Body | `text-sm text-white/40 leading-relaxed` |
| Email sender | `text-[13px] font-semibold text-white` |
| Email subject | `text-xs font-medium text-white/85` |
| Email snippet | `text-[11px] text-white/35` |
