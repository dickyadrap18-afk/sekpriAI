# WORKFLOW.md - sekpriAI Development Workflow

How sekpriAI is built using Claude Code with specs-driven development.
Read alongside `CLAUDE.md` and the specs.

## 1. Methodology

sekpriAI uses a **specs-driven, agent-assisted workflow** with:

- Role-based agents (`.claude/agents/*.md`)
- Reusable skills (`.claude/skills/*/SKILL.md`)
- Automated hooks (`.claude/hooks/*.json`)
- Read / change / verify loop on every change

Principles, in order of priority:

1. Specs before code. Every feature has a spec entry before implementation.
2. Small, iterative changes. No large one-shot implementations.
3. Role-based agents. Each agent has a narrow responsibility.
4. Read / change / verify on every change. Never declare done without
   running the gates.
5. Strong validation. Lint, typecheck, tests, build, and `verify-app`
   checklists are non-negotiable.
6. No overengineering. Prefer the smallest correct solution.
7. Repository context over long prompts. Specs and CLAUDE.md are the
   shared context; chat prompts stay focused.

## 2. Claude Code Agents

Agents live in `.claude/agents/*.md`. Each has a single responsibility.
Invoke them via the agent panel or reference them in prompts.

### Review & Quality Agents

| Agent             | File                                | Role                                                  |
| ----------------- | ----------------------------------- | ----------------------------------------------------- |
| `code-architect`  | `.claude/agents/code-architect.md`  | Boundaries, schema, new modules, adapter contracts.   |
| `email-guide`     | `.claude/agents/email-guide.md`     | Mail behavior, threading, send/reply/forward.         |
| `build-validator` | `.claude/agents/build-validator.md` | Lint, typecheck, test, build verification.            |
| `code-simplifier` | `.claude/agents/code-simplifier.md` | Reduce complexity, remove dead code, control scope.   |
| `verify-app`      | `.claude/agents/verify-app.md`      | Sanity-check user flows and edge cases.               |

### Implementation Agents (Subagents)

| Agent                  | File                                      | Role                                                    |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `product-agent`        | `.claude/agents/product-agent.md`         | PRD, scope, non-goals, success criteria.                |
| `design-agent`         | `.claude/agents/design-agent.md`          | Design spec, screens, UX states, mobile layout.         |
| `frontend-agent`       | `.claude/agents/frontend-agent.md`        | PWA UI, inbox, message detail, compose, memory.         |
| `email-provider-agent` | `.claude/agents/email-provider-agent.md`  | Gmail, Office 365, IMAP adapters and normalization.     |
| `ai-agent`             | `.claude/agents/ai-agent.md`              | Prompts, summaries, drafts, priority, risk, memory, RAG.|
| `channel-agent`        | `.claude/agents/channel-agent.md`         | Telegram webhook, binding, commands, WhatsApp mock.     |
| `testing-agent`        | `.claude/agents/testing-agent.md`         | Unit, integration, E2E tests.                           |
| `release-agent`        | `.claude/agents/release-agent.md`         | Vercel, env vars, final deliverables.                   |

### When to invoke each agent

**Review agents:**
- **code-architect**: Before adding a new module, changing schema, or crossing boundaries.
- **email-guide**: Before touching mail flow, threading, send pipeline, or provider adapters.
- **build-validator**: After every code change. Before PR. Before deploy.
- **code-simplifier**: After a feature merges. When files grow oversized.
- **verify-app**: After build-validator is green. Before declaring done.

**Implementation agents (dispatch as subagents for focused work):**
- **product-agent**: When scope questions arise or PRD needs updating.
- **design-agent**: When implementing UI or reviewing visual consistency.
- **frontend-agent**: When building UI components and screens.
- **email-provider-agent**: When implementing provider adapters.
- **ai-agent**: When building AI prompts, RAG, or memory features.
- **channel-agent**: When implementing Telegram or WhatsApp mock.
- **testing-agent**: When writing or fixing tests.
- **release-agent**: When deploying or configuring production.

## 3. Claude Code Skills

Skills live in `.claude/skills/*/SKILL.md`. They are reusable workflow
templates that generate code or guide processes following project conventions.

### Project-specific skills

