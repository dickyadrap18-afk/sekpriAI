sekpriAI
Source of Truth Blueprint
AI-first universal email client - mobile-ready PWA


| Decision | Final Choice |
| --- | --- |
| Product name | sekpriAI |
| Goal | Assessment-ready AI-first universal email client, not an enterprise-scale product |
| UI direction | Gmail-like familiarity + Notion-like clean workspace |
| Frontend | Next.js / React / TypeScript |
| Deployment | Vercel free tier |
| Database/Auth/Storage/Vector | Supabase |
| Email providers | Real Gmail, Office 365, IMAP for Yahoo/AOL/custom |
| AI providers | Claude default; OpenAI, Gemini, DeepSeek configurable via env |
| Telegram | Real Telegram bot integration |
| WhatsApp | Complete mock UI flow, no real API |
| Core safety rule | AI can draft, summarize, classify, and notify; sending requires explicit user approval |

# How to use this document
This document is the main source of truth for the project. Start here before writing code.
Phase 0 creates the documentation files that Claude Code will use as execution context.
After Phase 0, implementation should follow the timeline and acceptance criteria in this document.
Do not add major features outside this document unless the PRD and specs are updated first.

# 1. What is the Source of Truth?
There should be one master source of truth and several implementation documents generated from it. The master source of truth is this blueprint. The project files below are derived from this blueprint and should be created before coding begins.

| File | Purpose | When created |
| --- | --- | --- |
| This Blueprint | Master planning document. Explains product, architecture, specs, tasks, and deliverables. | Before development |
| /specs/001-prd.md | Product requirements, goals, non-goals, MVP scope, success criteria. | Phase 0 |
| /specs/002-design-spec.md | Screens, UX principles, layout, components, interaction states. | Phase 0 |
| /specs/003-technical-spec.md | Stack, modules, API boundaries, serverless design, security boundaries. | Phase 0 |
| /specs/004-erd.md | Database entities, relationships, SQL schema, RLS requirements. | Phase 0 |
| /specs/005-ai-agent-spec.md | AI system prompt, safety rules, priority/risk/memory/RAG prompts. | Phase 0 |
| /specs/006-provider-integration-spec.md | Gmail, Office 365, IMAP integration plan and adapter contract. | Phase 0 |
| /specs/007-channels-spec.md | Telegram and WhatsApp mock flows, commands, binding, notifications. | Phase 0 |
| /specs/008-testing-spec.md | Unit, integration, E2E, and manual demo checklist. | Phase 0 |
| /specs/009-timeline-task-breakdown.md | Implementation phases, tasks, acceptance criteria. | Phase 0 |
| /CLAUDE.md | Operating manual for Claude Code. Coding rules, product rules, commands, safety rules. | Phase 0 |
| /ARCHITECTURE.md | One-page architecture summary required by assignment. | Phase 0 |
| /WORKFLOW.md | Agent OS, multi-agent workflow, skills/hooks/plugins, development process. | Phase 0 |

## Rule
If there is disagreement between files, fix the specs first, then update CLAUDE.md / ARCHITECTURE.md / WORKFLOW.md. Claude Code should treat specs as implementation requirements, not optional notes.
# 2. Product Requirement Document (PRD)
## 2.1 Product Summary
sekpriAI is an AI-first universal email client delivered as a mobile-ready PWA. It connects real Gmail, Office 365, and IMAP providers such as Yahoo and AOL into one unified inbox. On top of normal email actions, sekpriAI adds an AI secretary that summarizes, prioritizes, drafts replies, extracts memory, performs RAG over email content and attachments, sends high-priority notifications through Telegram, and supports a full mock WhatsApp command flow.
## 2.2 Goals
Deliver a polished mobile-ready PWA deployed to Vercel.
Support real Gmail, Office 365, and IMAP account connections.
Provide a unified inbox with account switching.
Support compose, reply, forward, search, labels, archive, and delete.
Provide AI summaries, reply drafts, prioritization, and risk classification.
Build AI memory with pending approval before activation.
Build RAG using email body plus PDF, TXT, and DOCX attachments.
Support Telegram bot integration for notifications and natural language email commands.
Provide full WhatsApp mock command UI without paid WhatsApp API.
Follow Claude Code CLI, Agent OS methodology, specs-driven development, skills/hooks/plugins, and automated tests.
## 2.3 Non-Goals
No contacts manager.
No tasks.
No notes.
No calendar.
No CRM.
No real WhatsApp API.
No autonomous high-risk email sending.
No enterprise-grade production sync system beyond what is needed for the assessment.
## 2.4 MVP Feature List

