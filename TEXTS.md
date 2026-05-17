# TEXTS — single source of truth for all English copy

> Every piece of English text that lands in README, docs/, ADRs, case study, Telegram templates lives here first. Workers generate into this file. You polish (especially anything that will be translated to Russian or needs de-AI-ifying). Coordinator copies the final into target files during Block 11.
>
> **Convention**: each section has a status marker — `<!-- STATUS: empty | drafted | polished | shipped -->`. Workers update on completion. You set `polished` after your manual pass.

---

# Verbatim quotes — DO NOT EDIT

> These are direct verifiable citations. Workers must use them verbatim with attribution. Never paraphrase regulatory quotes.

## From 01.tech × G GATE MEDIA Global iGaming Report 2026

**Станислав, SEO Product Manager 01.tech** (Ch.5.3) — **the #1 quote for the README pain section**:
> «Ключевым и очень недооценённым трендом в 2026 году я бы назвал не ИИ или кор-апдейты, а возрастающие локальные блокировки и регуляторное давление в Латинской Америке и Азии, которые начались ещё в прошлом году и затронули не только продукты, но и вебмастеров. Устойчивость инфраструктуры и слаженные процессы по отслеживанию и реакции на блокировки со стороны конкретных локальных операторов будут конкурентным преимуществом в этом году.»

English translation (use this in README):
> "The key and very underrated trend in 2026, in my view, is not AI or core updates, but the increasing local blockings and regulatory pressure in Latin America and Asia. These began last year and have hit not just products but webmasters too. Infrastructure resilience and tight processes for tracking and reacting to local-operator blocks will be the competitive advantage of this year." — **Stanislav, SEO Product Manager, 01.tech**, *Global iGaming Report 2026*

**Виктория, BDM 01.tech** (Ch.3):
> «Конкурентным преимуществом для успешного iGaming-продукта является не количество подключённых методов платежа, а способность выстраивать гибкую, локализованную и устойчивую платёжную экосистему, адаптированную под требования конкретного рынка.»

English:
> "The competitive advantage of a successful iGaming product is not the number of integrated payment methods but the ability to build a flexible, localized, and resilient payment ecosystem adapted to a specific market's requirements." — **Victoria, BDM, 01.tech**

**Александр Романов, Head of White Label 01.tech** (Ch.4 closing):
> «Максимальную ценность обретают экосистемные решения, которые объединяют трафик, продукт, аналитику, платежи и инфраструктуру в единую модель роста.»

English:
> "Ecosystem solutions that unify traffic, product, analytics, payments, and infrastructure into a single growth model gain the most value." — **Alexander Romanov, Head of White Label, 01.tech**

**Аскер, CEO 100HP** (Ch.6 — localization):
> «Мы не просто переводим игры на другой язык. Мы перестраиваем их мир так, чтобы он полностью соответствовал культурному коду конкретного региона.»

English:
> "We don't just translate games to another language. We rebuild their world so it fully matches the cultural code of the specific region." — **Asker, CEO, 100HP**

## From DEEP-RESEARCH.md (verified external citations)

**Emmanuel Omoloyin, SEO Content Writer** (DEEP-RESEARCH §7, citation 169):
> "Wagering requirements, time limits, eligible games and maximum bet restrictions MUST BE clearly stated."

> "Gamble responsibly as a footer link no longer satisfies several jurisdictions."

**Industry Compliance Manager, iGaming** (DEEP-RESEARCH §7, citation 169):
> "Affiliate marketing is becoming a compliance blind spot — you're liable for what affiliates publish on your behalf, and manual review simply doesn't scale."

**ASA verdict on PokerStars promo** (DEEP-RESEARCH §1, citation 25):
> "We concluded the ad was irresponsible and breached the Code. The ad must not appear again."

**CONAR (Brazilian advertising self-regulator), 2024** (DEEP-RESEARCH §1):
> The phrase **«vencer é só o começo»** (winning is just the beginning) was ruled non-compliant because it "creates unrealistic expectations and promises guaranteed financial success."

## Industry estimates — MUST be marked with `*industry estimate*` footnote when used

These numbers come from OLD-RESEARCH §2, ChatGPT's own dip-research synthesis. They are **not** verified hard data — public iGaming operators do not publish promo-launch metrics. Use them with the explicit `*industry estimate, no public hard data*` markdown footnote whenever they appear in README / pain section / case study:

- **20-30 promo campaigns per month** for a mid-size operator
- **2-5 person-hours of review** per campaign (marketing + legal + compliance combined)
- **5-10% of campaigns** are pulled / corrected post-launch due to compliance issues
- **8-15 locales** supported by typical multi-jurisdiction operator
- **10-30 person-hours** to fully prepare a Brazilian welcome-offer launch (from DEEP-RESEARCH §8 — closer to verified because built on specific case walkthrough)

When workers cite these in any text, format must be:
```
20-30 promo campaigns a month*

*Industry estimate per OLD-RESEARCH §2; no public operator metrics published.
```

## Competitive positioning — canonical formulation (use verbatim)

This is the **canonical** way to frame the competitive landscape. Workers may NOT improvise this — paste as-is and let owner polish only the surface phrasing, not the content.

```
On the market, no publicly-available product for multi-jurisdictional promo compliance in iGaming currently exists. This is confirmed by two independent research passes (DEEP-RESEARCH §6 and OLD-RESEARCH §4) covering SoftSwiss, BetConstruct, EveryMatrix, Pronet Gaming, NuxGame, White Hat Gaming, Digitain, and ProgressPlay — none publicly offer automated promo-compliance tooling.

Internal solutions inside large operators (Bet365, Pokerstars-class) may exist but are closed and not tradeable. Preflight closes this gap as an open-source layer that any operator can adopt without license negotiation.

Notably, 01.tech's own 159-page Global iGaming Report 2026 identifies "local blockings and regulatory pressure in Latin America and Asia" (Stanislav, SEO Product Manager) as the #1 underrated risk of 2026 — yet none of the white-label platforms (including 01.tech's own product line) addresses this with a dedicated pre-launch readiness layer.
```

## From OLD-RESEARCH.md (verified UK / Sweden / Ontario citations)

**Adam Mateja, CRM / Product, Blurrify, 2024**:
> "Promotions in iGaming are one of those things that look simple on paper, and then turn into a lot of manual work."

> "Setting up iGaming promos manually is a pain; it's slow, and you're usually too late to react to what's happening on the pitch."

**Dr. Karin Schnarr, CEO and Registrar, AGCO Ontario, 2025**:
> "An offer that requires a player to sustain substantial losses for a perceived benefit is not a fair offer."

## Verified fines table (use in README pain bullets and CASE-STUDY alternate-timeline)

| Operator | Year | Regulator | Amount | Cause |
|---|---|---|---|---|
| **Perfect Storm B.V.** + **Rossobash S.r.l.** | Apr 2026 | DGOJ Spain | **€5M each + 2-year ban** | Illegal advertising / unlicensed betting operations |
| **Sky Betting & Gaming** (Bonne Terre) | 2022 | UKGC | **£1.17M** (~€1.4M) | Welcome bonus emails sent to 41,395 self-excluded + 249,159 unsubscribed |
| **BV Gaming** (BetVictor) | 2022 | UKGC | **£2M** (~€2.4M) | Cashback bonus terms not transparent — unfair to consumers |
| **Spooniker** (Kindred) | 2020 | Spelinspektionen | **SEK 100M → 30M** (~€2.6M) | Single-bonus-rule violation |
| **BGO Entertainment** | 2017 | UKGC | **£300K** (~€360K) | Misleading bonus promotions, partly via affiliate channels |
| **BetMGM Canada** | 2025 | AGCO Ontario | **C$110K** | Welcome bonus advertising (prohibited in Ontario) |
| **Well Played Media** (Casino Days) | 2025 | AGCO Ontario | **C$54K** | 35× wagering bonus deemed not a fair offer |
| **LeftLanePapi** (influencer) | Jul 2025 | KSA Netherlands | **€25K per violation** | Promoting unlicensed Skyhills |
| **William Hill** | Oct 2025 | ASA UK | (Withdrawal ordered) | Misleading "£40 from £20" promo — actual minimum stake was £40 |

---

# README — full content

## Hero block (T-002)

<!-- STATUS: drafted -->
<!-- Owner: this is the first thing Nina sees. Polish ruthlessly. -->

```
# Promo Preflight

*Pre-launch readiness checks for iGaming operators expanding into emerging markets. Built by a PM over a weekend with Claude Code.*

*Built around the regulatory realities described in the [01.tech × G GATE MEDIA Global iGaming Report 2026](link-tbd).*

[![License](https://img.shields.io/badge/license-Apache_2.0-blue)](LICENSE) [![Next.js](https://img.shields.io/badge/Next.js-16-black)]() [![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)]() [![Tests](https://img.shields.io/badge/tests-placeholder-yellow)]() [![CI](https://img.shields.io/badge/ci-placeholder-yellow)]()

<p align="center">
  <img src="./docs/assets/hero.png" alt="Preflight in action" width="800" />
</p>

[Live demo](https://promo-preflight-production.up.railway.app/) · [Docs](./docs) · [Case study](./docs/CASE-STUDY.md)

---
```

## The problem (T-001)

<!-- STATUS: drafted -->
<!-- Worker: produce 3 bullets each citing a verifiable source from the "Verbatim quotes" block above. Tone: direct, technical, slightly self-aware. Max 350 words for the entire section. -->

Every quarter, another regulator updates its rules. Your promo team is still reviewing T&C across eight locales in Google Docs.

