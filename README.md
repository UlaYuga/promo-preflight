# Promo Preflight

Internal Promo/CRM Ops workspace for regulated casino promo launches.

[![Tests](https://img.shields.io/badge/tests-passing-green)]()

Promo Preflight turns a campaign bundle into an operational pre-launch review: structured intake, deterministic risk checks, owner handoff, launch readiness, saved campaign runs, and version-to-version blocker diffing. It is built as a portfolio-grade demo workspace for regulated iGaming promo operations, with synthetic data and the sensitive parts kept deliberately offline.

## Live Demo

[promo-preflight-production.up.railway.app](https://promo-preflight-production.up.railway.app/)

90-second guided tour: open the landing page and start the tour from the main CTA.

## What It Does

Promo teams usually review campaign offers, T&C, channel copy, links, localization, risk wording, and owner approvals across scattered docs and chats. Promo Preflight packages that review into a single workspace:

- Load or draft a campaign bundle with offer math, terms, channel assets, links, owners, GEO, locale, and currency.
- Run 8 offline check modules against 23 versioned rules.
- Surface blockers, warnings, evidence snippets, suggested fixes, owner suggestions, and confidence.
- Generate a Go/No-Go readiness board with blockers, owner matrix, dependencies, and checklist state.
- Prepare a Slack-ready handoff summary with mention level, tone, launch date, blockers, and next actions.
- Save campaign runs locally and compare versions to see new, reopened, still-open, and resolved blockers.
- Browse the rules artifact and owner matrix used by the workspace.
- Switch EN/RU UI copy and run the product tour.

## 3-minute demo script

1. Open the landing page.
   Show Promo Preflight as an internal Promo/CRM Ops workspace for regulated casino promo launches, not a player-facing casino product.
2. Start from a sample case.
   Click `Start with Sample Case` and open the synthetic demo path in `02 / Campaign bundle`.
3. Run the check.
   Call out that the workspace runs 8 deterministic/offline checks against a synthetic campaign bundle.
4. Open `03 / Risk Report`.
   Show blockers, warnings, issue detail, owner suggestion, and the next-step strip.
5. Save the run.
   Use `Save Run` to store the current review as a campaign run for version history.
6. Open `01 / Campaigns`.
   Show the saved campaign, open version details, and then open the diff path for the follow-up version.
7. Open `04 / Handoff`.
   Show the Slack-ready internal ops update generated from the saved report.
8. Close with supporting screens.
   Briefly show `05 / Launch Readiness`, `06 / Rules`, and `07 / Owners` as the operational support surface around the review flow.

Use this framing while demoing:

- All campaign names, copy, and scenarios are synthetic.
- The product is a demo/portfolio-grade workspace, not a production SaaS product.
- There is no auth, payments, onboarding funnel, or player-facing gambling flow.
- The current product flow does not depend on live LLM calls, real casino integrations, or durable backend persistence.

## Product Surface

| Area | Implemented |
|---|---|
| Welcome | Product entry, EN/RU toggle, metrics, workflow preview, tour launcher |
| Intake | Campaign metadata, offer fields, terms, assets, links, owners, worked examples, draft persistence |
| Risk Report | Saved/offline report loading, sorted issue table, issue detail panel, export actions, save run panel |
| Readiness | Go/No-Go banner, owner matrix, blockers, launch checklist, dependencies |
| Handoff | Slack-style preview, markdown export, mention/tone/channel controls, copy action |
| Campaigns | Local campaign list, version history, owner overrides |
| Version Diff | vN vs vN-1 blocker diff with resolved/new/reopened/still-open states |
| Rules | YAML-backed 23-rule artifact viewer |
| Owners | YAML-backed owner matrix |
| Tour | Driver.js desktop product tour and sample-data setup |
| Deployment | Railway/Nixpacks production deployment with noindex/robots |

## Implementation Status

Implemented in code:

- Next.js 16 App Router with React 19 and TypeScript strict mode.
- Zod contracts for campaign bundles, check results, readiness, rules, owners, and versioning.
- Eight deterministic/offline check modules: channel consistency, terms robustness, offer math sanity, jurisdictional risk signals, localization QA, launch ownership, link QA, and format QA.
- `rules/rules.yaml` with 23 validated EN/RU rules.
- `config/owners.yaml` with workspace owner overrides.
- Browser `localStorage` persistence for drafts, saved reports, campaigns, and versions.
- Markdown and Slack-ready export formatting.
- PostgreSQL schema and seed files for a Railway-ready durable model.
- Optional Anthropic provider wrapper and prompts for future AI-assisted extraction/review.
- Regression/smoke scripts for schemas, rules, owners, i18n, AI provider wiring, DB schema, checks, and versioning.

Not implemented by design:

- No auth, billing, SaaS onboarding, or account model.
- No player-facing gambling flow, operator logos, affiliate flow, or casino visual positioning.
- No durable production persistence in the UI path; demo data stays in the browser.
- No live LLM calls in the current product flow; the running checks are deterministic/offline.
- No server API layer for campaign CRUD; the database schema is present but not wired into the app UI.
- No raw campaign/T&C storage by default.

## Architecture

```txt
app/                  Next.js App Router pages
components/           Product screens and shared UI
lib/checks/           Offline deterministic check engine
lib/ai/               Optional Anthropic provider and prompt contracts
lib/rules/            YAML rules loader and validator
lib/owners/           Owner config loader and resolver
lib/i18n/             EN/RU translation provider and checker
lib/readiness.ts      Go/No-Go readiness generation
lib/versioning.ts     Local campaign/version persistence and diffing
schemas/              Zod contracts for all product data
rules/rules.yaml      Versioned 23-rule artifact
config/owners.yaml    Workspace owner matrix
db/                   PostgreSQL schema, seed, and smoke check
locales/              English and Russian UI copy
```

## Check System

| Stage | Route | What it catches |
|---|---|---|
| Channel consistency | Core | Offer/copy/terms mismatches across channels |
| Terms robustness | Core | Missing wagering, max bet, cashout, eligibility, withdrawal clauses |
| Offer math sanity | Deterministic | Implausible caps, percentages, deposit math, cashback contradictions |
| Jurisdictional risk signals | Core | Risk-free claims, missing responsible-use or adult-only language |
| Localization QA | Core | GEO, locale, currency, language, and date-format inconsistencies |
| Launch ownership | Core | Missing/blocked owners and follow-up gaps |
| Link QA | Fast | Invalid URLs, domain mismatch, missing UTM parameters |
| Format QA | Fast | Empty or over-limit channel assets |

## Tech Stack

- Next.js 16, React 19, TypeScript 6
- Tailwind CSS 3.4 with custom dark operations palette
- Zod for runtime validation at product boundaries
- YAML for rules and owner config artifacts
- Lucide React icons
- driver.js product tour
- PostgreSQL schema for future durable persistence
- Anthropic SDK provider wrapper for optional AI-assisted paths
- Railway deployment via Nixpacks

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment defaults are documented in `.env.example`. The app works without `ANTHROPIC_API_KEY` because the current check runner is offline/deterministic.

## Three Paths to Use

1. `docker-compose up` (local full stack)
2. npm package + CLI (`preflight-check`, shipped in T-033)
3. managed SaaS (coming soon)

### Path 2: npm package + CLI

```bash
# stdin mode
cat campaign.json | npm run check

# file mode
npm run check -- --file ./campaign.json

# human-readable output
npm run check -- --file ./campaign.json --format human
```

Exit codes: `0=GO`, `1=WARN`, `2=BLOCK`, `3=invalid JSON/schema`, `4=internal check failure`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local Next.js dev server |
| `npm run build` | Production build plus Railway output fix |
| `npm run start` | Start the production build |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run schema:check` | Zod schema smoke check |
| `npm run checks:mock` | Mock/offline check smoke |
| `npm run checks:run` | Full regression across EX01-EX11 plus offline cases |
| `npm run versioning:check` | Campaign version diff smoke |
| `npm run rules:check` | Validate `rules/rules.yaml` |
| `npm run owners:check` | Validate `config/owners.yaml` |
| `npm run i18n:check` | Validate EN/RU translation parity |
| `npm run ai:check` | Validate AI provider wiring without requiring a live key |
| `npm run db:check` | Validate PostgreSQL schema/seed against `DATABASE_URL` |

## Safety Positioning

Promo Preflight is an internal launch-readiness workspace for regulated casino promo operations, not a gambling product. It uses synthetic data, avoids real operator branding, and does not include auth, payments, affiliate mechanics, player-facing flows, or durable raw-input storage claims. Production pages are `noindex`/`nofollow`, and `robots.ts` disallows crawling.

## Author

Alexander Ulanov - PM with 6+ years in digital production, e-commerce, and TV.

[github.com/UlaYuga](https://github.com/UlaYuga)