| Area | MVP Features |
| --- | --- |
| Auth | Multi-user login using Supabase Auth. |
| Providers | Real Gmail, Office 365, Yahoo/AOL/custom IMAP connection. |
| Inbox | Unified inbox, account switching, read/unread, priority badge, provider badge. |
| Actions | Compose, reply, forward, search, labels, archive, delete. |
| AI | Summary, reply draft, priority, risk classification, suggested next action. |
| Memory | Extract from all email, store as pending, approve/edit/reject/delete. |
| RAG | Email body and attachments: PDF, TXT, DOCX. |
| Telegram | Real bot binding, welcome message, high-priority notifications, natural language commands. |
| WhatsApp | Full mock UI and command flow without API. |
| Scheduler | Approved scheduled sends only. |
| Testing | Unit, integration, E2E, manual demo checklist. |

# 3. Design Spec
## 3.1 Design Direction
The interface should combine Gmail-like familiarity with Notion-like clean design. The user should immediately understand the inbox, but the AI layer should feel modern and integrated.

| Design Principle | Meaning |
| --- | --- |
| Familiar | Inbox, sidebar, message detail, compose, and labels should feel easy for Gmail users. |
| Clean | Minimal clutter, soft spacing, clear typography, calm interface. |
| AI-native | AI summary, priority, memory, and actions are visible in context, not hidden in a separate chatbot. |
| Safe | Sensitive actions show confirmation and draft preview. |
| Mobile-ready | Inbox and detail views should collapse gracefully on small screens. |

## 3.2 Screens

| Screen | Required Elements |
| --- | --- |
| Login | sekpriAI branding, tagline, login/signup form. |
| Onboarding | Connect Gmail, Office 365, IMAP, Telegram optional. |
| Inbox | Sidebar, unified inbox list, search, filters, account switcher, priority badges. |
| Message Detail | Full email body, attachments, AI summary, priority reason, risk reason, draft reply button. |
| Compose | From, To, Subject, Body, AI draft, Send, Schedule. |
| AI Memory | Pending/Active/Rejected tabs, approve/edit/reject/delete memory. |
| Channels | Telegram binding status, instructions, WhatsApp mock chat. |
| Settings | Provider accounts, AI provider env status, sync settings. |

## 3.3 Core UI Layout
Desktop layout:
Left sidebar: accounts, labels, AI Memory, Channels, Settings
Center: email list / search results
Right panel: message detail + AI actions

Mobile layout:
Top bar: menu, search, compose
Main: inbox list
Message opens as full-screen detail
Compose opens as sheet/modal
# 4. Architecture
## 4.1 High-Level Architecture
Mobile-ready PWA (Next.js / React / TypeScript)
  - Inbox UI
  - Message detail UI
  - Compose UI
  - AI Memory UI
  - Channels UI

Vercel Serverless API Routes
  - OAuth callbacks
  - Provider sync
  - Email send/reply/forward
  - Telegram webhook
  - AI orchestration
  - Attachment extraction
  - Scheduler endpoints

Supabase
  - Auth
  - Postgres
  - Storage
  - pgvector
  - Row Level Security

External Services
  - Gmail API
  - Microsoft Graph
  - IMAP/SMTP
  - Telegram Bot API
  - Claude / OpenAI / Gemini / DeepSeek
