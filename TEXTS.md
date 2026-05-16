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

<!-- STATUS: empty -->

## Hero block (T-002)

<!-- Owner: this is the first thing Nina sees. Polish ruthlessly. -->

```
# Promo Preflight

*Pre-launch readiness checks for iGaming operators expanding into emerging markets. Built by a PM over a weekend with Claude Code.*

*Built around the regulatory realities described in the [01.tech × G GATE MEDIA Global iGaming Report 2026](link-tbd).*

[![License](badge-tbd)] [![Next.js](badge-tbd)] [![TypeScript](badge-tbd)] [![Tests](badge-tbd)] [![CI](badge-tbd)]

<!-- TODO: insert hero from VISUALS §1 -->

[Live demo](https://promo-preflight-production.up.railway.app/) · [Docs](./docs) · [Case study](./docs/CASE-STUDY.md)

---
```

## The problem (T-001)

<!-- STATUS: empty -->
<!-- Worker: produce 3 bullets each citing a verifiable source from the "Verbatim quotes" block above. Tone: direct, technical, slightly self-aware. Max 350 words for the entire section. -->

```
TBD by T-001 worker. Use:
- Bullet 1: Stanislav quote (translated) — local-blocking trend as #1 risk for 2026
- Bullet 2: Olomoyin quote — wagering requirements must be stated; "Gamble responsibly" footer is not enough
- Bullet 3: Verified fines table — pick 3 most striking (Perfect Storm €5M, Sky £1.17M, Kindred SEK 100M)
- Closing paragraph: why existing tooling fails (scattered Notion + Slack + Google Doc + Excel across 8-15 locales)
- Closing paragraph: what Preflight does differently (deterministic checks per jurisdiction, one canonical bundle, audit-friendly events, drops into your stack via REST + Telegram webhook)
```

## What this is

<!-- STATUS: empty -->
<!-- Worker T-003: 2-3 paragraphs. Reference 11 jurisdictional checks. Mention the Before/After collage from VISUALS §2. -->

```
TBD by T-003. After this paragraph, insert HTML <table> with VISUALS §2 before/after collage.
```

## Who this is for (T-003)

<!-- STATUS: empty -->
<!-- Worker: markdown table, 3 rows, columns "You are" and "What this gives you" -->

```
| You are | What this gives you |
|---|---|
| A multi-jurisdiction iGaming operator (lic. EU + LATAM + offshore) | Catch jurisdictional risks before promo launches — Brazilian SPA, Indian UPI ban, Mexican SPEI rules, Algerian crypto prohibition |
| A platform / white-label engineer at a B2B iGaming infrastructure provider (01.tech, SoftSwiss, BetConstruct, EveryMatrix tier) | Drop-in pre-launch gate your operator customers can add to their CRM / Promo workflow without your platform team owning compliance |
| A CRM / Promo Ops lead launching campaigns across 8-15 locales every month | Replace the Notion → Slack → Google Doc → Excel review chain with one deterministic check and one Telegram alert with assignable owners |
```

## How it works (T-003)

<!-- STATUS: empty -->
<!-- Worker: insert mermaid sequence below + paragraph + Telegram screenshot reference (VISUALS §6) -->

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

<!-- TODO: under the second diagram, insert VISUALS §6 Telegram screenshot -->

## Three paths to use (T-003)

<!-- STATUS: empty -->
<!-- Three numbered sub-sections -->

```
### 1. Self-host via docker-compose
TBD: minimum commands. git clone, docker-compose up -d, curl POST.

### 2. Drop into your CI (npm package + CLI)
TBD: bin/preflight-check usage. Exit codes. JSON output. Mark "coming with T-033".

### 3. Managed SaaS
TBD: "Coming soon. Email <link> for early access."
```

## Tech stack (T-003)

<!-- STATUS: empty -->
<!-- markdown table of stack with one-line rationale per dep -->

```
TBD: Next.js 16, React 19, TypeScript strict, Drizzle ORM, Postgres, vitest, Zod, @anthropic-ai/sdk (optional), yaml, Telegram Bot API.
```

## Architecture (T-003)

<!-- STATUS: empty -->
<!-- ASCII tree of domain/application/infrastructure/api layout -->

```
TBD: copy from EXPLAINER section + ARCHITECTURE.md doc.
```

## What we deliberately don't do (T-003)

<!-- STATUS: empty -->
<!-- Bullet list of explicit non-goals with rationale -->

