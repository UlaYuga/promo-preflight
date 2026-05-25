# AGENTS.md - Promo Preflight

> Рабочий источник контекста для AI-агентов (Codex, OpenCode, Claude, Cursor и др.).
> Цель файла - не красивая документация, а максимальная эффективность агента: правильный skill, маленький scope, проверяемый результат.

## ЖЕСТКОЕ ПРАВИЛО: skill routing

Перед стартом задачи определи тип работы и выбери релевантный workflow/skill. Не начинай реализацию, пока не выбран маршрут.

### Routing table

- UI / visual design / layout / responsiveness:
  use `frontend-design`, `frontend-design-review`, `web-design-guidelines`, `frontend-ui-engineering`, `canvas-design`, `theme-factory`.

- Runtime error / failing build / failing tests / broken deploy:
  use `debugging-and-error-recovery` or `systematic-debugging`.

- Refactor / risky code change / code quality / review:
  use `code-review-and-quality`, `code-simplification`, `verification-before-completion`.

- New feature / unclear task / multi-step implementation:
  use `spec-driven-development`, `writing-plans`, `executing-plans`, `planning-and-task-breakdown`, `incremental-implementation`.

- Browser behavior / visual QA / user flow testing:
  use `browser-testing-with-devtools` or `webapp-testing`.

- CI / deploy / migrations / Railway / release work:
  use `ci-cd-and-automation`, `shipping-and-launch`, `deprecation-and-migration`, `git-workflow-and-versioning`, `finishing-a-development-branch`.

- Docs / office artifacts:
  use `docx`, `pdf`, `pptx`, `xlsx` when touching those artifact types.

- Figma / Refero / design references:
  use `figma-use`, `figma-implement-design`, `figma-generate-design`, `figma-generate-library`, `figma-create-design-system-rules`.

- Parallel exploration / subagents / large repo analysis:
  use `dispatching-parallel-agents`, `subagent-driven-development`, `context-engineering`, `using-git-worktrees`.

- Creating or improving skills:
  use `skill-creator`, `writing-skills`, `using-superpowers`.

If the task clearly matches a category above, use the relevant skill before implementation. If several categories apply, use the narrowest skill first, then escalate only if needed.

If no skill applies, state briefly: `No specific skill applies` and continue. Do not waste time checking every skill for trivial read-only tasks.

## Operating mode

- Prefer small, PR-sized changes.
- For non-trivial work, start with a short plan before editing.
- Treat user requests as product tickets: goal, files, constraints, acceptance criteria.
- Do not rewrite unrelated files.
- Do not change public product claims, metrics, test counts, or architecture docs unless the task explicitly asks for it.
- Do not hide uncertainty. If something cannot be verified locally, say so.

## Done means

A task is not complete until all relevant checks are done.

### Always

1. The change is scoped to the requested task.
2. No unrelated files were rewritten.
3. The final response lists:
   - files changed
   - commands run
   - checks passed/failed
   - risks or follow-ups

### Code changes

Run the relevant subset:

```bash
npm run typecheck
npm run lint
npm run test
```

Use targeted tests when the full suite is too expensive, but state what was not run.

### Production/deploy changes

Also run or account for:

```bash
npm run build
npm run db:check
```

For Railway changes, verify `railway.toml`, pre-deploy behavior, env vars, and `/api/ready` expectations.

### Checks/rules changes

Also run:

```bash
npm run checks:run
npm run rules:check
```

Worked examples must still produce expected severity classes and owner/blocker output.

### i18n changes

Also run:

```bash
npm run i18n:check
```

`locales/en.json` and `locales/ru.json` must keep identical keys.

### UI changes

Verify the changed flow in browser:

- desktop layout
- mobile layout
- dark UI contrast
- hover/focus states if interactive
- Intake -> Risk Report -> Launch Readiness flow if affected

## Product context

Promo Preflight is an agent-assisted launch-readiness workspace for regulated iGaming promo campaigns. It is a portfolio MVP and proof-of-work for AI-assisted delivery, not a gambling product.

Core product flow:

1. Intake - paste or load a campaign bundle
2. Risk Report - run deterministic checks and AI-assisted extraction
3. Launch Readiness - show go/no-go, owners, blockers, audit handoff

Post-Campaign Review is roadmap/stub only unless explicitly requested.

## Product constraints

- No auth, payments, SaaS onboarding, player accounts, casino mechanics, or affiliate flows.
- No gambling visual language, operator logos, real casino brands, or SEO targeting.
- Use generic operators and synthetic worked examples only.
- Draft data should stay in `localStorage` unless persistence is explicitly part of the task.
- Request bodies must not be logged.
- All pages should remain `noindex` / `nofollow`.
- Rate limit behavior matters: default is 20 req/min per IP.
- Deterministic checks first, AI second.
- AI output must be structured operational output, not generic prose.