## 4.2 Serverless Boundary
Frontend can read user-owned data through Supabase client with RLS.
Frontend must not call Gmail, Microsoft Graph, IMAP, SMTP, Telegram, or LLM providers directly.
All tokens, passwords, API keys, and bot secrets stay in server-side environment variables or encrypted database fields.
Email sending and scheduled sending must go through server routes so approval rules can be enforced.
## 4.3 Provider Adapter Contract
export interface EmailProviderAdapter {
  provider: 'gmail' | 'office365' | 'imap'
  syncMessages(params: { accountId: string; since?: Date }): Promise<NormalizedMessage[]>
  sendMessage(params: SendMessageInput): Promise<SendMessageResult>
  archiveMessage(providerMessageId: string): Promise<void>
  deleteMessage(providerMessageId: string): Promise<void>
  applyLabel(providerMessageId: string, label: string): Promise<void>
}
# 5. ERD and Database Schema
## 5.1 Entity Relationship Overview
auth.users
  -> profiles
  -> email_accounts
       -> messages
            -> attachments
            -> approval_requests
       -> scheduled_emails
  -> memory_items
  -> rag_chunks
  -> telegram_bindings
  -> ai_actions
## 5.2 Tables Summary

| Table | Purpose |
| --- | --- |
| profiles | User profile linked to Supabase Auth. |
| email_accounts | Connected Gmail, Office 365, and IMAP accounts. |
| messages | Normalized email messages across providers. |
| attachments | Attachment metadata, storage path, extracted text. |
| memory_items | Pending and active AI memory items. |
| rag_chunks | Vector-searchable chunks from emails, attachments, and memory. |
| scheduled_emails | Emails scheduled for future sending after approval. |
| telegram_bindings | Telegram user/chat binding to sekpriAI user. |
| ai_actions | Audit log of AI commands and outputs. |
| approval_requests | Human-in-the-loop approval for drafts and sensitive actions. |

## 5.3 Core SQL Schema
-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

-- email_accounts
create table email_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gmail', 'office365', 'imap')),
  provider_label text,
  email_address text not null,
  display_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  imap_host text,
  imap_port int,
  smtp_host text,
  smtp_port int,
  imap_username text,
  imap_password_encrypted text,
  last_synced_at timestamptz,
  sync_status text default 'idle',
  created_at timestamptz default now()
);

-- messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_id uuid references email_accounts(id) on delete cascade,
  provider text not null,
  provider_message_id text not null,
  provider_thread_id text,
  thread_id text,
  from_name text,
  from_email text not null,
  to_emails text[] default '{}',
  cc_emails text[] default '{}',
  subject text,
  body_text text,
  body_html text,
  snippet text,
  received_at timestamptz,
  is_read boolean default false,
  is_archived boolean default false,
  is_deleted boolean default false,
  labels text[] default '{}',
  ai_summary text,
  ai_priority text check (ai_priority in ('high', 'medium', 'low')),
  ai_priority_reason text,
  ai_risk_level text check (ai_risk_level in ('low', 'medium', 'high')),
  ai_risk_reason text,
  ai_processed_at timestamptz,
  created_at timestamptz default now(),
  unique(account_id, provider_message_id)
);

-- memory_items
create table memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_message_id uuid references messages(id) on delete set null,
  memory_type text,
  content text not null,
  status text default 'pending' check (status in ('pending', 'active', 'rejected', 'deleted')),
  confidence numeric,
  created_by text default 'ai',
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- rag_chunks
create table rag_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_type text check (source_type in ('email', 'attachment', 'memory')),
  source_id uuid,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
# 6. Provider Integration Plan

