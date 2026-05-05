# Promo Preflight

Pre-launch readiness workspace for regulated promo campaigns in iGaming. Loads a campaign bundle, runs an 8-stage / 23-rule check, surfaces blockers with owners and suggested fixes, prepares a Slack-ready handoff summary, and compares versions across iterations.

## Demo

[promo-preflight.vercel.app](https://promo-preflight.vercel.app/)

90-second tour: [?tour=1](https://promo-preflight.vercel.app/app/intake?tour=1)

## What this is

A portfolio design study. Built to demonstrate workflow thinking around launch readiness in regulated iGaming — intake, rule review, T&C robustness, channel consistency, GEO/localization QA, owner assignment, blockers, handoff, and version compare.

The demo runs on predefined campaign data (one welcome bonus, two versions). No real LLM calls, no backend, no auth. Next.js application with TypeScript, Zod validation, and a full deterministic check engine.

## Why it exists

Public iGaming job descriptions and operator workflows reveal a manual pain around pre-launch QA of promo packages: bonus math, T&C, communications, GEO compliance, Legal/Risk/CRM/Product handoff. Existing B2B vendors cover execution layers (CRM automation, gamification, bonus engines) but not the readiness layer before launch.

This study explores what an AI-assisted readiness workspace could look like, without pretending to be a commercial product.

## Screens

| Screen | Purpose |
|---|---|
| Intake | Load campaign bundle: metadata, offer math, terms, copy, owners |
| Risk Report | 8-stage check results with blockers, warnings, passed checks |
| Handoff | Slack-ready summary with channel/tone/mention settings |
| Readiness | Go/No-Go board with owner matrix and launch checklist |
| Version Diff | Compare v1 vs v2: closed blockers, new warnings |
| Rules | 23 versioned rules across 8 check stages |
| Owners | Workspace owner matrix from YAML config |

## 8 check stages x 23 rules

| Stage | Rules | Type |
|---|---|---|
| Channel consistency | 3 | Core |
| Terms robustness | 4 | Core |
| Offer math sanity | 3 | Deterministic |
| Jurisdictional risk signals | 3 | Core |
| Localization QA | 2 | Core |
| Launch ownership | 3 | Core |
| Link QA | 3 | Fast |
| Format QA | 2 | Fast |

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 6 (strict)
- Tailwind CSS 3.4
- Zod (all API boundaries validated)
- driver.js (product tour)
- Lucide React (icons)
- Anthropic SDK (optional, mock mode available)

## Commands

```
npm run dev              # Dev server
npm run build            # Production build
npm run typecheck        # TypeScript strict
npm run lint             # ESLint
npm run schema:check     # Zod schema smoke
npm run checks:mock      # Mock check runner
npm run checks:run       # Full regression
npm run rules:check      # Validate rules.yaml
npm run i18n:check       # Validate EN/RU translations
```

## Author

Alexander Ulanov — PM with 6+ years in digital production, e-commerce, and TV.
[github.com/UlaYuga](https://github.com/UlaYuga)