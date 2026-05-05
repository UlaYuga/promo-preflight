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
- **Anthropic SDK** — AI-ассистирование (опционально, есть mock-режим)
- **YAML** — rules/rules.yaml, config/owners.yaml
- **Lucide React** — иконки
- **driver.js** — desktop product tour

## Архитектура

```
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
  index.ts            Zod contracts for all product types
  worked-examples.ts  EX01–EX11 synthetic test bundles
  fixtures.ts         Offline sample bundle
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
| `text-accent` | `#5f6dcd` | Акцентные элементы |
| `bg-accent-muted` | `rgba(95,109,205,0.15)` | Акцентный фон |
| `text-pass` | `#3dd68c` | Успех |
| `text-warn` | `#e5a00d` | Предупреждение |
| `text-fail` | `#e5534b` | Ошибка |
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
4. **Jurisdictional risk** — risk phrases, missing RG wording
5. **Localization QA** — locale/currency mismatch, ambiguous dates
6. **Launch ownership** — approvers assigned and approved
7. **Link QA** — URL validity, UTM params, domain consistency
8. **Format QA** — channel-specific character limits

## Команды

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

## Safety conventions

- No auth, payments, SaaS onboarding
- No gambling visual language or operator logos
- Draft data only in `localStorage`
- Request bodies not logged
- `noindex` / `nofollow` on all pages
- Rate limit: 20 req/min per IP

## Deployment

- Railway via `railway.toml` (Nixpacks)
- `ANTHROPIC_API_KEY` опционально — без него все чеки работают офлайн
- `USE_MOCK_AI=true` для локальной разработки без API ключа