| Provider | Implementation Notes |
| --- | --- |
| Gmail | Google OAuth, Gmail API read/send/modify, MIME parsing, attachment extraction, labels/archive/delete. Use OAuth test users for assessment. |
| Office 365 | Microsoft OAuth, Microsoft Graph delegated mail permissions, read/send/reply/forward/delete. |
| IMAP Yahoo/AOL | IMAP for read/sync, SMTP for send. User provides app password. Provide Yahoo/AOL presets plus custom IMAP. |

## 6.1 Sync Strategy
Run background sync every 1 minute.
Fetch only new or changed messages since last_synced_at.
Upsert normalized messages into Supabase.
Queue AI processing for new messages.
Update UI smoothly using silent refetch or Supabase realtime.
Show small syncing indicator; do not hard reload the inbox.
# 7. AI Agent Spec and System Prompt
## 7.1 AI Capabilities
Summarize emails and threads.
Draft replies using email content, thread history, memory, and RAG context.
Classify priority as high, medium, or low.
Classify risk as low, medium, or high.
Extract pending memory candidates.
Retrieve context from email body and attachments.
Interpret Telegram and WhatsApp mock natural language commands.
Prepare scheduled emails after explicit approval.
## 7.2 Global System Prompt
You are sekpriAI, an AI-first email secretary.

Your job is to help the user manage email only. Do not create calendar events, tasks, notes, contacts, or CRM records.

You can summarize emails, classify priority, classify risk, draft replies, search email context, use approved memory, use retrieved email and attachment context, prepare scheduled emails, notify the user about important messages, and interpret natural language commands from Telegram or WhatsApp mock channels.

Safety rules:
1. Never send an email unless the user explicitly confirms the send action.
2. If an email involves business decisions, payment, legal matters, contracts, pricing, client approval, confidential data, or complaints, always require human approval.
3. Always show the draft before asking for approval.
4. If the command is ambiguous, prepare a draft and ask for confirmation.
5. Do not invent facts. Use email content, approved memory, and retrieved context.
6. If context is missing, say what is missing.
7. Default language is English unless the user uses another language or asks for another language.
8. Keep responses concise and useful.
9. Store extracted memory as pending, not active.
10. Notify only high-priority or AI-selected important emails.
## 7.3 Prompt Outputs

| Prompt | Expected Output |
| --- | --- |
| Priority classification | { priority, reason, should_notify } |
| Risk classification | { risk_level, requires_approval, reason } |
| Summary | { one_sentence_summary, key_request, deadline, suggested_action } |
| Reply draft | { subject, body, tone, assumptions, needs_approval } |
| Memory extraction | Array of { memory_type, content, confidence } with pending status. |
| Telegram intent parser | { intent_type, target, instruction, requires_confirmation } |

# 8. Telegram and WhatsApp Command Flow
## 8.1 Telegram Binding
User opens Channels page.
User clicks Connect Telegram.
App generates unique binding code.
User opens Telegram bot and sends /start <binding_code>.
Webhook validates code and stores telegram_user_id plus chat_id.
Bot sends welcome message and usage instructions.
## 8.2 Welcome Message
Welcome to sekpriAI.

I am your AI email secretary. I can notify you about important emails, summarize threads, draft replies, and help you send or schedule emails after your approval.

Try:
- Summarize my latest email
- Draft a reply to Sarah
- What urgent emails did I receive today?
- Schedule this reply for tomorrow morning
- Send the approved draft

I will ask for confirmation before sending sensitive emails.
## 8.3 Supported Natural Commands
Summarize my latest email.
Draft a reply to Sarah.
Reply to the last email and say I will review tomorrow.
What urgent emails came in today?
Search emails about the pricing proposal.
Schedule this reply for tomorrow at 9 AM.
Send the approved draft.
Cancel the scheduled email.
## 8.4 WhatsApp Mock
WhatsApp has a full simulated chat UI inside the app.
It uses the same command parser as Telegram.
It does not use real WhatsApp API.
It exists to demonstrate future channel expansion without extra cost.
# 9. Claude Code / Agent OS Workflow
## 9.1 Methodology
Specs-driven development: write specs before implementation.
Claude Code should read CLAUDE.md and relevant specs before editing code.
Every feature must map to a spec and acceptance criteria.
Docs are not final polish; they are created in Phase 0 and guide implementation.
## 9.2 Agents

