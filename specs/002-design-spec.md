# 002 - Design Spec

> Source of truth: [`docs/sekpriAI_Source_of_Truth_Blueprint.md`](../docs/sekpriAI_Source_of_Truth_Blueprint.md) §3.

## 1. Design direction

sekpriAI combines Gmail-like familiarity with Notion-like clean design. The
inbox should feel immediately usable to a Gmail user, while the AI layer
should feel modern and integrated rather than bolted on as a chat sidebar.

| Principle    | Meaning                                                                            |
| ------------ | ---------------------------------------------------------------------------------- |
| Familiar     | Inbox, sidebar, message detail, compose, and labels mirror common email clients.   |
| Clean        | Minimal clutter, soft spacing, clear typography, calm interface.                   |
| AI-native    | AI summary, priority, risk, and actions live in context, not in a hidden panel.    |
| Safe         | Sensitive actions show confirmation and a draft preview.                           |
| Mobile-ready | Inbox and detail collapse gracefully on small screens.                             |

## 2. Visual language

- **Stack**: TailwindCSS + shadcn/ui primitives.
- **Typography**: Inter (or system stack fallback). Body 14px, list items
  14px, headings 16-20px.
- **Spacing**: 4px base unit. Cards use 16px padding. Lists use 12px row
  padding.
- **Color**: neutral slate palette by default, accent for AI elements
  (summary, priority badge), success / warning / danger for risk states.
- **Iconography**: lucide-react icons via shadcn.
- **Motion**: subtle transitions only (150-200ms). No parallax, no autoplay.

## 3. Screens

| Screen         | Required elements                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Login          | sekpriAI brand, tagline, email/password and OAuth buttons.                                                 |
| Onboarding     | Connect Gmail, Office 365, IMAP. Optional Telegram binding step.                                           |
| Inbox          | Sidebar (accounts, labels, AI memory, channels, settings), message list, search, filters, account switcher, priority badges. |
| Message detail | Full body, attachments, AI summary, priority + reason, risk + reason, draft-reply button, label chips.    |
| Compose        | From, To, Subject, Body, AI draft button, Send, Schedule.                                                  |
| AI memory      | Pending / Active / Rejected tabs; approve, edit, reject, delete actions.                                   |
| Channels       | Telegram binding status and instructions; WhatsApp mock chat.                                              |
| Settings       | Provider accounts, AI provider env status, sync settings.                                                  |

## 4. Layouts

### Desktop (>= 1024px)
- Three-pane: left sidebar (accounts, labels, sections), center message list,
  right message detail with AI panel collapsible.
- Top bar: search, compose, account switcher, user menu.

### Tablet (768-1023px)
- Two-pane: list + detail. Sidebar collapses to a drawer.

### Mobile (< 768px)
- Top bar: menu, search, compose.
- Main: inbox list.
- Message detail opens full-screen with back button.
- Compose opens as a sheet/modal.
- AI summary appears at the top of the message detail; priority and risk
  appear inline with the subject.

## 5. Component inventory (initial)

UI primitives come from shadcn/ui. Feature components live under
`features/*/components/*`.

- `AppShell` - top bar, sidebar, content slot.
- `Sidebar` - accounts, labels, AI memory, channels, settings.
- `AccountSwitcher` - dropdown of connected providers.
- `MessageList` and `MessageListItem`.
- `MessageDetail` - body, attachments, AI summary card, priority badge,
  risk badge.
- `AISummaryCard`, `PriorityBadge`, `RiskBadge`.
- `ComposeSheet` - form, AI draft, schedule, send confirmation.
- `MemoryListItem`, `MemoryApprovalDialog`.
- `ChannelsPanel` - Telegram binding, WhatsApp mock chat.
- `ApprovalDialog` - shared confirmation surface for sends and memory
  activation.

## 6. Interaction states

Every interactive surface must define and implement these states:

- Default
- Hover (desktop only)
- Active / pressed
- Focus visible (keyboard navigation)
- Loading (skeleton or spinner, never blank)
- Empty (illustration or short copy + primary action)
- Error (inline message + retry where useful)
- Disabled (with reason on hover where possible)

## 7. Empty and error patterns

- Empty inbox: short headline, suggestion to connect another account.
- Empty search: "No matches for `<query>`" plus clear-search action.
- Provider expired token: banner on the inbox header with reconnect button.
- AI provider failure: feature degrades silently with a small "AI
  unavailable" badge; non-AI features keep working.

## 8. Accessibility

- All interactive elements reach via keyboard.
- Focus rings visible (Tailwind `focus-visible`).
- Color contrast WCAG AA for text and icon buttons.
- Form inputs have associated labels; placeholders are not labels.
- Live regions announce new email arrivals only on user action (no
  unsolicited audio/visual flicker).

> Full WCAG validation requires manual testing with assistive technologies
> and expert accessibility review beyond what specs alone can guarantee.

## 9. PWA expectations

- Installable manifest with name, short_name, icons (192, 512), theme color.
- Service worker for offline shell and last-seen inbox cache (read-only).
- Mobile viewport meta with `viewport-fit=cover`.
- Tap targets >= 44px on mobile.

## 10. Open design questions

- Density toggle (cozy vs comfortable) - defer to post-MVP.
- Dark mode - ship light first, add dark via Tailwind class strategy when
  time permits.