```
- No multi-tenant (org-scoped data) — out of scope for this sprint; can be added without changing core
- No gRPC — REST + webhooks fit the consumer model (CRM/Promo Ops teams)
- No live LLM in default checks path — checks must be deterministic and reproducible; AI is an optional augmentation only (see ADR-0003 + ADR-0005 for the planned augmentation roadmap)
- No auth — out of scope for demo; production deployment expects auth at infra layer
- No microservices — one process; outbox worker is a separate entrypoint of the same binary
- No "promo compliance score" magic number — verdicts are GO / WARN / BLOCK based on rule severity, not opaque AI
```

## AI augmentation roadmap (T-003 — new sub-section, after "What we deliberately don't do")

<!-- STATUS: empty -->
<!-- Short ~150-word section between "What we don't do" and "Contributing". Frames the AI roadmap. References ADR-0005. -->

```
TBD by T-003 worker. Include:
- Opening line: "Preflight ships a deterministic-first compliance core. AI is the planned augmentation layer on top — never the decision-maker."
- 5 bullets matching ADR-0005's five augmentations:
  1. PDF / text extraction — drop a T&C PDF, get a campaign bundle
  2. Fix-suggestion per blocker — 3 locale-aware replacement variants
  3. Cultural localization audit — catches culture mismatches regex misses
  4. Plain-language explanation per blocker — why, which regulator, which article
  5. Compliance Q&A grounded in the rule artifacts
- Closing: "See ADR-0005 for full reasoning. None of these ship in v1.0; the deterministic kernel does. AI lands incrementally in v1.x."
- Quote Romanov from G GATE Ch.4: "AI is becoming the base tool of the industry — not as a replacement but as a multiplier of effectiveness."
```

## Contributing / License / Author (T-003)

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

`api/` never imports `infrastructure/` directly. `domain/` has no outgoing dependencies on any other layer. `infrastructure/` implements interfaces (ports) declared in `application/port/`.

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