| Agent | Responsibility |
| --- | --- |
| Product Agent | PRD, scope, non-goals, success criteria. |
| Design Agent | Design spec, screens, UX states, mobile layout. |
| Frontend Agent | PWA UI, inbox, message detail, compose, memory, channels. |
| Email Provider Agent | Gmail, Office 365, IMAP adapters and normalization. |
| AI Agent | Prompts, summaries, drafts, priority, risk, memory, RAG. |
| Channel Agent | Telegram webhook, binding, commands, WhatsApp mock. |
| Testing Agent | Unit, integration, E2E tests. |
| Release Agent | Vercel, env vars, final deliverables. |

## 9.3 Skills, Hooks, Plugins

| Type | Items |
| --- | --- |
| Skills | email-provider-adapter-skill, ai-email-secretary-skill, rag-memory-skill, telegram-command-skill, pwa-ui-skill, test-generation-skill, vercel-release-skill |
| Hooks | Pre-implementation spec check, pre-commit lint/typecheck/test, pre-deploy build/test/e2e, security hook to prevent env/token exposure |
| Plugins | spec-check-plugin, test-runner-plugin, supabase-schema-plugin, vercel-release-plugin, email-fixture-plugin |

# 10. Implementation Timeline and Detailed Tasks
## Phase 0 - Specs and Foundation Docs
Goal: Create the source-of-truth project docs before coding.
Tasks:
Create repository and /specs folder.
Write PRD.
Write design spec.
Write technical spec.
Write ERD.
Write AI agent spec.
Write provider integration spec.
Write channel spec.
Write testing spec.
Write timeline/task breakdown.
Create CLAUDE.md.
Create ARCHITECTURE.md.
Create WORKFLOW.md.
Acceptance criteria: All docs exist and define scope, architecture, safety rules, database, provider approach, testing, and implementation order.
## Phase 1 - App Foundation
Goal: Create the working app shell.
Tasks:
Initialize Next.js TypeScript app.
Install Tailwind and shadcn/ui.
Set up Supabase client.
Set up Supabase Auth.
Create protected dashboard.
Build sidebar and responsive layout.
Add PWA manifest.
Acceptance criteria: User can sign up/login and access a protected mobile-ready dashboard.
## Phase 2 - Database and RLS
Goal: Create schema and secure multi-user access.
Tasks:
Create all core tables.
Enable pgvector.
Create indexes.
Add RLS policies.
Create seed data.
Acceptance criteria: Tables exist, RLS works, user can only access own data, seed inbox renders.
## Phase 3 - Core Email UI
Goal: Build the email client experience.
Tasks:
Inbox list.
Account filter.
Message detail.
Search.
Labels.
Archive/delete.
Compose modal.
Reply and forward.
Attachment display.
Loading/error/empty states.
Acceptance criteria: User can browse, open, search, compose, reply, forward, archive, delete.
## Phase 4 - Provider Integration
Goal: Connect real providers.
Tasks:
Define adapter interface.
Gmail OAuth and sync/send.
Office OAuth and sync/send.
IMAP form with Yahoo/AOL presets.
IMAP sync.
SMTP send.
Manual sync.
1-minute background sync.
Acceptance criteria: Gmail, Office 365, and IMAP accounts can connect and sync into unified inbox.
## Phase 5 - AI Core
Goal: Add AI summaries, drafts, priority, and risk.
Tasks:
LLM provider interface.
Claude default.
OpenAI/Gemini/DeepSeek config.
Summary generation.
Reply draft.
Priority classifier.
Risk classifier.
AI UI cards.
Acceptance criteria: AI summary, draft, priority badge, and risk explanation work.
## Phase 6 - Memory and RAG
Goal: Add persistent memory and retrieval.
Tasks:
Memory extraction.
Memory approval page.
PDF/TXT/DOCX extraction.
Chunking.
Embeddings.
Vector retrieval.
Use context in drafts.
Acceptance criteria: Pending memory works, approved memory affects AI, RAG works for email and attachments.
## Phase 7 - Telegram and WhatsApp Mock
Goal: Add command channels.
Tasks:
Create Telegram bot.
Webhook route.
Binding code flow.
Welcome message.
Natural command parser.
High-priority notifications.
WhatsApp mock UI.
Acceptance criteria: Telegram bot works and WhatsApp mock works end-to-end.
## Phase 8 - Scheduler and Approval
Goal: Add scheduled sending and human-in-the-loop safety.
Tasks:
Approval service.
Approval modal.
Schedule form.
Scheduler worker/endpoint.
Send approved scheduled emails.
Cancel scheduled email.
Acceptance criteria: Scheduled emails only send after approval, sensitive emails require confirmation.
## Phase 9 - Testing
Goal: Add automated tests.
Tasks:
Set up Vitest.
Set up Testing Library.
Set up Playwright.
Test normalization.
Test AI classifiers.
Test memory parser.
Test Telegram parser.
Test inbox/compose/AI/memory/channel flows.
Acceptance criteria: Unit, integration, and E2E tests pass.
## Phase 10 - Deployment and Deliverables
Goal: Deploy and prepare final submission.
Tasks:
Create Vercel project.
Set env vars.
Configure OAuth callbacks.
Configure Telegram webhook.
Run build/tests.
Deploy.
Verify live demo.
Finalize README and deliverables.
Acceptance criteria: Live Vercel URL works and deliverables are ready.
# 11. Testing Plan