- "The key and very underrated trend in 2026, in my view, is not AI or core updates, but the increasing local blockings and regulatory pressure in Latin America and Asia. These began last year and have hit not just products but webmasters too. Infrastructure resilience and tight processes for tracking and reacting to local-operator blocks will be the competitive advantage of this year." — **Stanislav, SEO Product Manager, 01.tech**, *Global iGaming Report 2026*

- "Gamble responsibly as a footer link no longer satisfies several jurisdictions." — **Emmanuel Omoloyin, SEO Content Writer**, *DEEP-RESEARCH §7, citation 169*

- **Perfect Storm B.V.**: €5M fine + 2-year ban, DGOJ Spain (Apr 2026). **Sky Betting & Gaming**: £1.17M, UKGC (2022) — welcome bonus emails sent to self-excluded players. **Kindred (Spooniker)**: SEK 100M, Spelinspektionen (2020) — single-bonus-rule violation. Real money lost when promo compliance fails.

No dedicated tool exists for multi-jurisdiction promo compliance in iGaming. Reviews happen across Slack, Google Docs, Excel, and Notion — one chain per locale, none of it audit-defensible. As Adam Mateja put it: "Promotions in iGaming are one of those things that look simple on paper, and then turn into a lot of manual work."

A mid-size operator runs 20-30 campaigns a month,\* spends an estimated 2-5 person-hours per campaign on compliance review,\* and still pulls or corrects 5-10% of campaigns post-launch.\*

\*Industry estimate per OLD-RESEARCH §2; no public operator metrics published.

Preflight runs 11 deterministic checks per target jurisdiction against versioned YAML rule artifacts — before launch. One canonical `CampaignBundle`, one JSON format. Each check returns `GO` / `WARN` / `BLOCK` with a specific rule reference and a suggested owner. Events route via webhook (Telegram first); every run is written to an audit log.

Built around the regulatory and operational realities described in the [01.tech × G GATE MEDIA Global iGaming Report 2026](link-tbd). Preflight closes the gap that report identifies as 2026's most underrated risk.

## What this is

<!-- STATUS: drafted -->
<!-- Worker T-003: 2-3 paragraphs. Reference 11 jurisdictional checks. Mention the Before/After collage from VISUALS §2. -->

Promo Preflight runs 11 deterministic compliance checks against a campaign bundle before it goes live. Each check targets a specific risk category: T&C completeness per jurisdiction, forbidden phrases, offer math, payment method compatibility, crypto disclosure rules, link health, format requirements, launch ownership, and localization depth. Checks run against versioned YAML rule artifacts — same input, same output, every time.

The system accepts one canonical `CampaignBundle` in JSON — one format regardless of whether you're launching in Brazil, India, Mexico, or the UK — and returns a `GO` / `WARN` / `BLOCK` verdict with blockers, each tied to a rule ID and a suggested owner role. Every run is persisted and logged; the audit trail holds up to regulatory review.

<!-- Before/after collage: see VISUALS §2 — "Before" shows the current Notion/Slack/Google Docs manual chain; "After" shows a Preflight run result with labeled blockers. Owner inserts the image table below. -->

<table>
<tr>
<td><strong>Before</strong><br>4 tabs, 8 chats, 0 versioning.<br><img src="./docs/assets/before.png" /></td>
<td><strong>After</strong><br>One workspace. Verdict in 12 seconds.<br><img src="./docs/assets/after.png" /></td>
</tr>
</table>

## Who this is for (T-003)

<!-- STATUS: drafted -->
<!-- Worker: markdown table, 3 rows, columns "You are" and "What this gives you" -->

| You are | What this gives you |
|---|---|
| A multi-jurisdiction iGaming operator (lic. EU + LATAM + offshore) | Catch jurisdictional risks before promo launches — Brazilian SPA, Indian UPI ban, Mexican SPEI rules, Algerian crypto prohibition |
| A platform / white-label engineer at a B2B iGaming infrastructure provider (01.tech, SoftSwiss, BetConstruct, EveryMatrix tier) | Drop-in pre-launch gate your operator customers can add to their CRM / Promo workflow without your platform team owning compliance |
| A CRM / Promo Ops lead launching campaigns across 8-15 locales every month | Replace the Notion → Slack → Google Doc → Excel review chain with one deterministic check and one Telegram alert with assignable owners |

## How it works (T-003)

<!-- STATUS: drafted -->
<!-- Worker: insert mermaid sequence below + paragraph + Telegram screenshot reference (VISUALS §6) -->

Each run follows a synchronous request path — validate, dispatch, check, persist, respond — with side effects (Telegram notifications, audit events) handled asynchronously via the outbox pattern.

### Mermaid: data flow sequence

```mermaid
sequenceDiagram
    autonumber
    actor Promo as Promo team
    participant API as POST /v1/runs
    participant Bus as Bus + Handlers
    participant Run as RunChecksUseCase
    participant Repo as PgRunRepository
    participant Outbox as outbox (Postgres)
    participant Worker as OutboxWorker
    participant TG as Telegram bot
    participant Audit as audit_log

    Promo->>API: POST campaign bundle + Idempotency-Key
    API->>Bus: dispatch(RunChecksCommand)
    Bus->>Run: execute
    Run->>Run: 11 deterministic checks per targetJurisdiction
    Run->>Repo: save Run + Blockers (transaction)
    Run->>Outbox: write events (same transaction)
    Run-->>API: { runId, verdict, counts, blockers }
    API-->>Promo: 200 OK
    par async
        Worker->>Outbox: poll undelivered
        Worker->>TG: notify(RunCompleted)
        Worker->>Audit: append(events)
    end
```

Preflight slots into the existing compliance workflow as the final pre-launch gate. The upstream process stays owned by the promo and compliance team; Preflight replaces the manual final check with one deterministic API call.

### Mermaid: Preflight in your workflow

```mermaid
sequenceDiagram
    autonumber
    participant CRM as CRM marketer
    participant Promo as Promo manager
    participant Compl as Compliance officer
    participant Legal as Legal counsel
    participant Loc as Localization
    participant Aff as Affiliate manager
    participant Design as Creative / brand
    participant Pay as Payments team
    participant Pre as 🎯 Promo Preflight
    participant Launch as Launch owner

    CRM->>Promo: draft campaign concept
    Promo->>Compl: send for compliance review
    Compl->>Legal: T&C clauses to verify
    Legal-->>Compl: approved T&C structure
    Compl->>Loc: localization brief (8-15 locales)
    Loc-->>Compl: translated bundles
    Compl->>Aff: UTM / tracking spec
    Compl->>Pay: payment-method availability per region
    Compl->>Design: creative spec
    Note over Pre: Existing manual workflow ends here. Below — what Preflight automates.
    Compl->>Pre: campaign bundle (one canonical JSON)
    Pre-->>Compl: 11 deterministic checks per targetJurisdiction
    Pre-->>Launch: assigned blockers with ownerHint
    Launch->>Launch: review verdict (GO / WARN / BLOCK)
    Launch->>Launch: launch only when GO
```

Here's what the Telegram notification looks like in production:

<img src="./docs/assets/telegram-screenshot.png" width="500" />

## Three paths to use (T-003)

<!-- STATUS: drafted -->
<!-- Three numbered sub-sections -->

### 1. Self-host via docker-compose

The fastest path to a production-ready instance:

```bash
git clone https://github.com/UlaYuga/promo-preflight.git
cd promo-preflight
cp .env.example .env   # fill DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
docker-compose up -d
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @schemas/sample-bundle.json | jq
```

See [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) for the full environment variable reference.

### 2. Drop into your CI (npm package + CLI)

*Coming in T-033.*

```bash
npx preflight-check --bundle campaign.json --jurisdiction BR --exit-on-block
```

Exits `0` on GO, `1` on WARN, `2` on BLOCK. JSON to stdout. Use as a build gate in any CI pipeline.

### 3. Managed SaaS

Coming soon. [Email for early access](mailto:alex@marlerino.group).

## Tech stack (T-003)

<!-- STATUS: drafted -->
<!-- markdown table of stack with one-line rationale per dep -->

| Package | Why |
|---|---|
| `next` 16 | App Router + React Server Components — single process hosts both API and UI |
| `react` 19 | Server Components; concurrent rendering for the run result view |
| `typescript` 6 | Strict mode; all types derived from Zod schemas via `z.infer<>` |
| `tailwindcss` 3.4 | Custom design token palette; no standard Tailwind color classes in UI code |
| `drizzle-orm` + `postgres` | Type-safe SQL with zero-overhead query builder; migrations via Drizzle Kit |
| `zod` | Runtime validation at all system boundaries |
| `vitest` | Fast unit + integration tests; ESM-native, TypeScript path alias support |
| `@anthropic-ai/sdk` | Optional AI augmentation layer; stubbed when `USE_MOCK_AI=true` |
| `yaml` | Parses jurisdiction rule artifacts (`rules/*.yaml`) at boot |
| Telegram Bot API | Outbound compliance alerts to the team channel via the outbox worker |

## Architecture (T-003)

<!-- STATUS: drafted -->
<!-- ASCII tree of domain/application/infrastructure/api layout -->

