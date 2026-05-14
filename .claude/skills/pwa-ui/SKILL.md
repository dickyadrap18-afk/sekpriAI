---
name: pwa-ui
description: |
  Generates a new feature UI module skeleton following sekpriAI's component
  architecture. Use when adding a new screen or feature area to the app.
author: sekpriAI team
version: 1.0.0
user-invocable: true
---

# PWA UI Skill

## When to use

Invoke this skill when you need to create a new feature UI module with
proper structure, types, and component skeletons.

## What it generates

```
features/<name>/
  components/
    <Name>Page.tsx        # Main page component
    <Name>List.tsx        # List component (if applicable)
    <Name>Detail.tsx      # Detail component (if applicable)
  hooks/
    use<Name>.ts          # Data fetching hook
  server/
    actions.ts            # Server actions or API call wrappers
  types.ts                # Feature-specific types
```

Plus a route entry suggestion for `app/(app)/<name>/page.tsx`.

## Design rules (from specs/002-design-spec.md)

- Use TailwindCSS + shadcn/ui primitives.
- Follow the design direction: Gmail-like familiarity + Notion-like clean.
- Every interactive surface must handle: default, hover, active, focus-visible,
  loading, empty, error, disabled states.
- Mobile-ready: responsive from 320px up.
- Tap targets >= 44px on mobile.
- Color contrast WCAG AA.
- Form inputs have associated labels (not just placeholders).

## Component rules

- Components must NOT import from `lib/providers/*` or `features/ai/clients/*`.
- Components may import from their own `hooks/` and `server/` directories.
- Components may import from `components/*` (shared UI primitives).
- Components must NOT import another feature's internals.
- Use React Server Components where possible; mark client components with `'use client'`.

## Naming conventions

- Page components: `<Name>Page.tsx`
- List components: `<Name>List.tsx`, `<Name>ListItem.tsx`
- Detail components: `<Name>Detail.tsx`
- Hooks: `use<Name>.ts` or `use<Name>Query.ts`
- Types: `types.ts` in the feature root

## Usage

```
/pwa-ui <feature-name>
```

Example: `/pwa-ui memory`