| Test Type | Coverage |
| --- | --- |
| Unit | Provider normalization, priority classifier, risk classifier, memory extraction parser, Telegram intent parser, RAG chunking. |
| Integration | Sync into Supabase, AI processing pipeline, scheduled approval flow, Telegram webhook command flow, memory approval flow. |
| E2E | Login, unified inbox, account filter, open email, AI summary, draft reply, approve send, memory approval, WhatsApp mock flow. |
| Manual Demo | Provider connection, Telegram binding, high-priority notification, RAG over attachment, Vercel live URL. |

# 12. Final Deliverables Checklist
Live Vercel URL.
GitHub repository URL.
CLAUDE.md in project root.
ARCHITECTURE.md in project root.
WORKFLOW.md in project root.
Specs folder with PRD, design spec, technical spec, ERD, AI spec, provider spec, channel spec, testing spec, timeline/task breakdown.
List of agents, skills, hooks, and plugins documented in WORKFLOW.md.
Automated tests included.
Final README or submission message explaining what was built.
# 13. Final Submission Message Template
Live Vercel URL:
https://sekpriai.vercel.app

Repository:
https://github.com/<username>/sekpriai

CLAUDE.md:
Included at /CLAUDE.md

Architecture doc:
Included at /ARCHITECTURE.md

Workflow writeup:
Included at /WORKFLOW.md

Specs:
Included under /specs:
- 001-prd.md
- 002-design-spec.md
- 003-technical-spec.md
- 004-erd.md
- 005-ai-agent-spec.md
- 006-provider-integration-spec.md
- 007-channels-spec.md
- 008-testing-spec.md
- 009-timeline-task-breakdown.md

Agents / skills / hooks / plugins:
Documented in /WORKFLOW.md

Tests:
Unit, integration, and E2E tests included.

Notes:
sekpriAI supports Gmail, Office 365, and IMAP providers with unified inbox, account switching, compose/reply/forward, search, labels, archive/delete, AI summaries, reply drafts, prioritization, Telegram integration, WhatsApp mock flow, memory, RAG, and human-in-the-loop approval.