**domain/** owns business concepts and rules. It has no knowledge of databases, HTTP, or external services.

**application/** orchestrates domain operations and declares *what it needs* via ports. It does not know *how* those ports are implemented.

**infrastructure/** implements every port and may import any external library. It never calls use cases directly.

**api/** translates HTTP requests into Commands/Queries, dispatches them through the Bus, and returns HTTP responses. It contains no business logic.

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

- `domain/` has zero runtime dependencies on anything outside `domain/`.
- Ports are owned by `application/port/`; implementations live in `infrastructure/`.
- Commands return `Result<T, PreflightException>`; queries return `T` or throw `NotFoundException`.
- All write paths go through repositories — no direct SQL outside `infrastructure/persistence/`.
- Events are published after DB commit (outbox pattern) — no phantom events on rollback.
- `Idempotency-Key` is required on `POST /api/v1/runs`; the same key always returns the same `runId`.
- All API input is validated by Zod schemas owned by `application/`.
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

Runs all enabled checks against a campaign bundle for the specified target jurisdiction. Idempotent — submitting the same `Idempotency-Key` twice returns the same result.

**Headers**

| Header | Required | Description |
|---|---|---|
| `Content-Type` | yes | `application/json` |
| `Idempotency-Key` | yes | Client-generated UUID. Same key + same body → same `runId`. Same key + different body → 409. |

**Request body**

```ts
{
  campaign: {
    id?: string                   // existing campaignId to attach run to (optional)
    name: string
    targetJurisdiction: string    // ISO 3166-1 alpha-2, e.g. "BR", "IN", "GB"
    offer: {
      bonusAmount: number
      bonusCurrency: string       // ISO 4217
      wageringRequirement: number // multiplier, e.g. 35
      maxCashout?: number
      expiryDays?: number
    }
    channels: {
      email?: string
      sms?: string
      push?: string
      banner?: string
    }
    termsAndConditions: {
      [locale: string]: string    // e.g. { "pt-BR": "...", "en": "..." }
    }
    paymentMethods?: string[]     // e.g. ["PIX", "VISA", "USDT"]
    links?: {
      termsUrl?: string
      promoUrl?: string
      utmParams?: Record<string, string>
    }
    owners?: {
      [ownerHint: string]: string // e.g. { "compliance": "ana@operator.com" }
    }
  }
  options?: {
    skipChecks?: string[]         // check IDs to skip, e.g. ["mobile-first-format"]
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
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @./schemas/fixtures.ts.json | jq
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
    targetJurisdiction: string
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
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `<telegram-bot-token>` |
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
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
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

Open Telegram and start a chat with [@BotFather](https://t.me/BotFather). Send `/newbot`, follow the prompts, and copy the token it gives you. It looks like `<telegram-bot-token>`.

```bash
# Verify the token works
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
# Expected: {"ok":true,"result":{"id":...,"username":"YourBotName",...}}
```

**Step 2 — Create a private channel (or group)**

Create a new Telegram channel (e.g. `#promo-preflight-alerts`). Set it to private.

**Step 3 — Add the bot as admin**

Go to the channel settings → Administrators → Add Administrator. Search for your bot's username and add it. It needs the **Post Messages** permission.

**Step 4 — Get the chat ID**

Send any message to the channel, then call:

```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates | jq '.result[].message.chat.id'
```

For a channel (not a group), the ID is negative (e.g. `-1001234567890`). If `getUpdates` returns nothing, forward a message from the channel to your bot first to trigger an update.

**Step 5 — Add to .env**

```env
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=-1001234567890
```

**Step 6 — Restart Preflight**

```bash
docker-compose restart app
# or if running locally:
npm run dev
```

**Step 7 — Verify**

Trigger a test run via the UI or API:

```bash
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @./schemas/fixtures.ts.json
```

Within ~1 second (one outbox poll interval), a message should appear in your channel. A `BLOCK` verdict looks like:

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

<!-- STATUS: empty -->
<!-- Brazilian welcome offer walkthrough under SPA/MF Q2 2026 -->
<!-- Pull directly from DEEP-RESEARCH.md §8 for: required T&C in PT-BR, 10 blockers table, fixed version, alternate timeline citing Perfect Storm €5M. -->

```
TBD by T-035. Source: DEEP-RESEARCH.md §8 + verified fines table above + Stanislav quote as closing.
```

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
- Handlers are discovered via `import.meta.glob` at boot — no manual registration list to maintain.
- API route handlers call only `bus.dispatch(command)` or `bus.query(query)` — they have no direct dependency on repositories or domain services.

This is *not* a full CQRS read/write model split. The same domain models serve both sides. The bus is purely an in-process dispatch mechanism, not a message broker.

## Consequences

**Positive**
- Adding a new operation is one file plus one line in the handler index.
- API routes are trivially testable: mock the bus, assert the dispatched command.
- Handler test suites are isolated: inject mock ports, assert the result.
- No circular dependencies between layers — every import flows in one direction.

**Negative**
- Slight learning curve for contributors unfamiliar with CQRS terminology: commands, queries, handlers.
- Handler discovery via `import.meta.glob` is one fragile point — if a handler file is named incorrectly, it will be silently skipped at boot (no registration error).

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

<!-- STATUS: empty -->
<!-- Worker: this ADR is "Accepted, deferred" — documents that AI features are planned but intentionally not built in v1. -->

```
TBD by T-009b worker. Michael Nygard format. Key points:

Context:
- The 11 deterministic checks form a defensible compliance core (per ADR-0003).
- Anthropic SDK wrapper already exists at lib/ai/ but is not wired into the main flow.
- AI offers a clear multiplier on UX (per the 01.tech G GATE Report Ch.4, Romanov: "AI is becoming the base tool of the industry — not as a replacement but as a multiplier of effectiveness").
- A set of high-leverage AI augmentations have been scoped but not built in v1.

Decision:
Document AI augmentation as a planned v1.x roadmap, not v1. Five specific augmentations are scoped:
1. PDF/text extraction — operator drops 5-page T&C → AI extracts structured fields → deterministic flow continues.
2. Fix suggestion per blocker — for each block, AI generates 3 replacement variants in the target locale preserving marketing intent.
3. Cultural localization audit — AI catches culture-specific mismatches regex misses (alcohol in Malaysia, religious imagery, gender-coded references).
4. Plain-language explanation per blocker — why this is bad, which regulator, which article, in marketer's language not lawyer's.
5. Compliance Q&A — operator asks "can I say X in Brazil?" → AI answers grounded in DEEP-RESEARCH knowledge base.

All five remain "AI on top of deterministic core" — AI never decides verdicts.

Consequences:
- Positive: clear separation between defensible compliance kernel and UX-multiplier layer. Future v1.x work can ship one augmentation at a time without disturbing the kernel. Owner sets clear expectation: deterministic is the contract, AI is the experience.
- Negative: Until v1.x ships, marketer still reads raw rule_id strings and has to manually rephrase blocked copy. Some operators expecting "AI-powered" branding may underestimate the value of deterministic-first.
- Neutral: When AI augmentation lands, it requires its own ADRs (cost budget, model selection, prompt cache strategy, evaluation harness).
```

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
