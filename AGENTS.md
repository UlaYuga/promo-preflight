# AGENTS.md — Promo Preflight

> Единый источник контекста для AI-агентов (OpenCode, Claude, Cursor и др.)

## ЖЁСТКОЕ ПРАВИЛО: Skills

**Перед ЛЮБЫМ действием** (включая ответ на вопрос, чтение файла, запуск команды, поиск) ты ОБЯЗАН проверить ВСЕ навыки из `available_skills` — не только superpowers, но и project-level навыки (docx, figma-*, frontend-design, code-review, debugging, pdf, xlsx, и т.д.). Если есть хотя бы 1% шанс, что навык применим — ВЫЗОВИ `Skill` tool.

Вот полный список навыков, которые нужно всегда держать в уме и проверять:
- **integration-artifacts группы**: docx, pdf, pptx, xlsx — для любых операций с офисными файлами
- **figma-группа**: figma-use, figma-implement-design, figma-generate-design, figma-generate-library, figma-create-design-system-rules
- **design/frontend-группа**: frontend-design, frontend-design-review, frontend-ui-engineering, web-design-guidelines, brand-guidelines, canvas-design, theme-factory
- **engineering-группа**: code-review-and-quality, code-simplification, debugging-and-error-recovery, systematic-debugging, performance-optimization, security-and-hardening, api-and-interface-design, vercel-composition-patterns, vercel-react-best-practices, vercel-react-view-transitions, source-driven-development
- **process-группа**: brainstorming, spec-driven-development, test-driven-development, writing-plans, executing-plans, planning-and-task-breakdown, incremental-implementation, dispatching-parallel-agents, subagent-driven-development, finishing-a-development-branch
- **testing-группа**: browser-testing-with-devtools, webapp-testing, verification-before-completion
- **infra-группа**: ci-cd-and-automation, shipping-and-launch, deprecation-and-migration, documentation-and-adrs, git-workflow-and-versioning, using-git-worktrees, context-engineering
- **meta-группа**: skill-creator, writing-skills, using-superpowers

Это не опционально. Это не обсуждается. Даже «простой» вопрос требует проверки. Никаких рационализаций вроде «это слишком просто», «я уже знаю этот навык», «давай сначала посмотрю код».

Навыки определяют КАК подходить к задаче. Игнорирование навыков = неправильный подход = зря потраченное время.

## Стек

- **Next.js 16** (App Router, React 19)
- **TypeScript 6** — strict mode, no `any`
- **Tailwind CSS 3.4** + `tailwindcss-animate`
- **Zod** — валидация всех внешних границ
- **PostgreSQL** (pg, Railway-ready)
- **Drizzle ORM** — type-safe SQL access
- **Anthropic SDK** — AI-ассистирование (опционально, есть mock-режим)
- **Vitest** — unit + integration тесты
- **YAML** — rules/rules.yaml, config/owners.yaml
- **Lucide React** — иконки
- **driver.js** — desktop product tour

## Архитектура

```
app/                  Next.js App Router
  (app)/              Route group
    intake/           Campaign bundle intake form
    risk-report/      Structured check results
    readiness/        Launch readiness board
    rules/            Rules artifact viewer
    campaigns/        Campaign workspace & version history
    evidence/         Evidence viewer
    handoff/          Launch handoff preview
    owners/           Owner matrix
    runs/[id]         Run detail view
    status/           System status
    api/              API contract page
  api/v1/*            REST route handlers
  layout.tsx          Root layout
  page.tsx            Welcome page
  robots.ts           Robots disallow all
api/                  Shared API utilities (v1 helpers)
domain/               Domain layer (zero external deps)
  model/              Campaign, Run, Blocker, Owner
  vo/                 Amount, Url, Locale (branded types)
  service/            Pure domain services
  event/              PreflightEvent sealed union
  exception/          PreflightException hierarchy
application/          Application layer (ports, use cases, CQRS)
  bus/                In-process Bus + HandlerRegistry
  command/            Command types
  query/              Query types
  usecase/            RunChecksUseCase, VersionDiff
  port/               Repository / publisher interfaces
infrastructure/       Infrastructure layer (implements ports)
  persistence/        PgRunRepository (Drizzle + Postgres)
  telegram/           TelegramAdapter
  outbox/             OutboxEventPublisher + Worker
  checks/             ICheck implementations (runtime policies)
  handler/            Command/query handler implementations
  db/                 Drizzle client + connection
  registry/           DI registry
  audit/              Audit log adapter
components/           Shared UI components
lib/                  LEGACY — не расширять, мигрируется в domain/
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
rules/                YAML rule artifacts
  rules.yaml          Documentation/catalog metadata
  forbidden-phrases-by-region.yaml     Runtime: jurisdictional risk
  payment-methods-by-region.yaml       Runtime: payment compatibility
  crypto-disclosure-rules.yaml         Runtime: crypto disclosure
config/
  owners.yaml         Workspace owner names
db/
  schema.sql          Postgres schema
  seed.sql            Seed data
  migrations/         Drizzle versioned migrations
locales/
  en.json             English translations
  ru.json             Russian translations
schemas/
  index.ts            Zod contracts for all product types
  worked-examples.ts  EX01–EX11 synthetic test bundles
  fixtures.ts         Offline sample bundle
scripts/              CLI utility and demo scripts
bin/                  CLI entry points (preflight-check.ts)
docs/                 Documentation + ADRs
```

