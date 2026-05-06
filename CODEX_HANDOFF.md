# Codex Handoff Report - Current Product State

**Date:** 2026-05-07  
**Branch:** main  
**Production:** https://promo-preflight-production.up.railway.app/  
**Status:** Railway production is live. Functional baseline is implemented as an offline/deterministic portfolio workspace.

## What Is Implemented

- Next.js 16 App Router product with welcome page, workspace shell, EN/RU UI, and Driver.js guided tour.
- Campaign intake form with metadata, offer basics, assets, links, terms, owners, worked examples, validation, and browser draft persistence.
- Offline deterministic check runner with 8 check modules and 23 YAML-backed rules.
- Risk Report screen with saved/offline report loading, issue table, issue detail, evidence, owner suggestions, export, and save-run panel.
- Launch Readiness screen with Go/No-Go state, owner matrix, blockers, dependencies, and checklist.
- Handoff screen with Slack-style preview, markdown export, tone/mention/channel controls, launch date, blockers, and copy action.
- Campaign workspace with local campaign list, per-campaign versions, owner overrides, and version-to-version blocker diffing.
- Rules and Owners screens backed by `rules/rules.yaml` and `config/owners.yaml`.
- PostgreSQL schema/seed files for durable persistence design.
- Railway/Nixpacks deploy config, `noindex` metadata, and disallow-all `robots.ts`.

## What Is Not Implemented

- No auth, user accounts, billing, SaaS onboarding, or payments.
- No player-facing gambling journey, operator logos, affiliate funnel, or casino visual positioning.
- No durable campaign persistence in the running UI; saved reports, campaigns, and versions use `localStorage`.
- No server CRUD/API layer for campaign data.
- No live LLM call in the current check path; Anthropic provider wiring exists for future AI-assisted paths.
- No raw campaign/T&C storage by default.

## Current Source Of Truth

- Public-facing project description: `README.md`.
- Production URL and app metadata: `app/layout.tsx`.
- Commands and package metadata: `package.json`.
- Rules artifact: `rules/rules.yaml`.
- Owner config: `config/owners.yaml`.
- Database design: `db/schema.sql` and `db/README.md`.

## Recommended Verification

Run before claiming release readiness:

```bash
npm run typecheck
npm run lint
npm run schema:check
npm run checks:run
npm run versioning:check
npm run rules:check
npm run owners:check
npm run i18n:check
npm run ai:check
npm run build
```

Run `npm run db:check` only when `DATABASE_URL` points to a reachable PostgreSQL database.