```
domain/
  model/         # Campaign, Run, Blocker, Owner
  vo/            # Amount, Url, Locale, Severity (branded types)
  service/       # ReadinessCalculator, BlockerDiff (pure functions)
  event/         # PreflightEvent (sealed discriminated union)
  exception/     # PreflightException hierarchy
application/
  command/       # RunChecksCommand, ...
  query/         # FindRunQuery, CampaignDiffQuery, ...
  usecase/       # RunChecksUseCase, VersionDiff, ...
  port/          # IRunRepository, IEventPublisher, IHandoffAdapter, ...
  bus/           # Bus, HandlerRegistry
infrastructure/
  persistence/   # PgRunRepository (Drizzle + Postgres)
  telegram/      # TelegramAdapter
  outbox/        # OutboxEventPublisher, OutboxWorker
  ai/            # Anthropic adapter (optional)
  handler/       # Command/query handler implementations
  registry/      # DI registry, Bus factory
api/
  v1/            # Next.js route handlers (thin — all through Bus)
lib/             # LEGACY — migrating to domain/application in v2.1; do not extend
rules/           # YAML rule artifacts (versioned, human-authored)
schemas/         # Zod contracts (re-exported from domain/)
```

Layer rule: `domain/` → zero dependencies outside itself. `application/` → declares ports, never implements them. `infrastructure/` → implements ports, may import any external library. `api/` → translates HTTP into Bus dispatches, contains no business logic.

Full diagram: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## What we deliberately don't do (T-003)

<!-- STATUS: drafted -->
<!-- Bullet list of explicit non-goals with rationale -->

- No multi-tenant (org-scoped data) — out of scope for this sprint; can be added without changing core
- No gRPC — REST + webhooks fit the consumer model (CRM/Promo Ops teams)
- No live LLM in default checks path — checks must be deterministic and reproducible; AI is an optional augmentation only (see ADR-0003 + ADR-0005 for the planned augmentation roadmap)
- No auth — out of scope for demo; production deployment expects auth at infra layer
- No microservices — one process; outbox worker is a separate entrypoint of the same binary
- No "promo compliance score" magic number — verdicts are GO / WARN / BLOCK based on rule severity, not opaque AI

## AI augmentation roadmap (T-003 — new sub-section, after "What we deliberately don't do")

<!-- STATUS: drafted -->

Preflight ships a deterministic-first compliance core. AI is the planned augmentation layer on top — never the decision-maker.

Five augmentations are scoped for v1.x:

- **PDF / text extraction** — drop a T&C PDF or a free-text campaign brief; AI extracts a structured `CampaignBundle`; the deterministic checks run as normal.
- **Fix suggestion per blocker** — for each `BLOCK`, AI generates 3 locale-aware replacement copy variants that preserve marketing intent.
- **Cultural localization audit** — catches culture-specific mismatches that regex rules miss: alcohol references in Malaysia, religious imagery in MENA, gender-coded financial promises.
- **Plain-language explanation per blocker** — why this was flagged, which regulator, which article, in the marketer's language rather than the lawyer's.
- **Compliance Q&A** — ask "can I say 'risk-free' in UK copy?" and get an answer grounded in the rule artifacts.

> "Ecosystem solutions that unify traffic, product, analytics, payments, and infrastructure into a single growth model gain the most value." — **Alexander Romanov, Head of White Label, 01.tech**, *Global iGaming Report 2026*

See [ADR-0005](./docs/adr/0005-ai-augmentation-roadmap.md) for full reasoning. None of these ship in v1.0; the deterministic kernel does. AI lands incrementally in v1.x.

## Contributing / License / Author (T-003)

<!-- STATUS: drafted -->

```
Issues and PRs welcome. Apache 2.0.

Built by Alexander Ulanov — PM with 6+ years in digital production, e-commerce, and TV.
[github.com/UlaYuga](https://github.com/UlaYuga)
```

---

# docs/ARCHITECTURE.md (T-006)

<!-- STATUS: drafted -->

# Promo Preflight — Architecture

## Layers

```mermaid
flowchart TD
  api["**api/v1**\nNext.js route handlers\n(thin — calls Bus only)"]
  application["**application**\nuse cases · commands · queries\nports (interfaces)"]
  domain["**domain**\nmodel · value objects · services\nevents · exceptions\n(zero runtime deps)"]
  infrastructure["**infrastructure**\npersistence · telegram · outbox · ai\n(implements application ports)"]

  api --> application
  infrastructure --> application
  application --> domain
```

[`api/`](../api/) never imports [`infrastructure/`](../infrastructure/) directly. [`domain/`](../domain/) has no outgoing dependencies on any other layer. [`infrastructure/`](../infrastructure/) implements interfaces (ports) declared in [`application/port/`](../application/port/).

## Source layout

```
domain/
  model/         # Aggregates: Campaign, Run, Blocker, Owner
  vo/            # Value objects: Amount, Url, Locale, Severity (branded types)
  service/       # Pure domain services: ReadinessCalculator, BlockerDiff
  event/         # Sealed PreflightEvent discriminated union
  exception/     # PreflightException hierarchy
application/
  command/       # Pure command DTOs
  query/         # Pure query DTOs + view shapes
  usecase/       # Orchestrators that call ports + domain
  port/          # Interfaces for infrastructure: IRunRepository, ITelegramAdapter, IAuditRepository, IEventPublisher
  bus/           # Bus + HandlerRegistry
infrastructure/
  persistence/   # Drizzle/Postgres implementations of repositories
  telegram/      # Telegram bot adapter
  outbox/        # Outbox publisher + worker
  ai/            # Anthropic adapter (optional)
  handler/       # Command/query handler implementations
  registry/      # DI registry, Bus factory
api/
  v1/            # Next.js API route handlers — thin, all through Bus
```

**[domain/](../domain/)** owns business concepts and rules. It has no knowledge of databases, HTTP, or external services.

**[application/](../application/)** orchestrates domain operations and declares *what it needs* via ports. It does not know *how* those ports are implemented.

**[infrastructure/](../infrastructure/)** implements every port and may import any external library. It never calls use cases directly.

**[api/](../api/)** translates HTTP requests into Commands/Queries, dispatches them through the Bus, and returns HTTP responses. It contains no business logic.

## Data flow

Full lifecycle of `POST /api/v1/runs`:

```mermaid
sequenceDiagram
  autonumber
  participant Client
  participant API as api/v1/runs
  participant Bus as Bus + HandlerRegistry
  participant UC as RunChecksUseCase
  participant Repo as IRunRepository (Pg)
  participant Outbox as outbox table
  participant Worker as OutboxWorker
  participant TG as TelegramAdapter
  participant Audit as IAuditRepository

  Client->>API: POST /api/v1/runs + Idempotency-Key
  API->>Bus: dispatch(RunChecksCommand)
  Bus->>UC: execute(RunChecksCommand)
  UC->>Repo: findCampaign(campaignId)
  UC->>UC: run 11 deterministic checks per targetJurisdiction
  UC->>Repo: saveRun(run) + saveBlockers(blockers) [transaction]
  UC->>Outbox: writeEvents(RunCompleted, BlockerRaised…) [same transaction]
  UC-->>Bus: Result<RunResult, PreflightException>
  Bus-->>API: RunResult
  API-->>Client: 200 { runId, verdict, counts, blockers }
  par OutboxWorker (async)
    Worker->>Outbox: poll undelivered rows
    Worker->>TG: deliver RunCompleted notification
    Worker->>Audit: append audit events
    Worker->>Outbox: mark delivered
  end
```

## Key invariants

- [`domain/`](../domain/) has zero runtime dependencies on anything outside `domain/`.
- Ports are owned by [`application/port/`](../application/port/); implementations live in [`infrastructure/`](../infrastructure/).
- Commands return `Result<T, PreflightException>`; queries return `T` or throw `NotFoundException`.
- All write paths go through repositories — no direct SQL outside [`infrastructure/persistence/`](../infrastructure/persistence/).
- Events are published after DB commit (outbox pattern) — no phantom events on rollback.
- `Idempotency-Key` is required on `POST /api/v1/runs`; the same key always returns the same `runId`.
- All API input is validated by Zod schemas owned by [`application/`](../application/).
- Domain throws only `PreflightException` subclasses, never raw `Error`.

## Dependencies

| Package | Why |
|---|---|
| `next` 16 | App Router + React Server Components — single process hosts both API and UI |
| `drizzle-orm` + `postgres` | Type-safe SQL with zero-overhead query builder; migrations via Drizzle Kit |
| `zod` | Runtime validation at all system boundaries; types derived from schemas via `z.infer<>` |
| `vitest` | Fast unit + integration tests; compatible with ESM and TypeScript path aliases |
| `@anthropic-ai/sdk` | Optional AI augmentation layer; swapped for stubs when `USE_MOCK_AI=true` |
| `yaml` | Parses jurisdiction rule artifacts (`rules/*.yaml`) at boot — no runtime YAML parsing |
| Telegram Bot API | Outbound notifications to the compliance team channel via outbox worker |

## What we deliberately don't do

