# Promo Preflight

*Pre-launch readiness checks for iGaming operators expanding into emerging markets. Built by a PM over a weekend with Claude Code.*

*Built around the regulatory realities described in the 01.tech × G GATE MEDIA Global iGaming Report 2026.*

[![License](https://img.shields.io/badge/license-Apache_2.0-blue)](LICENSE) [![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)](https://www.typescriptlang.org/) [![Tests](https://img.shields.io/badge/tests-passing-green)](https://github.com/UlaYuga/promo-preflight/actions) [![CI](https://github.com/UlaYuga/promo-preflight/actions/workflows/ci.yml/badge.svg)](https://github.com/UlaYuga/promo-preflight/actions/workflows/ci.yml)

<p align="center">
  <img src="./docs/assets/hero.png" alt="Preflight in action" width="800" />
</p>

[Live demo](https://promo-preflight-production.up.railway.app/) · [Docs](./docs) · [Case study](./docs/CASE-STUDY.md)

---

## The problem

Every quarter, another regulator updates its rules. Your promo team is still reviewing T&C across eight locales in Google Docs.

- "The key and very underrated trend in 2026, in my view, is not AI or core updates, but the increasing local blockings and regulatory pressure in Latin America and Asia. These began last year and have hit not just products but webmasters too. Infrastructure resilience and tight processes for tracking and reacting to local-operator blocks will be the competitive advantage of this year." — **Stanislav, SEO Product Manager, 01.tech**, *Global iGaming Report 2026*

- "Gamble responsibly as a footer link no longer satisfies several jurisdictions." — **Emmanuel Omoloyin, SEO Content Writer**

- **Perfect Storm B.V.**: €5M fine + 2-year ban, DGOJ Spain (Apr 2026). **Sky Betting & Gaming**: £1.17M, UKGC (2022) — welcome bonus emails sent to self-excluded players. **Kindred (Spooniker)**: SEK 100M, Spelinspektionen (2020) — single-bonus-rule violation. Real money lost when promo compliance fails.

No dedicated tool exists for multi-jurisdiction promo compliance in iGaming. Reviews happen across Slack, Google Docs, Excel, and Notion — one chain per locale, none of it audit-defensible. As Adam Mateja put it: "Promotions in iGaming are one of those things that look simple on paper, and then turn into a lot of manual work."

A mid-size operator runs 20-30 campaigns a month,\* spends an estimated 2-5 person-hours per campaign on compliance review,\* and still pulls or corrects 5-10% of campaigns post-launch.\*

\*Illustrative industry estimate; no public operator metrics are published.

Preflight runs 8 deterministic checks per target jurisdiction against versioned YAML rule artifacts — before launch. The API also runs 3 mandatory runtime policy checks for payment compatibility, crypto disclosure, and jurisdictional risk. One canonical `CampaignBundle`, one JSON format. Each check returns `GO` / `WARN` / `BLOCK` with a specific rule reference and a suggested owner. For authenticated API clients, events route via webhook (Telegram first) and every API run is written to an audit log.

Built around the regulatory and operational realities described in the 01.tech × G GATE MEDIA Global iGaming Report 2026. Preflight closes the gap that report identifies as 2026's most underrated risk.

## What this is

Promo Preflight runs 8 deterministic compliance checks against a campaign bundle before it goes live, then the API adds 3 mandatory runtime policy checks backed by validated YAML artifacts. Each check targets a specific risk category: T&C completeness per jurisdiction, forbidden phrases, offer math, payment method compatibility, crypto disclosure rules, link health, format requirements, launch ownership, and localization depth. Checks run against versioned YAML rule artifacts — same input, same output, every time.

Promo Preflight exposes two deliberate surfaces:

- **Interactive browser demo** — a guided workflow over synthetic sample data. Drafts, reports, campaign versions, and tour state remain in that browser's `localStorage`; the demo does not claim durable server persistence.
- **Protected REST API evidence contract** — `/api/v1/*` accepts authenticated integration requests, persists API runs and policy provenance to Postgres, and supports audit/outbox evidence.

The browser demo never sends `PREFLIGHT_API_KEY` and does not submit an authenticated API run. Use an authenticated API client or the documented `curl` path to exercise the persisted backend contract.

Runtime policy provenance is part of the API evidence contract. `POST /api/v1/runs`, idempotency replay, `GET /api/v1/runs/:id`, and `GET /api/v1/campaigns/:id/versions` include `policyRuleVersions` for `paymentCompatibility`, `cryptoDisclosure`, and `jurisdictionalRisk`. These values come from `rules/payment-methods-by-region.yaml`, `rules/crypto-disclosure-rules.yaml`, and `rules/forbidden-phrases-by-region.yaml`; changing one of those runtime artifacts must bump its top-level `version`. `rules/rules.yaml` remains documentation/catalog metadata for the 8 core offline checks, not the runtime source for these 3 API policy artifacts.

The protected API accepts one canonical `CampaignBundle` in JSON — one format regardless of whether you're launching in Brazil, India, Mexico, or the UK — and returns a `GO` / `WARN` / `BLOCK` verdict with blockers, each tied to a rule ID and a suggested owner role. Every authenticated API run is persisted and logged; the audit trail holds up to regulatory review.

<table>
<tr>
<td width="50%" valign="top"><strong>Before</strong><br>4 tabs, 8 chats, 0 versioning.<br><img src="./docs/assets/before.png" width="100%" /></td>
<td width="50%" valign="top"><strong>After</strong><br>One workspace. Verdict in 12 seconds.<br><img src="./docs/assets/after.png" width="100%" /></td>
</tr>
</table>

## Who this is for

| You are | What this gives you |
|---|---|
| A multi-jurisdiction iGaming operator (lic. EU + LATAM + offshore) | Catch jurisdictional risks before promo launches — Brazilian SPA, Indian UPI ban, Mexican SPEI rules, Algerian crypto prohibition |
| A platform / white-label engineer at a B2B iGaming infrastructure provider (01.tech, SoftSwiss, BetConstruct, EveryMatrix tier) | Drop-in pre-launch gate your operator customers can add to their CRM / Promo workflow without your platform team owning compliance |
| A CRM / Promo Ops lead launching campaigns across 8-15 locales every month | Replace the Notion → Slack → Google Doc → Excel review chain with one deterministic check and one Telegram alert with assignable owners |

## How it works

Each authenticated API run follows a synchronous request path — validate, dispatch, check, persist, respond — with side effects (Telegram notifications, audit events) handled asynchronously via the outbox pattern. The interactive browser demo is a separate local workflow and is not the caller in this sequence.

### Mermaid: data flow sequence

```mermaid
sequenceDiagram
    autonumber
    actor Promo as Promo team
    participant API as POST /api/v1/runs
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
    Run->>Run: 8 deterministic checks per targetJurisdiction
    Run->>Repo: save Run + Blockers (transaction)
    Run->>Outbox: write events (same transaction)
    Run-->>API: { runId, verdict, counts, blockers, policyRuleVersions }
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
    Pre-->>Compl: 8 deterministic checks per targetJurisdiction
    Pre-->>Launch: assigned blockers with ownerHint
    Launch->>Launch: review verdict (GO / WARN / BLOCK)
    Launch->>Launch: launch only when GO
```

Here's what the Telegram notification looks like in production:

<img src="./docs/assets/telegram-screenshot.png" width="500" />

## Three paths to use

### 1. Self-host via docker-compose

The fastest path to a production-ready instance:

```bash
git clone https://github.com/UlaYuga/promo-preflight.git
cd promo-preflight
cp .env.example .env   # fill PREFLIGHT_API_KEY; fill TELEGRAM_* if needed
docker compose up -d
export PREFLIGHT_API_KEY='replace-with-the-same-key-as-in-.env'
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
  --experimental-strip-types \
  -e "import { workedExamples } from './schemas/worked-examples.ts'; console.log(JSON.stringify({ campaign: workedExamples.EX08.bundle }, null, 2));" \
  > /tmp/preflight-ex08.json
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Authorization: Bearer $PREFLIGHT_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @/tmp/preflight-ex08.json | jq
```

See [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) for the full environment variable reference.

### Railway deploy lifecycle

Railway Docker deployments run `node db/migrate.mjs` from the final application image as the `[deploy].preDeployCommand`. The command reads Drizzle's existing `db/migrations/meta/_journal.json` and SQL artifacts, and exits non-zero on failure, preventing `node server.js` from starting. Repeated deploys skip migrations already recorded in `drizzle.__drizzle_migrations`. At runtime, `instrumentation.node.ts` starts only the in-process outbox worker; `/api/ready` reads database connectivity and required-table status without applying migrations.

### 2. Drop into your CI (npm package + CLI)

```bash
cat campaign.json | npm run check
npm run check -- --file ./campaign.json
npm run check -- --file ./campaign.json --format human
```

Exit codes: `0` on GO, `1` on WARN, `2` on BLOCK, `3` on invalid JSON/schema, `4` on internal failure. Use as a build gate in any CI pipeline.

### 3. Managed SaaS

Coming soon. [Email for early access](mailto:alex@marlerino.group).

## Tech stack

| Package | Why |
|---|---|
| `next` 16 | App Router + React Server Components — single process hosts both API and UI |
| `react` 19 | Server Components; concurrent rendering for the run result view |
| `typescript` 6 | Strict mode; all types derived from Zod schemas via `z.infer<>` |
| `tailwindcss` 3.4 | Custom design token palette; no standard Tailwind color classes in UI code |
| `drizzle-orm` + `pg` | Type-safe SQL access; versioned SQL migrations run before Railway starts the application image |
| `zod` | Runtime validation at all system boundaries |
| `vitest` | Fast unit + integration tests; ESM-native, TypeScript path alias support |
| `@anthropic-ai/sdk` | Optional AI augmentation layer; stubbed when `USE_MOCK_AI=true` |
| `yaml` | Parses jurisdiction rule artifacts (`rules/*.yaml`) at boot |
| Telegram Bot API | Outbound compliance alerts to the team channel via the outbox worker |

## Architecture

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

## What we deliberately don't do

- No multi-tenant (org-scoped data) — out of scope for this sprint; can be added without changing core
- No gRPC — REST + webhooks fit the consumer model (CRM/Promo Ops teams)
- No live LLM in default checks path — checks must be deterministic and reproducible; AI is an optional augmentation only (see ADR-0003 + ADR-0005 for the planned augmentation roadmap)
- No end-user accounts or browser sign-in — the browser workflow remains a credential-free demo, while every `/api/v1/*` endpoint requires bearer authentication
- No microservices — one process: in production the outbox worker boots inside the Next server via `instrumentation.node.ts`; a standalone `bin/preflight-worker.ts` entrypoint exists for local docker-compose and tests
- No "promo compliance score" magic number — verdicts are GO / WARN / BLOCK based on rule severity, not opaque AI

## AI augmentation roadmap

Preflight ships a deterministic-first compliance core. AI is the planned augmentation layer on top — never the decision-maker.

Five augmentations are scoped for v1.x:

- **PDF / text extraction** — drop a T&C PDF or a free-text campaign brief; AI extracts a structured `CampaignBundle`; the deterministic checks run as normal.
- **Fix suggestion per blocker** — for each `BLOCK`, AI generates 3 locale-aware replacement copy variants that preserve marketing intent.
- **Cultural localization audit** — catches culture-specific mismatches that regex rules miss: alcohol references in Malaysia, religious imagery in MENA, gender-coded financial promises.
- **Plain-language explanation per blocker** — why this was flagged, which regulator, which article, in the marketer's language rather than the lawyer's.
- **Compliance Q&A** — ask "can I say 'risk-free' in UK copy?" and get an answer grounded in the rule artifacts.

> "Ecosystem solutions that unify traffic, product, analytics, payments, and infrastructure into a single growth model gain the most value." — **Alexander Romanov, Head of White Label, 01.tech**, *Global iGaming Report 2026*

See [ADR-0005](./docs/adr/0005-ai-augmentation-roadmap.md) for full reasoning. None of these ship in v1.0; the deterministic kernel does. AI lands incrementally in v1.x.

## Contributing / License / Author

Issues and PRs welcome. Apache 2.0.

Built by Alexander Ulanov — PM with 6+ years in digital production, e-commerce, and TV.
[github.com/UlaYuga](https://github.com/UlaYuga)