| Skill                    | Path                                              | Purpose                                          |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------ |
| `boris`                  | `.claude/skills/boris/SKILL.md`                   | Workflow tips and coaching from Boris Cherny.     |
| `email-provider-adapter` | `.claude/skills/email-provider-adapter/SKILL.md`  | Generate new provider adapter skeleton.          |
| `ai-email-secretary`     | `.claude/skills/ai-email-secretary/SKILL.md`      | Generate new AI prompt module with schema.       |
| `rag-memory`             | `.claude/skills/rag-memory/SKILL.md`              | Generate RAG indexing and retrieval code.        |
| `telegram-command`       | `.claude/skills/telegram-command/SKILL.md`        | Generate new channel command handler.            |
| `pwa-ui`                 | `.claude/skills/pwa-ui/SKILL.md`                  | Generate feature UI module skeleton.             |
| `test-generation`        | `.claude/skills/test-generation/SKILL.md`         | Generate test scaffolds (unit/integration/E2E).  |
| `vercel-release`         | `.claude/skills/vercel-release/SKILL.md`          | Pre-deploy checklist and validation.             |

### Superpowers skills (workflow methodology)

| Skill                          | Purpose                                                        |
| ------------------------------ | -------------------------------------------------------------- |
| `using-superpowers`            | Master skill — establishes how to find and use all skills.     |
| `brainstorming`                | Explore ideas into designs before implementation.              |
| `writing-plans`                | Create detailed implementation plans from specs.               |
| `executing-plans`              | Execute plans in a separate session with checkpoints.          |
| `subagent-driven-development`  | Dispatch fresh subagent per task with two-stage review.        |
| `dispatching-parallel-agents`  | Fan out independent tasks to parallel agents.                  |
| `test-driven-development`      | TDD: red-green-refactor cycle for every feature.               |
| `systematic-debugging`         | Root-cause tracing and condition-based debugging.              |
| `verification-before-completion` | Evidence before claims — never skip verification.            |
| `writing-skills`               | Create new skills following best practices.                    |
| `using-git-worktrees`          | Isolated workspaces for parallel development.                  |
| `requesting-code-review`       | Code review template for reviewer subagents.                   |
| `receiving-code-review`        | Handle incoming code review feedback.                          |
| `finishing-a-development-branch` | Complete development after all tasks done.                   |

### How to use skills

Reference the skill name in your prompt:

```
Use the email-provider-adapter skill to create a Protonmail adapter.
Use the test-generation skill to create unit tests for the priority classifier.
Use the brainstorming skill to explore the memory approval UX.
Use the subagent-driven-development skill to execute the Phase 3 plan.
```

### Skill priority order

1. **Process skills first** (brainstorming, debugging, TDD) — determine HOW.
2. **Implementation skills second** (email-provider-adapter, pwa-ui) — guide execution.

## 4. Claude Code Hooks

Hooks live in `.claude/hooks/*.json`. They automate quality gates and
enforce architectural rules during development.

| Hook                       | File                                          | Trigger          | Action                                    |
| -------------------------- | --------------------------------------------- | ---------------- | ----------------------------------------- |
| Format on Save             | `.claude/hooks/format-on-save.json`           | `fileEdited`     | Run Prettier on changed TS/TSX files.     |
| Lint on Save               | `.claude/hooks/lint-on-save.json`             | `fileEdited`     | Run ESLint --fix on changed TS/TSX files. |
| Typecheck on Save          | `.claude/hooks/typecheck-on-save.json`        | `fileEdited`     | Run `tsc --noEmit` after edits.           |
| Verify Architecture        | `.claude/hooks/verify-architecture.json`      | `preToolUse`     | Block writes that violate boundaries.     |
| Spec Check Before Task     | `.claude/hooks/spec-check-before-task.json`   | `preTaskExecution` | Remind to read spec before starting.    |
| Test After Task            | `.claude/hooks/test-after-task.json`          | `postTaskExecution` | Run tests after task completion.       |
| Build Validate on Stop     | `.claude/hooks/build-validate-on-stop.json`   | `agentStop`      | Run lint + typecheck + build on finish.   |

### Hook behavior

- **preToolUse (write)**: Before any file write, the architecture hook checks
  that UI components don't import provider SDKs or LLM clients. If violated,
  the write is blocked with an explanation.
- **fileEdited**: After saving TS/TSX files, Prettier formats and ESLint fixes
  automatically. TypeScript compiler checks for type errors.
- **preTaskExecution**: Before starting a spec task, the agent is reminded to
  read the relevant spec section first.
- **postTaskExecution**: After completing a task, tests run automatically.
- **agentStop**: When the agent finishes, full build validation runs.

## 5. Claude Code Plugins

Plugins live in `.claude/plugins/*.md`. They define validation and deployment
scripts that enforce project rules programmatically.