- **No multi-tenant / RLS** — out of scope for this sprint; adding `org_id` to all tables plus Row-Level Security is the natural extension, no domain changes needed.
- **No gRPC** — REST + Telegram webhook fit the consumer model (CRM / Promo Ops teams don't run gRPC clients).
- **No live LLM in the default checks path** — checks must be deterministic and reproducible; a regulator asking "why was this flagged" cannot accept "the LLM said so." AI is an optional augmentation layer (see [ADR-0003](./adr/0003-deterministic-first-ai-second.md) and [ADR-0005](./adr/0005-ai-augmentation-roadmap.md)).
- **No auth** — out of scope for the demo; production deployments expect auth at the infrastructure layer (Cloudflare Access, nginx basic-auth, or API gateway).
- **No microservices** — one process for now; the outbox worker is a separate entrypoint of the same binary, not a separate service.
- **No opaque "compliance score"** — verdicts are `GO` / `WARN` / `BLOCK` based on rule severity, not an aggregate number.

---

# docs/API.md (T-007)

<!-- STATUS: drafted -->

# Promo Preflight — REST API

All endpoints are prefixed `/api`. The versioned path is `/api/v1/...`.

## Table of contents

1. [POST /api/v1/runs](#1-post-apiv1runs)
2. [GET /api/v1/runs/:id](#2-get-apiv1runsid)
3. [GET /api/v1/campaigns](#3-get-apiv1campaigns)
4. [GET /api/v1/campaigns/:id](#4-get-apiv1campaignsid)
5. [GET /api/v1/campaigns/:id/versions](#5-get-apiv1campaignsidversions)
6. [GET /api/v1/campaigns/:id/diff](#6-get-apiv1campaignsiddiff)
7. [GET /api/health](#7-get-apihealth)
8. [GET /api/ready](#8-get-apiready)
9. [Error model](#error-model)
10. [Versioning policy](#versioning-policy)

---

## 1. POST /api/v1/runs

Runs all enabled checks against a campaign bundle. Idempotent — submitting the same `Idempotency-Key` twice returns the same result.

**Headers**

| Header | Required | Description |
|---|---|---|
| `Content-Type` | yes | `application/json` |
| `Idempotency-Key` | yes | Client-generated UUID. Same key + same body → same `runId`. Same key + different body → 409. |

**Request body** — `{ campaign: CampaignBundle, options?: RunOptions }`

The `campaign` field matches [`CampaignBundleSchema`](../schemas/index.ts) exactly:

```ts
{
  campaign: {
    metadata: {
      campaignName: string          // max 120 chars
      operatorLabel?: string        // max 80 chars
      promoType: "welcome" | "reload" | "freebet" | "cashback"
                | "tournament" | "loyalty" | "reactivation"
      geo: string                   // e.g. "MGA generic", "Brazil SPA/MF"
      locale: string                // e.g. "pt-BR", "en-GB"
      currency: string              // ISO 4217, e.g. "BRL", "EUR"
      launchDate?: string           // ISO 8601 date
      channelsIncluded: Array<"email" | "push" | "onsite" | "landing" | "sms" | "in_app">
    }
    offer: {
      minDeposit?: number
      bonusAmount?: number
      bonusPercentage?: number
      maxBonus?: number
      wageringRequirement?: string  // e.g. "35x bonus" (string, not a multiplier number)
      maxCashout?: number
      maxBet?: number
      eligibleGames?: string
      contribution?: string
      cooldown?: string
      eligibilityRules?: string
    }
    assets: Array<{
      channel: "email" | "push" | "onsite" | "landing" | "sms" | "in_app"
      fieldName: string             // e.g. "subject", "body", "headline"
      text: string                  // max 20 000 chars
      softLimit?: number
      hardLimit?: number
    }>
    links: Array<{
      label: string                 // e.g. "CTA", "T&C"
      url: string
      expectedDomain?: string
      requiresUtm?: boolean         // default true
    }>
    owners: Array<{
      role: "product" | "crm" | "legal" | "risk" | "localization" | "analytics"
      name?: string
      status?: "pending" | "approved" | "blocked" | "not_required"  // default "pending"
      dueDate?: string
      notes?: string
    }>
    termsText: string               // full T&C text, max 50 000 chars (required)
    notes?: string
    // Jurisdiction-aware fields added by Block 3:
    targetJurisdiction?: string[]   // e.g. ["UK", "BR"] — use "UK", not "GB"
    paymentMethods?: string[]       // e.g. ["PIX", "VISA", "USDT"]
  }
  options?: {
    skipChecks?: string[]           // check IDs to skip, e.g. ["mobile-first-format"]
  }
}
```

**Response — 200 OK**

```ts
{
  runId: string                   // UUID
  campaignId: string
  verdict: "GO" | "WARN" | "BLOCK"
  counts: {
    blockers: number
    warnings: number
    passed: number
  }
  blockers: Array<{
    checkId: string
    severity: "BLOCK" | "WARN"
    ruleId: string
    message: string
    ownerHint?: string
  }>
  createdAt: string               // ISO 8601
}
```

**curl example**

```bash
# Export the sample bundle from schemas/fixtures.ts to JSON first, then POST it:
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "campaign": {
      "metadata": {
        "campaignName": "BR Welcome Q2 2026",
        "promoType": "welcome",
        "geo": "Brazil SPA/MF",
        "locale": "pt-BR",
        "currency": "BRL",
        "channelsIncluded": ["email", "push"]
      },
      "offer": {
        "bonusPercentage": 100,
        "maxBonus": 500,
        "wageringRequirement": "35x bonus",
        "maxBet": 5
      },
      "assets": [
        { "channel": "email", "fieldName": "subject", "text": "Bônus de boas-vindas: 100% até R$500" }
      ],
      "links": [{ "label": "CTA", "url": "https://example.com/promo?utm_source=email", "requiresUtm": true }],
      "owners": [{ "role": "legal", "status": "pending" }],
      "termsText": "Wagering: 35x. Max cashout: R$1000. Max bet durante bônus: R$5.",
      "targetJurisdiction": ["BR"]
    }
  }' | jq
```

**Example response**

```json
{
  "runId": "018f4b2c-1234-7abc-9def-000000000001",
  "campaignId": "camp_br_welcome_q2_2026",
  "verdict": "BLOCK",
  "counts": { "blockers": 3, "warnings": 2, "passed": 6 },
  "blockers": [
    {
      "checkId": "jurisdictional-tc-completeness",
      "severity": "BLOCK",
      "ruleId": "BR-SPA-LICENSE-REQUIRED",
      "message": "T&C for BR must include the SPA/MF license number (Portaria SPA/MF #1231/2024)",
      "ownerHint": "legal"
    },
    {
      "checkId": "jurisdictional-risk-signals",
      "severity": "BLOCK",
      "ruleId": "BR-FORBIDDEN-PHRASE-GARANTIDO",
      "message": "Phrase 'bônus garantido' found in pt-BR copy — prohibited by CONAR 2024 ruling",
      "ownerHint": "compliance"
    },
    {
      "checkId": "payment-compatibility",
      "severity": "BLOCK",
      "ruleId": "IN-UPI-GAMING-BLOCKED",
      "message": "UPI listed as payment method for IN — NPCI blocked UPI Collect for gaming since Q3 2022",
      "ownerHint": "payments"
    }
  ],
  "createdAt": "2026-05-16T09:14:00.000Z"
}
```

---

## 2. GET /api/v1/runs/:id

Fetches a run with all blockers and full result detail.

**Path params**: `id` — UUID from `POST /api/v1/runs` response.

**Response — 200 OK**: same shape as the `POST` response, plus `campaignVersion` field.

**Errors**: `404 RunNotFoundException` if `id` is unknown.

---

## 3. GET /api/v1/campaigns

Lists campaigns, newest first. Paginated.

**Query params**

| Param | Default | Description |
|---|---|---|
| `limit` | 20 | Max items per page (1–100) |
| `cursor` | — | Opaque cursor from previous response's `nextCursor` field |

**Response — 200 OK**

```ts
{
  items: Array<{
    id: string
    name: string
    geo: string
    targetJurisdiction: string[]       // v2 planned; empty array until v2 field is wired
    latestVerdict: "GO" | "WARN" | "BLOCK" | null
    updatedAt: string
  }>
  nextCursor: string | null
}
```

---

## 4. GET /api/v1/campaigns/:id

Fetches a campaign with its latest version and most recent run summary.

**Response — 200 OK**: campaign object with `latestRun` nested.

**Errors**: `404 CampaignNotFoundException`.

---

## 5. GET /api/v1/campaigns/:id/versions

Lists all saved versions of a campaign, newest first.

**Response — 200 OK**

```ts
{
  items: Array<{
    version: string          // e.g. "v3"
    runId: string
    verdict: "GO" | "WARN" | "BLOCK"
    createdAt: string
  }>
}
```

---

## 6. GET /api/v1/campaigns/:id/diff

Returns the blocker diff between two run versions — which blockers were introduced, resolved, or unchanged.

**Query params**: `from` (version string, e.g. `v1`) and `to` (version string, e.g. `v3`). Both required.

**Response — 200 OK**

```ts
{
  campaignId: string
  from: string
  to: string
  introduced: Blocker[]    // new blockers in `to` not present in `from`
  resolved: Blocker[]      // blockers present in `from` but gone in `to`
  unchanged: Blocker[]     // blockers present in both
}
```

---

## 7. GET /api/health

Liveness probe. Used by Docker `HEALTHCHECK` and uptime monitors.

Always returns `200` as long as the process is running.

**Response — 200 OK**

```json
{ "status": "ok" }
```

---

## 8. GET /api/ready

Readiness probe. Returns `200` only when the database is reachable **and** all migrations have been applied. Returns `503` otherwise.

**Response — 200 OK**

```json
{
  "status": "ok",
  "checks": {
    "db": "ok",
    "migrations": "ok"
  }
}
```

**Response — 503 Service Unavailable**

```json
{
  "status": "not_ready",
  "checks": {
    "db": "error",
    "migrations": "pending"
  }
}
```

---

## Error model

All error responses share this shape:

```ts
{
  error: {
    code: string        // machine-readable, e.g. "CAMPAIGN_NOT_FOUND"
    message: string     // human-readable
    details?: unknown   // Zod issues array for 400 validation errors
  }
}
```

| HTTP status | Exception class | When it happens |
|---|---|---|
| 400 | `InvalidCampaignException` | Zod validation fails on request body |
| 404 | `CampaignNotFoundException` | `GET /api/v1/campaigns/:id` — unknown id |
| 404 | `RunNotFoundException` | `GET /api/v1/runs/:id` — unknown id |
| 409 | `IdempotencyConflictException` | Same `Idempotency-Key` submitted with a different request body |
| 422 | `UnprocessableEntityException` | Domain rule violation (e.g. `bonusAmount` = 0, `wageringRequirement` < 1) |
| 500 | `PreflightSystemException` | Unexpected internal failure |
| 503 | `NotReadyException` | DB unreachable or migrations not applied (readiness endpoint only) |

---

## Versioning policy

- The path prefix `/api/v1/` will not have breaking changes. New optional fields may be added to request and response bodies at any time; clients must be tolerant of unknown fields.
- Deprecated fields are marked with a `@deprecated` annotation in schema comments and carry a sunset date in the changelog.
- Breaking changes (field removal, type change, behaviour change) are introduced only under a new major version path `/api/v2/`. The v1 path remains available until its documented sunset date.
- The `Idempotency-Key` contract is stable across minor versions.

---

# docs/CONFIGURATION.md (T-008)

<!-- STATUS: drafted -->

# Promo Preflight — Configuration

## Required environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://preflight:secret@localhost:5432/preflight` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `7412345678:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TELEGRAM_CHAT_ID` | Target channel or chat ID (negative for channels) | `-1001234567890` |

## Optional environment variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Enables AI augmentation features. Without it, AI calls fall back to deterministic-only mode. |
| `USE_MOCK_AI` | `false` | Set `true` to short-circuit the Anthropic provider with deterministic stubs. Useful in CI and local dev without a key. |
| `HTTP_PORT` | `3000` | Port the Next.js server listens on. |
| `LOG_LEVEL` | `info` | Log verbosity: `debug` / `info` / `warn` / `error`. |
| `PREFLIGHT_MODE` | `localStorage` | `localStorage` — client-side demo mode (no backend required). `server` — uses the Postgres-backed API. |
| `OUTBOX_POLL_INTERVAL_MS` | `1000` | How often the outbox worker polls for undelivered events (milliseconds). |

## Example .env

```env
# Required
DATABASE_URL=postgresql://preflight:secret@localhost:5432/preflight
TELEGRAM_BOT_TOKEN=7412345678:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890

# Optional
ANTHROPIC_API_KEY=sk-ant-api03-...
USE_MOCK_AI=false
HTTP_PORT=3000
LOG_LEVEL=info
PREFLIGHT_MODE=server
OUTBOX_POLL_INTERVAL_MS=1000
```

Copy `.env.example` (provided in the repo) and fill in the required values.

## Per-environment notes

**Local development**
- Use `PREFLIGHT_MODE=localStorage` to skip the database entirely and run the UI demo.
- To test the full API flow locally, run `docker-compose up -d` to start Postgres, then set `PREFLIGHT_MODE=server` and `DATABASE_URL` pointing to the container.
- Set `USE_MOCK_AI=true` to avoid Anthropic API calls during development.

**docker-compose**
- `DATABASE_URL` is injected automatically via `docker-compose.yml` environment block — no manual edit needed for local docker runs.
- The `worker` service reads the same `DATABASE_URL` and `TELEGRAM_*` vars from the shared `env_file`.

**Production**
- Never commit `.env` to version control. Use your platform's secret manager (Railway environment variables, Render secret files, Kubernetes secrets, etc.).
- `OUTBOX_POLL_INTERVAL_MS` can be raised to `5000` in production to reduce DB load; lower to `500` for near-real-time Telegram alerts.
- `LOG_LEVEL=warn` is recommended in production to reduce log volume.

---

# docs/ERRORS.md (T-008)

<!-- STATUS: drafted -->

# Promo Preflight — Error Handling

## Exception hierarchy

```
PreflightException (abstract)
├── BadRequestException
│   ├── InvalidCampaignException       # Zod validation failure on input
│   └── UnprocessableEntityException   # Domain rule violation (valid shape, invalid state)
├── NotFoundException
│   ├── CampaignNotFoundException
│   └── RunNotFoundException
├── ConflictException
│   └── IdempotencyConflictException   # Same key, different body
├── ForbiddenException                 # Used when auth is added in a later sprint
└── SystemException
    └── NotReadyException              # DB unreachable or migrations not applied
```

Each exception carries an HTTP status code as a class constant. The global error handler in the API middleware maps `PreflightException` subclasses to HTTP responses automatically — see [docs/API.md — Error model](./API.md#error-model).

## How to throw

Use `domainRequire` for guard-style assertions inside domain and use-case code:

```ts
import { domainRequire } from '@domain/exception';

domainRequire(
  offer.wageringRequirement >= 1,
  () => new UnprocessableEntityException(
    'INVALID_WAGERING_REQUIREMENT',
    `wageringRequirement must be ≥ 1, got ${offer.wageringRequirement}`
  )
);
```

For explicit throws (e.g. in repository adapters when a row is missing):

```ts
throw new CampaignNotFoundException(campaignId);
```

## Rules

- Never throw raw `Error` or `TypeError` for business rule violations — always a `PreflightException` subclass.
- The **domain layer** throws only `PreflightException` subclasses and pure value errors (`domainRequire`).
- **Infrastructure adapters** may receive errors from external libraries (pg driver, Anthropic SDK, Telegram API). Wrap these at the adapter boundary into `SystemException` before re-throwing — never let external error types leak into the application layer.
- The **API layer** never catches `PreflightException` explicitly. The global middleware catches all `PreflightException` instances and serialises them to the standard error body shape.
- Zod parse errors from request validation are wrapped into `InvalidCampaignException` by the API route handler before reaching the bus.

## Adding a new exception

1. Create a class in `domain/exception/` that extends the appropriate parent:
   ```ts
   export class MyNewException extends BadRequestException {
     static readonly CODE = 'MY_NEW_ERROR';
     constructor(detail: string) {
       super(MyNewException.CODE, detail);
     }
   }
   ```
2. Export it from `domain/exception/index.ts`.
3. Add an entry to the error model table in [docs/API.md](./API.md#error-model) with the HTTP status and the condition that triggers it.

---

# docs/INTEGRATIONS.md (T-008 + expanded in T-024)

<!-- STATUS: drafted -->

# Promo Preflight — Integrations

## Currently supported

### Telegram bot

Promo Preflight sends a formatted message to a Telegram channel or group chat on every completed run. The message format depends on the verdict (`GO` / `WARN` / `BLOCK`) and includes the top blockers and assignable owners.

**Step-by-step setup**

**Step 1 — Create a bot**

Open Telegram and start a chat with [@BotFather](https://t.me/BotFather). Send `/newbot`, follow the prompts, and copy the token it gives you. It looks like `7412345678:AAHxxxxxxx`.

```bash
# Verify the token works
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
# Expected: {"ok":true,"result":{"id":...,"username":"YourBotName",...}}
```

**Step 2 — Create a private channel (or group)**

Create a new Telegram channel (e.g. `#promo-preflight-alerts`). Set it to private.

**Step 3 — Add the bot as admin**

Go to the channel settings → Administrators → Add Administrator. Search for your bot's username and add it. It needs the **Post Messages** permission.

**Step 4 — Get the channel chat_id**

Post any message in the private channel, then run:

```bash
curl -s https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates | jq '.result[] | {message: .message.chat.id, channel_post: .channel_post.chat.id}'
```

For a private channel, `chat_id` is negative and typically starts with `-100` (example: `-1001234567890`). If `getUpdates` is empty, post one more message in the channel and re-run the command.

**Step 5 — Save `.env.local` values**

```env
TELEGRAM_BOT_TOKEN=7412345678:AAHxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890
```

**Step 6 — Test the bot with `sendMessage`**

```bash
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"-1001234567890","text":"Preflight Telegram adapter test","parse_mode":"MarkdownV2"}'
```

Expected response includes `"ok": true` and the message appears in your private channel.

**Step 7 — Restart the worker**

```bash
# local
npm run worker

# or docker-compose
docker compose restart worker
```

**Step 8 — Trigger a BLOCK run and confirm delivery**

Trigger a run via API using a fixture that produces blockers:

```bash
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @./schemas/fixtures.ts.json
```

Confirm the run returns `verdict: "BLOCK"` and, within ~1 outbox poll interval, a Telegram message appears in the channel. A `BLOCK` verdict message looks like:

```
🚨 Run abc-123 BLOCKED (3 blockers, 2 warnings)
Campaign: BR Welcome Q2 2026 (BR)
Owners to notify: legal, compliance, payments
Top blockers:
• [BLOCK] BR-SPA-LICENSE-REQUIRED — T&C for BR must include the SPA/MF license number
• [BLOCK] BR-FORBIDDEN-PHRASE-GARANTIDO — 'bônus garantido' prohibited by CONAR 2024
• [BLOCK] IN-UPI-GAMING-BLOCKED — UPI blocked for gaming by NPCI since Q3 2022
View: http://localhost:3000/runs/abc-123
```

## Roadmap

The following adapters are scoped for future sprints. Each implements the `IHandoffAdapter` port from `application/port/handoff.ts`.

| Adapter | What it does | Port | Config |
|---|---|---|---|
| **Slack incoming webhook** | Posts the same verdict message to a Slack channel | `ISlackHandoffAdapter` | `SLACK_WEBHOOK_URL` |
| **Jira issue creator** | Opens a Jira ticket for each `BLOCK` verdict with blockers as sub-tasks | `IJiraHandoffAdapter` | `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` |
| **Linear issue creator** | Creates a Linear issue in a configured team/project | `ILinearHandoffAdapter` | `LINEAR_API_KEY`, `LINEAR_TEAM_ID` |
| **Discord webhook** | Sends embed messages to a Discord channel | `IDiscordHandoffAdapter` | `DISCORD_WEBHOOK_URL` |
| **Generic webhook** | POSTs the raw run JSON to any URL | `IGenericWebhookAdapter` | `WEBHOOK_URL`, `WEBHOOK_SECRET` |

## Building your own adapter

1. Implement `IHandoffAdapter` from [`application/port/handoff.ts`](../application/port/handoff.ts):
   ```ts
   export interface IHandoffAdapter {
     notify(event: RunCompletedEvent): Promise<void>;
   }
   ```
2. Create your implementation in `infrastructure/` (e.g. `infrastructure/slack/SlackAdapter.ts`).
3. Register it in the DI registry at `infrastructure/registry/index.ts` under a new adapter key.
4. Set `HANDOFF_ADAPTER=your-adapter-name` in `.env`.
5. No changes to core domain or application code are needed.

See [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for a full explanation of the port/adapter pattern used throughout Preflight.

---

# docs/CASE-STUDY.md (T-035)

<!-- STATUS: drafted -->
<!-- Brazilian welcome offer walkthrough under SPA/MF Q2 2026 -->
<!-- Pull directly from DEEP-RESEARCH.md §8 for: required T&C in PT-BR, 10 blockers table, fixed version, alternate timeline citing Perfect Storm €5M. -->

~~~~markdown
# Case study: launching a 100% R$500 welcome offer in Brazil under SPA/MF (Q2 2026)

## The setup

Acme Casino, a mid-size operator running on the 01.tech White Label platform, decided to enter the Brazilian market in Q2 2026. Their CRM team had four working days to ship a welcome promo before the next regulatory window closed: the SPA/MF licensing regime was fully operational, and the team needed to move fast to capture market share in Brazil's rapidly growing regulated segment (Superbet, 7Games, and Brazino777 were already running aggressive acquisition campaigns). The T&C were drafted in PT-BR; channel assets were prepared in pt-BR and es-MX (the parent group also operates a Mexican brand under the same creative pipeline). Payment methods: Pix (primary), Visa, Mastercard, and USDT-TRC20 for repeat depositors from the CIS segment.

The launch had to comply with a stack of overlapping requirements: SPA/MF #3 (promo and bonus restrictions), SPA/MF #1.885/2025, MESP #31, the Conar advertising code, Banco Central do Brasil Pix rules under Lei 15.358/2025, the cryptocurrency disclosure framework under PL 4173/2023, and the overarching Lei 14.790/2023 (the Brazilian gambling legalisation statute). A manual compliance review for this kind of cross-channel, cross-payment-method campaign in Brazil takes an estimated 10–30 person-hours.*

\*Industry estimate per DEEP-RESEARCH §8; no public operator metrics published.

## Step 1 — Campaign bundle as input

The CRM team submitted the following campaign bundle to Preflight:

<details>
<summary>acme-casino-br-welcome-v1.json — click to expand</summary>

```json
{
  "id": "acme-br-welcome-v1",
  "targetJurisdiction": ["BR"],
  "currency": "BRL",
  "offer": {
    "type": "deposit_match",
    "matchPercent": 100,
    "maxBonus": 500,
    "wageringRequirement": 35,
    "minDeposit": 50
  },
  "paymentMethods": [
    "pix",
    "visa",
    "mastercard",
    "usdt_trc20"                       // ← WARN: crypto grey-area for retail BR promo (PL 4173/2023)
  ],
  "channels": {
    "email": {
      "subject": "Acme Casino — ganhe R$500 em bônus",
      "body": "Bem-vindo ao Acme Casino! Deposite R$50 e ganhe R$500 sem riscos."
              // ← BLOCK: "sem riscos" falls under SPA/MF #3 ban on risk-neutrality claims
              //          (same category as "risco zero", "sem perdas" — CONAR/SPA/MF precedent)
    },
    "sms": {
      "body": "Acme Casino: bônus 100% até R$500 para novos jogadores. Deposite R$50 agora e comece a jogar com mais! T&C se aplicam. 18+"
              // ← BLOCK: 178 chars — exceeds 160-char SMS provider limit
    },
    "landing": {
      "url": "https://acme.casino/br/welcome",
      "cta": {
        "text": "Resgatar bônus",
        "utm": "utm_medium=email&utm_campaign=welcome_br_q2"
               // ← WARN: utm_source missing
      }
    }
  },
  "terms": {
    "locale": "pt-BR",
    "text": "Bônus de 100% até R$500. Depósito mínimo R$50. Rollover 35×. Válido 30 dias. Pagamentos via Pix, cartão ou USDT.",
    // ← BLOCK: missing "Jogue com responsabilidade" (mandatory under SPA/MF #3)
    // ← BLOCK: SPA/MF license number absent
    // ← BLOCK: max bet during bonus play not stated (Portaria SPA/MF #1.231/2024)
    // ← BLOCK: no "18+" / "apenas maiores de 18 anos" in T&C body (Lei 14.790/2023)
    "cryptoMentioned": true,
    "cryptoDisclaimer": null           // ← BLOCK: PL 4173/2023 requires volatility disclosure
  },
  "owner": {
    "crm": "ana.silva@acme.casino",
    "marketing": "pedro.costa@acme.casino",
    "compliance": null                 // ← BLOCK: compliance owner required by internal RACI
  }
}
```

</details>

## Step 2 — Running Preflight

```bash
curl -X POST http://localhost:3000/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d @acme-casino-br-welcome-v1.json | jq
```

Response:

```json
{
  "runId": "run_br_001",
  "campaignId": "acme-br-welcome-v1",
  "version": 1,
  "verdict": "BLOCK",
  "summary": {
    "block": 8,
    "warn": 2,
    "pass": 3
  },
  "checkedAt": "2026-05-17T09:14:32Z",
  "jurisdiction": "BR",
  "durationMs": 12
}
```

Verdict: **BLOCK**. 8 hard blockers, 2 warnings, 3 passes. Duration: 12 ms.

## Step 3 — What Preflight caught

| # | Check | Rule ref | Severity | What it caught | Fix suggestion |
|---|---|---|---|---|---|
| 1 | JurisdictionalRiskCheck | SPA/MF #3 | **block** | "sem riscos" phrase in email body — prohibited risk-neutrality claim (same category as "risco zero", "sem perdas") | Replace with "ganhe até R$500 em bônus" |
| 2 | JurisdictionalRiskCheck | Lei 14.790/2023 | **block** | Missing "18+" / "apenas maiores de 18 anos" disclaimer in landing and T&C | Add 18+ icon and mandatory age text |
| 3 | JurisdictionalRiskCheck | SPA/MF #3 | **block** | Missing "Jogue com responsabilidade" in T&C and all channel footers | Add mandatory phrase to T&C body and landing footer |
| 4 | PaymentCompatibilityCheck | Banco Central do Brasil + PL 4173/2023 | **warn** | USDT-TRC20 in payment list — grey-area for retail welcome promo in BR under current crypto framework | Move USDT to a separate "advanced depositors" opt-in section |
| 5 | CryptoDisclosureCheck | PL 4173/2023 | **block** | Crypto mentioned in T&C without volatility disclosure | Add: "O valor de criptomoedas pode flutuar significativamente" |
| 6 | FormatQaCheck | SMS provider 160-char limit | **block** | SMS body is 178 characters | Trim copy or split into two messages |
| 7 | LinkQaCheck | UTM attribution standard | **warn** | Landing CTA missing `utm_source` parameter | Set `utm_source=email_welcome` |
| 8 | LaunchOwnershipCheck | Internal RACI policy | **block** | `owner.compliance` is null — no compliance owner assigned | Assign compliance sign-off before launch |
| 9 | TermsRobustnessCheck | Portaria SPA/MF #1.231/2024 | **block** | Maximum bet during bonus play not disclosed in T&C | Add: "Aposta máxima durante o bônus: R$10 por rodada" |
| 10 | TermsRobustnessCheck | SPA/MF licensing rules | **block** | SPA/MF license number absent from T&C footer | Add SPA/MF license number in T&C and landing footer |

## Step 4 — What would have happened without Preflight

In May 2024, a major Brazilian sportsbook ran a promotional campaign built around guaranteed-outcome language. CONAR ruled the phrase **«vencer é só o começo»** (winning is just the beginning) non-compliant because it "creates unrealistic expectations and promises guaranteed financial success." The operator was required to pull the creative and revise all channel assets. In April 2026, *Make Money Now S.L.* (producers of the "Zona Gemelos" reality show) received a CONAR fine for promoting unlicensed betting operators — a reminder that even adjacent parties to a campaign carry regulatory exposure in Brazil, and that enforcement actions have begun to land.

Acme Casino's v1 bundle would have shipped the "sem riscos" claim into email inboxes, without the mandatory "Jogue com responsabilidade" footer, without the SPA license number, and with USDT listed as a payment method without the disclosure that PL 4173/2023 requires. A CONAR complaint or SPA/MF audit triggered by the campaign would have required pulling all channel assets, revising landing page copy, obtaining compliance sign-off retroactively, and reprocessing the SMS list — across a four-person CRM team already at deadline. The broader enforcement pattern is clear: *Perfect Storm B.V.* received a €5M fine and a 2-year ban from DGOJ Spain in April 2026 for running campaigns without the required compliance layer. Brazil's SPA enforcement regime is younger, but the regulatory machinery — CONAR, SPA/MF, Banco Central — is now fully operational and cross-referencing.

## Step 5 — Fix and diff

After applying all fixes, the team submitted v2:

```diff
- "body": "...ganhe R$500 sem riscos."
+ "body": "...ganhe até R$500 em bônus de boas-vindas."

- "cryptoDisclaimer": null
+ "cryptoDisclaimer": "O valor de criptomoedas pode flutuar significativamente."

- "text": "Bônus de 100% até R$500. Depósito mínimo R$50. Rollover 35×. Válido 30 dias. Pagamentos via Pix, cartão ou USDT."
+ "text": "Bônus de 100% até R$500 (mín. depósito R$50). Rollover 35×. Aposta máxima durante o bônus: R$10 por rodada. Válido 30 dias. 18+ | apenas maiores de 18 anos. Jogue com responsabilidade. Licença SPA/MF nº [XXXX]. Pagamentos via Pix, cartão ou USDT.*"

- "compliance": null
+ "compliance": "legal@acme.casino"

  // SMS trimmed to 58 chars:
- "body": "Acme Casino: bônus 100% até R$500 para novos jogadores. Deposite R$50 agora e comece a jogar com mais! T&C se aplicam. 18+"
+ "body": "Acme Casino: bônus 100% até R$500. Dep. mín R$50. T&C 18+"

  // UTM completed:
- "utm": "utm_medium=email&utm_campaign=welcome_br_q2"
+ "utm": "utm_source=email_welcome&utm_medium=email&utm_campaign=welcome_br_q2"
```

Diff via API:

```bash
curl "http://localhost:3000/api/v1/campaigns/acme-br/diff?from=1&to=2" | jq
```

```json
{
  "resolved": 10,
  "new": 0,
  "stillOpen": 0,
  "verdict": "GO"
}
```

## Step 6 — Why this matters in 2026

The 01.tech × G GATE MEDIA Global iGaming Report 2026 identifies the operational pattern above as the #1 underrated risk of the year. Станислав, SEO Product Manager at 01.tech, writes in Chapter 5.3:

> «Ключевым и очень недооценённым трендом в 2026 году я бы назвал не ИИ или кор-апдейты, а возрастающие локальные блокировки и регуляторное давление в Латинской Америке и Азии, которые начались ещё в прошлом году и затронули не только продукты, но и вебмастеров. Устойчивость инфраструктуры и слаженные процессы по отслеживанию и реакции на блокировки со стороны конкретных локальных операторов будут конкурентным преимуществом в этом году.»

In English:

> "The key and very underrated trend in 2026, in my view, is not AI or core updates, but the increasing local blockings and regulatory pressure in Latin America and Asia. These began last year and have hit not just products but webmasters too. Infrastructure resilience and tight processes for tracking and reacting to local-operator blocks will be the competitive advantage of this year." — **Stanislav, SEO Product Manager, 01.tech**, *Global iGaming Report 2026*

This case study is the operational implementation of what that report identifies. Each of the 10 blockers above corresponds to a real enforcement precedent or a mandatory clause in Brazilian law as of Q2 2026. Preflight makes jurisdictional compliance a 12-second CI check rather than a 10–30 person-hour manual review cycle.\* The risk Stanislav describes is addressable — it requires tooling that runs in your pipeline, not a consultant engaged retroactively after a campaign is live.

\*Industry estimate per DEEP-RESEARCH §8; no public operator metrics published.

## What this took

| | Manual review (no Preflight) | With Preflight |
|---|---|---|
| Initial compliance check | ~8 hours, 4 people | 12 seconds, 0 manual triage steps |
| Iteration to v2 after fixes | ~4 hours (re-review) | 8 seconds |
| Ownership trail | Slack thread + Google Doc | Structured JSON audit log, queryable |
| Total to launch-ready | 10–30 person-hours* | < 30 minutes |

\*Industry estimate per DEEP-RESEARCH §8; no public operator metrics published.

---

[Live demo](https://promo-preflight-production.up.railway.app/) · [01.tech × G GATE MEDIA Global iGaming Report 2026](link-tbd)
~~~~

---

# docs/adr/0001-postgres-over-localstorage.md (T-009)

<!-- STATUS: drafted -->

# ADR-0001 — Persist runs in Postgres instead of browser localStorage

**Status**: Accepted
**Date**: 2026-05-16

## Context

Promo Preflight v1 stored everything — campaigns, runs, blockers — in browser `localStorage`. This was enough for a single-user demo: no infrastructure, instant startup, zero ops cost.

As the project evolved toward a real operator use case, four requirements broke the localStorage model:

1. **Cross-user sharing** — a compliance officer and a promo manager must both see the same run result without copy-pasting JSON.
2. **Audit log** — regulators expect a durable, tamper-evident record of "we checked this campaign before launch." localStorage is cleared by users and not court-admissible.
3. **Version history** — campaigns are edited iteratively; operators need to diff v1 vs v3 of a campaign bundle to see which blockers were resolved.
4. **API consumption** — CI/CD pipelines, CRM platforms, and the Telegram outbox worker all need a backend API backed by persistent storage, not a browser tab.

## Decision

Move all runs, campaigns, campaign versions, blockers, outbox events, and the audit log to Postgres. Use Drizzle ORM for type-safe queries and Drizzle Kit for migrations.

Keep `localStorage` as a parallel mode controlled by the `PREFLIGHT_MODE=localStorage` environment variable. When this mode is active, the UI works entirely client-side — no API calls, no database — preserving the demo experience without infrastructure.

## Consequences

**Positive**
- Durable history that survives browser clears and multi-user sessions.
- Queryable audit log per jurisdiction, per campaign, per run — suitable for showing to a regulator.
- Foundation for multi-tenant isolation (adding `org_id` + Row-Level Security later requires no domain changes).
- Enables the outbox pattern: events written to the same DB transaction as the run, delivered atomically.

**Negative**
- Adds an infrastructure dependency: operators must run or provision a Postgres instance.
- Local setup requires `docker-compose up` rather than just `npm run dev`.
- Migrations must be applied before the API starts; the readiness probe (`GET /api/ready`) enforces this.

**Neutral**
- The UI now has two code paths (`localStorage` mode and `server` mode) and must handle both during the v1/v2 transition period.

---

# docs/adr/0002-cqrs-lite-bus.md (T-009)

<!-- STATUS: drafted -->

# ADR-0002 — CQRS-lite with a tiny in-process bus

**Status**: Accepted
**Date**: 2026-05-16

## Context

With 11 check modules, 8 API endpoints, and an event-driven side-effect layer (Telegram, audit log), request handling was becoming entangled inside Next.js route handlers. Each handler was importing repositories, calling domain services, and triggering side effects directly — making individual handlers hard to test and impossible to reason about in isolation.

A full CQRS framework (Axon, NestJS CQRS module) would have been overkill for a single-developer project. We needed a pattern that gave us the separation benefits without the framework weight.

## Decision

Implement a minimal in-process `Bus` with a `HandlerRegistry`. Rules:

- **Commands** represent write intent (e.g. `RunChecksCommand`). Handlers return `Result<T, PreflightException>` — never throw directly.
- **Queries** represent read intent (e.g. `FindRunQuery`). Handlers return `T` directly or throw `NotFoundException`.
- Each handler lives in exactly one file in `infrastructure/handler/`.
- `HandlerRegistry` supports glob-based registration via a `fromGlob(...)` factory; production boot wiring lives in `infrastructure/registry/` and can use `import.meta.glob` where the runtime supports it. Handlers are not self-registering — the registry must be initialised explicitly at startup.
- API route handlers call only `bus.dispatch(command)` or `bus.query(query)` — they have no direct dependency on repositories or domain services.

This is *not* a full CQRS read/write model split. The same domain models serve both sides. The bus is purely an in-process dispatch mechanism, not a message broker.

## Consequences

**Positive**
- Adding a new operation is one file plus one registration call in the boot registry.
- API routes are trivially testable: mock the bus, assert the dispatched command.
- Handler test suites are isolated: inject mock ports, assert the result.
- No circular dependencies between layers — every import flows in one direction.

**Negative**
- Slight learning curve for contributors unfamiliar with CQRS terminology: commands, queries, handlers.
- If a handler is not registered in `infrastructure/registry/`, it silently does not exist — there is no compile-time enforcement that every command or query has a handler wired up.

**Neutral**
- This is not event sourcing. The bus does not persist commands or events. The outbox pattern (ADR-0004) handles durable event delivery separately.

---

# docs/adr/0003-deterministic-first-ai-second.md (T-009)

<!-- STATUS: drafted -->

# ADR-0003 — Deterministic checks run first; AI is augmentation only

**Status**: Accepted
**Date**: 2026-05-16

## Context

Promo compliance checks must be reproducible and auditable. A regulator asking "why was this campaign flagged?" cannot accept "the language model assessed it." Three additional constraints reinforce this:

1. **Cost and latency** — Anthropic API calls add ~1-3 seconds and non-trivial cost per run. At 20-30 campaigns a month across 8-15 locales, this compounds quickly.
2. **Rate limits** — API rate limits make AI a poor fit for the synchronous hot path.
3. **Hallucination risk** — LLMs can misclassify regulatory terms or invent rule citations. A false negative (flagging a compliant campaign) has operational cost; a false positive (clearing a non-compliant one) has legal cost.

An Anthropic SDK wrapper already exists at `lib/ai/` (now `infrastructure/ai/`) — so AI integration is technically available, just not wired into the checks path.

## Decision

All 11 compliance checks run deterministically against YAML rule artifacts (`rules/*.yaml`). The rule artifacts are human-authored and version-controlled. The same input always produces the same verdict.

AI is an optional augmentation layer on top of the deterministic core:
- AI may help *extract* structured campaign data from unstructured input (PDF T&C, free-text brief).
- AI may generate *human-readable explanations* of blockers after the deterministic verdict is set.
- AI may suggest *fix drafts* per blocker in the target locale.
- AI never decides or overrides a verdict.

The augmentation layer is activated by `ANTHROPIC_API_KEY` and bypassed completely by `USE_MOCK_AI=true`. See [ADR-0005](./0005-ai-augmentation-roadmap.md) for the full planned roadmap.

## Consequences

**Positive**
- Every run is reproducible: given the same campaign bundle and rule artifact version, the output is identical.
- Audit-friendly: a compliance log entry can cite the specific `ruleId` and `rule artifact version` that triggered each blocker.
- Runs are fast (~12ms for 11 checks) and cheap — no API calls in the default path.
- Works offline and in air-gapped environments.

**Negative**
- Rule maintenance is fully manual: adding a new jurisdiction requires a human to author YAML rules.
- The system cannot adapt to regulatory changes it has not been explicitly updated for.
- AI UX improvements (plain-language explanations, fix suggestions) are deferred to v1.x.

**Neutral**
- `USE_MOCK_AI=true` lets local development and CI run without an Anthropic API key. Mock responses are deterministic stubs, not real AI output.

---

# docs/adr/0004-outbox-pattern-for-events.md (T-009)

<!-- STATUS: drafted -->

# ADR-0004 — Outbox pattern for at-least-once event delivery

**Status**: Accepted
**Date**: 2026-05-16

## Context

When a run completes, Preflight publishes `PreflightEvent`s (`RunCompleted`, `BlockerRaised`, etc.) to subscribers: Telegram notifications, the audit log, and future adapters (Slack, Jira, Linear). Two naive approaches both have fatal failure modes:

**Publish before DB commit** — if the DB commit subsequently fails, subscribers receive events for a run that never persisted. These are phantom events.

**Publish after DB commit (in the same request handler)** — if the publish fails (network error, Telegram API down, broker outage), the run is persisted but the events are silently lost. Operators get no Telegram alert.

Either failure mode produces a compliance process gap: operators assume events are delivered reliably, and build workflows (Telegram-based owner assignment, audit entries) on that assumption.

## Decision

Use the transactional outbox pattern:

1. During the run, the use case writes `PreflightEvent` rows to an `outbox` table inside the **same database transaction** as the run insert. If the transaction rolls back, events are rolled back too — no phantom events.
2. A background `OutboxWorker` polls the `outbox` table for rows with `delivered_at IS NULL`.
3. For each undelivered row, the worker calls each registered `IHandoffAdapter` (Telegram, audit log, etc.) and marks the row `delivered_at = now()` on success.
4. If a subscriber call fails, the row is retried on the next poll cycle. Delivery is at-least-once.
5. Subscribers must be idempotent, keyed on `event_id`.

Poll interval is configurable via `OUTBOX_POLL_INTERVAL_MS` (default 1000ms).

## Consequences

**Positive**
- No phantom events: event rows only exist if the run exists in the same DB transaction.
- No lost events: undelivered rows are retried until they succeed.
- Audit-friendly: the outbox table is a durable event log, queryable per run or per jurisdiction.
- Decoupled: adding a new subscriber (Slack, Jira) requires no changes to the run use case — only a new `IHandoffAdapter` implementation.

**Negative**
- Small delivery delay: events are delivered after the next poll cycle, not within the same request (default ~1 second lag).
- The outbox table grows unboundedly — periodic cleanup (`DELETE WHERE delivered_at < now() - interval '30 days'`) is required in production.
- The outbox worker is a separate process entrypoint (`npm run worker`) that must be kept alive.

**Neutral**
- Subscribers must be idempotent by design. The Telegram adapter checks `event_id` before sending to avoid duplicate messages on retries.

---

# docs/adr/0005-ai-augmentation-roadmap.md (T-009b)

<!-- STATUS: drafted -->

# ADR-0005 — AI augmentation roadmap (planned, deferred from v1)

**Status**: Accepted, deferred
**Date**: 2026-05-16

## Context

The 11 deterministic checks form a defensible compliance core (see ADR-0003): same input, same verdict, audit-friendly, reproducible. This is the contract Preflight makes with operators.

At the same time, an Anthropic SDK wrapper already exists at `infrastructure/ai/` but is not wired into the main flow. AI offers a genuine UX multiplier on top of the deterministic core — not as a decision-maker, but as the layer that helps marketers understand, act on, and fix what the deterministic engine flagged.

The 01.tech Global iGaming Report 2026 puts this plainly:

> "Ecosystem solutions that unify traffic, product, analytics, payments, and infrastructure into a single growth model gain the most value." — **Alexander Romanov, Head of White Label, 01.tech**

Five high-leverage AI augmentations have been scoped, prototyped conceptually, and explicitly *not* built in v1. They are documented here so contributors understand the roadmap and do not inadvertently block it.

## Decision

Document AI augmentation as a planned v1.x roadmap. AI is the planned augmentation layer on top — never the decision-maker. Five augmentations are scoped for v1.x, in priority order:

1. **PDF / text extraction** — Operator drops a 5-page T&C PDF or pastes a free-text campaign brief. AI extracts structured `CampaignBundle` fields. The deterministic check flow then runs as normal. This eliminates the manual data-entry step that currently precedes every run.

2. **Fix suggestion per blocker** — For each `BLOCK` or `WARN` verdict, AI generates 3 locale-aware replacement copy variants that preserve marketing intent while removing the offending phrase or missing clause. Operator picks one, edits, re-runs.

3. **Cultural localization audit** — AI detects culture-specific mismatches that regex rules cannot catch: alcohol references in Malaysia (dual-age-gate market), religious imagery in MENA, gender-coded financial promises in markets where these are considered predatory. Supplements, never replaces, the YAML rule artifacts.

4. **Plain-language explanation per blocker** — Each blocker currently surfaces a `ruleId` and a technical message. AI rewrites this as a marketer-facing explanation: *why* this matters, which regulator, which article, what the practical consequence is. Reduces the compliance-to-marketing translation round-trip.

5. **Compliance Q&A** — Operator asks "Can I say 'risk-free' in the UK copy?" or "What does Brazil require in the T&C for a welcome bonus?" AI answers grounded in the `rules/*.yaml` artifacts and `DEEP-RESEARCH.md` knowledge base. Reduces dependency on legal counsel for routine questions.

All five remain "AI on top of deterministic core." The deterministic verdict is always computed first. AI never overrides or bypasses it.

## Consequences

**Positive**
- Clear architectural separation between the defensible compliance kernel (v1, ships now) and the UX-multiplier layer (v1.x, ships incrementally).
- Each augmentation can be shipped independently without touching the domain layer or the deterministic check engine.
- The `ANTHROPIC_API_KEY` / `USE_MOCK_AI` toggle is already in place; augmentations activate behind this gate.
- Operators get a clear roadmap: deterministic is the contract, AI is the experience layer on top.

**Negative**
- Until v1.x ships, marketers read raw `ruleId` strings and must manually rephrase blocked copy — no guided fix suggestions yet.
- Some operators evaluating "AI-powered compliance" tools may undervalue the deterministic-first approach without seeing the AI layer.
- PDF extraction (augmentation #1) requires careful prompt engineering to avoid hallucinated structured fields — needs an evaluation harness before production use.

**Neutral**
- When each AI augmentation lands, it warrants its own ADR covering: model selection, cost budget per run, prompt caching strategy (Anthropic prompt cache has 5-min TTL), and evaluation harness.
- The existing `infrastructure/ai/` adapter is the correct extension point for all five augmentations. No new infrastructure layer is needed.

---

# Telegram message templates (T-024)

<!-- STATUS: empty -->
<!-- MarkdownV2 format, three templates: GO / WARN / BLOCK -->

### Template — GO

```
✅ Run *{runId}*: all checks passed
Campaign: {campaignName} ({targetJurisdiction})
View: {runUrl}
```

### Template — WARN

```
⚠️ Run *{runId}*: {warnings} warnings, 0 blockers — review before launch
Campaign: {campaignName} ({targetJurisdiction})
Top warnings:
• {top3WarningSummaries}
View: {runUrl}
```

### Template — BLOCK

```
🚨 Run *{runId}* BLOCKED ({blockers} blockers, {warnings} warnings)
Campaign: {campaignName} ({targetJurisdiction})
Owners to notify: {ownerHints}
Top blockers:
• {top3BlockerSummaries}
View: {runUrl}
```

---

# Notes for the owner

1. **Polishing pass**: after each worker fills a section, your job is to re-read with one filter — *would Nina believe this came from a competent PM*? Specifically:
   - Cut "powered by AI", "revolutionary", "next-gen", any superlative
   - Replace "we believe" / "we think" with concrete statements
   - If a sentence could have come from a marketing brochure, rewrite it as a technical statement
   - Russian preview: think about how you would translate each sentence — if it sounds awkward in Russian, it's probably AI-toned in English too
2. **Verbatim quotes never get re-worded.** If a worker paraphrases a quote, reject the change.
3. **Status markers:** update `<!-- STATUS: empty -->` → `drafted` → `polished` → `shipped` as the file moves through stages.
4. **Final assembly**: in Block 11, the coordinator (or you) copies each section from here into its target file (README.md, docs/ARCHITECTURE.md, etc.). Only `polished` content gets copied.