## Tailwind CSS — кастомная палитра

**Не использовать стандартные Tailwind цвета** для основного UI. Использовать только кастомные:

| Токен | Значение | Назначение |
|---|---|---|
| `bg-background` | `#0b0b0c` | Глобальный фон |
| `bg-page` | `#111113` | Фон страницы |
| `bg-surface` | `#1e1e22` | Карточки, панели |
| `bg-overlay` | `#26262b` | Ховеры, оверлеи |
| `text-foreground` | `#e4e4e5` | Основной текст |
| `text-subtle` | `#9e9fa0` | Вторичный текст |
| `text-muted` | `#5f6060` | Третичный текст |
| `text-accent` | `#c5ff3d` | Акцентные элементы (lime) |
| `bg-accent-muted` | `rgba(95,109,205,0.15)` | Акцентный фон (blue) |
| `text-pass` | `#7be17b` | Успех |
| `text-warn` | `#ffb547` | Предупреждение |
| `text-fail` | `#ff5d5d` | Ошибка |
| `text-info` | `#4d9cf4` | Информация |

Радиусы: `rounded-sm` (5px), `rounded` / `rounded-md` (8px), `rounded-lg` (10px), `rounded-xl` (14px), `rounded-2xl` (18px).

## TypeScript правила

- Strict mode включен
- Никаких `any` без явного комментария
- Все API-границы валидируются Zod
- Типы выводятся из Zod: `type Foo = z.infer<typeof FooSchema>`
- React Server Components по умолчанию, `'use client'` только при необходимости (useState, useEffect, browser APIs)

## i18n (EN/RU)

- Файлы: `locales/en.json`, `locales/ru.json`
- Ключи должны быть идентичны в обоих файлах
- Проверка: `npm run i18n:check`
- Перевод через точечную нотацию: `t('risk_report.severity.high')`

## 8 офлайн-чеков

1. **Channel consistency** — copy vs offer value mismatch
2. **Terms robustness** — max bet, wagering, cashout clauses
3. **Offer math sanity** — математические противоречия
4. **Jurisdictional risk signals** — risk phrases, missing RG wording
5. **Localization QA** — locale/currency mismatch, ambiguous dates
6. **Launch ownership** — approvers assigned and approved
7. **Link QA** — URL validity, UTM params, domain consistency
8. **Format QA** — channel-specific character limits

## Команды

```bash
npm run dev              # Dev server
npm run build            # Production build (next build + fix-build-output)
npm run typecheck        # TypeScript strict
npm run lint             # ESLint
npm run test             # Vitest (unit + integration)
npm run test:watch       # Vitest watch mode
npm run schema:check     # Zod schema smoke
npm run checks:mock      # Mock check runner
npm run checks:run       # Full regression: EX01-EX11 + 9 cases
npm run rules:check      # Validate rules/rules.yaml
npm run i18n:check       # Validate translations (EN ↔ RU)
npm run owners:check     # Validate config/owners.yaml
npm run versioning:check # Version diff smoke
npm run ai:check         # AI module smoke test
npm run db:check         # Validate DB schema/seed (требуется DATABASE_URL)
npm run check            # CLI: cat campaign.json | npm run check
```

## Safety conventions

- No end-user accounts, payments, SaaS onboarding; `/api/v1/*` is protected by server-side bearer auth
- No gambling visual language or operator logos
- Draft data only in `localStorage`
- Request bodies not logged
- `noindex` / `nofollow` on all pages
- Rate limit: 20 req/min per IP

## OMO Runtime Policies

Runtime policies for OpenCode/OMO live in `.omo/`. Sisyphus must read and follow:

- `.omo/sisyphus-autopilot.md`
- `.omo/MODEL_ROUTING.md`
- `.omo/PROFILE_MATRIX.md`
- `.omo/GO_ONLY_EMERGENCY_MODE.md`
- `.omo/VISUAL_PIPELINE_POLICY.md`

These policies override generic behavior for model routing, visual workflow, Go-only mode, no CloseRouter, no Git, no Memory.

## Deployment

- Railway via `railway.toml` (Nixpacks)
- `ANTHROPIC_API_KEY` опционально — без него все чеки работают офлайн
- `USE_MOCK_AI=true` для локальной разработки без API ключа