| Plugin                   | File                                          | Type        | Purpose                                    |
| ------------------------ | --------------------------------------------- | ----------- | ------------------------------------------ |
| `spec-check-plugin`     | `.claude/plugins/spec-check-plugin.md`        | validation  | PRs touching features must reference a spec.|
| `test-runner-plugin`    | `.claude/plugins/test-runner-plugin.md`        | validation  | Canonical gate order (lint→type→test→build).|
| `supabase-schema-plugin`| `.claude/plugins/supabase-schema-plugin.md`   | validation  | Lint migrations against specs/004-erd.md.   |
| `vercel-release-plugin` | `.claude/plugins/vercel-release-plugin.md`    | deployment  | Pre-deploy gate runner.                     |
| `email-fixture-plugin`  | `.claude/plugins/email-fixture-plugin.md`     | testing     | Generate and validate provider fixtures.    |

### How plugins integrate

- Plugins are documentation + scripts. They define WHAT to validate and HOW.
- Agents invoke plugins as part of their workflow (e.g., `build-validator`
  runs `test-runner-plugin` gates, `code-architect` runs `supabase-schema-plugin`).
- Scripts live under `scripts/` and are referenced from `package.json`.

## 6. Spec Authority Rule

**Treat `specs/001-prd.md` as the implementation contract.**

- Specs win over `CLAUDE.md` if they ever disagree.
- If specs and the blueprint disagree, fix the spec first, then propagate.
- Claude Code should treat specs as implementation requirements, not optional notes.
- No feature ships without a matching spec entry.
- If reality drifts from the spec during implementation, update the spec before merging.

This rule is non-negotiable and applies to every agent, every task, every PR.

## 7. Read / Change / Verify Loop

Every change, no matter how small, follows this loop:

```
┌─────────────────────────────────────────────────┐
│  1. READ                                         │
│     - Read the spec for the area                 │
│     - Read adjacent files                        │
│     - Understand the acceptance criteria         │
├─────────────────────────────────────────────────┤
│  2. CHANGE                                       │
│     - Smallest correct change                    │
│     - One commit per logical change              │
│     - Follow clean architecture boundaries       │
├─────────────────────────────────────────────────┤
│  3. VERIFY                                       │
│     - Hooks auto-run: format, lint, typecheck    │
│     - Run build-validator gates                  │
│     - Run verify-app checklist                   │
│     - If fails → diagnose root cause, not patch  │
└─────────────────────────────────────────────────┘
```

If verification fails twice on the same approach, step back and reconsider
the approach rather than tweaking further.

## 8. Implementation Phases

Phases follow `specs/009-implementation-timeline.md`:

| Phase | Name                        | Status    |
| ----- | --------------------------- | --------- |
| 0     | Specs and foundation docs   | ✅ Done   |
| 1     | App foundation              | ✅ Done   |
| 2     | Database and RLS            | ✅ Done   |
| 3     | Core email UI               | ✅ Done   |
| 4     | Provider integration        | ✅ Done   |
| 5     | AI core                     | ✅ Done   |
| 6     | Memory and RAG              | ✅ Done   |
| 7     | Telegram and WhatsApp mock  | ✅ Done   |
| 8     | Scheduler and approval      | ✅ Done   |
| 9     | Testing                     | ✅ Done   |
| 10    | Deployment and deliverables | ✅ Done   |

Phases are sequential at the level of acceptance criteria but tasks
within a phase can be parallelized across feature modules.

## 9. Validation Process