## Stack

- Next.js 16 (App Router, React 19)
- TypeScript 6 - strict mode, no `any` without explicit justification
- Tailwind CSS 3.4 + `tailwindcss-animate`
- Zod - validation for external boundaries
- PostgreSQL (pg, Railway-ready)
- Anthropic SDK - optional AI assistance, mock mode supported
- YAML - `rules/rules.yaml`, `config/owners.yaml`
- Lucide React - icons
- driver.js - desktop product tour

## Architecture

```text
app/                  Next.js App Router
  app/intake/         Campaign bundle intake form
  app/risk-report/    Structured check results
  app/readiness/      Launch readiness board
  app/rules/          Rules artifact viewer
components/           Shared UI components
lib/
  checks/             Offline deterministic check engine (8 checks)
  ai/                 AI-assisted extraction (Anthropic SDK)
  rules/              YAML artifact loader + validation
  i18n/               EN/RU translation utilities
  tour/               Product tour logic
  owners/             Launch ownership matrix
  readiness.ts        Go/No-Go board generation
  versioning.ts       Version diff logic
  rate-limit.ts       In-memory rate limiter
  input-limit.ts      Input size validation
  export.ts           Markdown/Slack export
rules/
  rules.yaml          Versioned documentation artifact
config/
  owners.yaml         Workspace owner names
db/
  schema.sql          Postgres schema
  seed.sql            Seed data
locales/
  en.json             English translations
  ru.json             Russian translations
schemas/
  index.ts            Zod contracts for product types
  worked-examples.ts  EX01-EX11 synthetic test bundles
  fixtures.ts         Offline sample bundle
```

## Tailwind CSS - custom palette

Do not use standard Tailwind colors for the main UI. Use the custom palette:

| Token | Value | Purpose |
|---|---|---|
| `bg-background` | `#0b0b0c` | Global background |
| `bg-page` | `#111113` | Page background |
| `bg-surface` | `#1e1e22` | Cards, panels |
| `bg-overlay` | `#26262b` | Hover, overlays |
| `text-foreground` | `#e4e4e5` | Main text |
| `text-subtle` | `#9e9fa0` | Secondary text |
| `text-muted` | `#5f6060` | Tertiary text |
| `text-accent` | `#5f6dcd` | Accent elements |
| `bg-accent-muted` | `rgba(95,109,205,0.15)` | Accent background |
| `text-pass` | `#3dd68c` | Success |
| `text-warn` | `#e5a00d` | Warning |
| `text-fail` | `#e5534b` | Error |
| `text-info` | `#4d9cf4` | Info |

Radius scale: `rounded-sm` (5px), `rounded` / `rounded-md` (8px), `rounded-lg` (10px), `rounded-xl` (14px), `rounded-2xl` (18px).

## TypeScript rules

- Strict mode is enabled.
- No `any` without explicit comment.
- Validate all API boundaries with Zod.
- Prefer inferred types from Zod: `type Foo = z.infer<typeof FooSchema>`.
- React Server Components by default.
- Use `'use client'` only for state, effects, or browser APIs.

## i18n EN/RU

- Files: `locales/en.json`, `locales/ru.json`.
- Keys must be identical in both files.
- Check: `npm run i18n:check`.
- Use dot notation: `t('risk_report.severity.high')`.

## 8 offline checks

1. Channel consistency - copy vs offer value mismatch
2. Terms robustness - max bet, wagering, cashout clauses
3. Offer math sanity - mathematical contradictions
4. Jurisdictional risk - risk phrases, missing RG wording
5. Localization QA - locale/currency mismatch, ambiguous dates
6. Launch ownership - approvers assigned and approved
7. Link QA - URL validity, UTM params, domain consistency
8. Format QA - channel-specific character limits

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build
npm run typecheck        # TypeScript strict
npm run lint             # ESLint
npm run schema:check     # Zod schema smoke
npm run checks:mock      # Mock check runner
npm run checks:run       # Full regression: EX01-EX11 + 9 cases
npm run rules:check      # Validate rules/rules.yaml
npm run i18n:check       # Validate translations
npm run db:check         # Validate DB schema/seed
```

## Deployment

- Railway via `railway.toml` (Nixpacks)
- `ANTHROPIC_API_KEY` is optional - without it, offline checks still work
- `USE_MOCK_AI=true` for local development without an API key