Local quality gates (run by `build-validator` and hooks):

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run test          # Vitest unit + integration
npm run build         # Next.js production build
npm run test:e2e      # Playwright E2E (when UI changed)
```

Gate order is strict. A failing earlier gate stops the pipeline.

After local gates are green, run the relevant `verify-app` checklist
section from `.claude/agents/verify-app.md`.

## 10. Contributor Workflow

For external contributors and new Claude Code sessions:

1. Read `CLAUDE.md` (project rules and boundaries).
2. Read the spec for the area you are working on (`specs/*.md`).
3. Pick a single phase task from `specs/009-implementation-timeline.md`.
4. Create a feature branch (`feat/<phase>-<short-name>`).
5. Implement in small commits, following the read / change / verify loop.
6. Hooks auto-enforce: formatting, linting, architecture boundaries.
7. Open a PR. PR description must include:
   - Link to the spec section.
   - Files touched.
   - What was verified (gates + checklist).
   - Any remaining gaps.
8. Request review via agents:
   - `code-architect` if boundaries or schema changed.
   - `email-guide` if mail behavior changed.
   - `build-validator` always.
   - `verify-app` before merge.
9. Merge to `main` once green and reviewed. Never push directly to `main`.

## 11. Architectural Guardrails (enforced by hooks + review)

These are non-negotiable. The `verify-architecture` hook blocks violations
at write time. PRs that bypass them are rejected:

- ❌ UI components importing provider SDKs or LLM clients directly.
- ❌ Provider-specific fields leaking into the normalized `messages` schema.
- ❌ AI prompts hardcoded inside UI components.
- ❌ Tokens, API keys, or bot secrets in `NEXT_PUBLIC_*` env vars.
- ❌ Send route bypassing the approval gate.
- ❌ Direct Supabase writes from React components.
- ❌ New top-level folder without a spec or ADR.
- ❌ Feature added that violates non-goals in `specs/001-prd.md`.

## 12. Self-Improvement Loop

After any user correction or review feedback:

1. Update the spec or `CLAUDE.md` so the same mistake is hard to repeat.
2. If a class of mistake keeps recurring, add a hook (`.claude/hooks/`).
3. If a doc is wrong, fix it before the next code change in that area.
4. If a skill is missing for a repeated workflow, create one.

The goal: the next contributor (human or AI) should not need to learn the
same lesson twice.

## 13. File Structure Summary

```
.claude/
  agents/
    # Review & Quality Agents
    code-architect.md       # Architecture review agent
    build-validator.md      # Quality gate runner
    code-simplifier.md      # Complexity reducer
    email-guide.md          # Email domain expert
    verify-app.md           # User flow verifier
    # Implementation Agents (Subagents)
    product-agent.md        # PRD, scope, non-goals
    design-agent.md         # Design spec, screens, UX
    frontend-agent.md       # PWA UI implementation
    email-provider-agent.md # Provider adapters
    ai-agent.md             # AI prompts, RAG, memory
    channel-agent.md        # Telegram, WhatsApp mock
    testing-agent.md        # Test suite
    release-agent.md        # Vercel deployment
  hooks/
    format-on-save.json     # Auto-format on file edit
    lint-on-save.json       # Auto-lint on file edit
    typecheck-on-save.json  # Auto-typecheck on file edit
    verify-architecture.json # Block boundary violations
    spec-check-before-task.json # Read spec before task
    test-after-task.json    # Run tests after task
    build-validate-on-stop.json # Full validation on finish
  plugins/
    spec-check-plugin.md    # PRs must reference specs
    test-runner-plugin.md   # Canonical gate order
    supabase-schema-plugin.md # Schema vs spec validation
    vercel-release-plugin.md  # Pre-deploy gates
    email-fixture-plugin.md   # Provider fixture management
  skills/
    # Project-specific skills
    boris/SKILL.md          # Workflow coaching tips
    email-provider-adapter/SKILL.md  # Provider adapter generator
    ai-email-secretary/SKILL.md      # AI prompt module generator
    rag-memory/SKILL.md              # RAG pipeline generator
    telegram-command/SKILL.md        # Channel command generator
    pwa-ui/SKILL.md                  # Feature UI scaffold
    test-generation/SKILL.md         # Test scaffold generator
    vercel-release/SKILL.md          # Deploy checklist runner
    # Superpowers skills (workflow methodology)
    using-superpowers/SKILL.md       # Master skill discovery
    brainstorming/SKILL.md           # Ideas → designs
    writing-plans/SKILL.md           # Specs → implementation plans
    executing-plans/SKILL.md         # Execute plans with checkpoints
    subagent-driven-development/SKILL.md  # Subagent per task + review
    dispatching-parallel-agents/SKILL.md  # Parallel independent tasks
    test-driven-development/SKILL.md      # TDD red-green-refactor
    systematic-debugging/SKILL.md         # Root-cause debugging
    verification-before-completion/SKILL.md # Evidence before claims
    writing-skills/SKILL.md               # Create new skills
    using-git-worktrees/SKILL.md          # Isolated workspaces
    requesting-code-review/SKILL.md       # Code review dispatch
    receiving-code-review/SKILL.md        # Handle review feedback
    finishing-a-development-branch/SKILL.md # Complete dev branch
```

## 14. What This Workflow is NOT

- Not a free-form "vibe coding" session. Specs come first.
- Not enterprise process theater. The gates are minimal but binding.
- Not a CRM, calendar, or contact manager. Stay inside the email scope.
- Not a place to add a new abstraction "for the future". Add it when the
  second consumer arrives.
