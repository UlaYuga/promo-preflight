# Codex Handoff Report - SPEC-SYNC-5 reconciled state

**Date:** 2026-05-03  
**Branch:** main  
**Status:** T0-T10 PASS · T15-FIX-1 PASS · T16 PASS · T17 PASS · T18 PASS · T19 PASS · T20-B PASS · FUNCTIONAL-QA-1 PASS · Next task: `DESIGN-IMPLEMENT-1`

---

## Summary

Accepted functional baseline:
- T0-T10 PASS.
- T15-FIX-1 PASS.
- T16 PASS.
- T17 PASS.
- T18 PASS.
- T19 PASS.
- T20-B PASS.
- FUNCTIONAL-QA-1 PASS.

The next Codex task is `DESIGN-IMPLEMENT-1 - Refero-assisted visual implementation`. Do not start T11 deploy next.

---

## Remaining flow

1. `DESIGN-IMPLEMENT-1 - Refero-assisted visual implementation` in Codex: implement the visual pass using Refero MCP for visual reference/research only.
2. Use `/Users/axel/Downloads/Promo Preflight.html` as a design draft and visual reference only, not product architecture.
3. Return to Codex for Railway deploy, noindex/robots/rate limits, and final QA package only after design implementation passes.

T11 Railway deploy is deferred until after `DESIGN-IMPLEMENT-1` passes.

Codex should not continue the previous external design-pass process. The next design implementation task is owned by Codex and must preserve the accepted functional architecture.

Railway + Nixpacks remains the deployment source of truth after design implementation. Vercel is superseded as deployment target and may remain only as UI reference style.

---

## Scope and safety constraints

Preserve the existing product constraints:
- No auth.
- No payments.
- No casino positioning.
- No betting service positioning.
- No affiliate positioning.
- No operator logos.
- No player-facing flow or copy.
- Do not store raw input permanently.
- Do not log request bodies.
- Do not expand product scope during `DESIGN-IMPLEMENT-1`.

`DESIGN-IMPLEMENT-1` should implement only visual changes needed for the start page visual entry, tutorial launcher visuals, tour popover styling, and final/mobile tour states. It should not add product features, deployment config, auth/signup/payments, casino/betting/affiliate/player-facing copy, or any new persistence of raw input.

---

## DESIGN-IMPLEMENT-1 expectations

Goal: complete Refero-assisted visual implementation without design-driven rewrites.

Implementation requirements:
- Use Refero MCP for visual reference/research only.
- Treat `/Users/axel/Downloads/Promo Preflight.html` as a design draft, not product architecture.
- Preserve existing Next.js routes.
- Preserve existing T19 tour behavior and Driver.js flow logic.
- Preserve existing versioning route structure.
- Preserve existing EN/RU i18n.
- Preserve existing checks, rules, owners and export flows.
- Do not make version diff a top-level nav item.
- Add/finish start page visual entry, tutorial launcher visuals, tour popover styling, and final/mobile tour states.

Build/typecheck/lint should be run during `DESIGN-IMPLEMENT-1` unless there is a clear task-specific reason to skip. Deployment should remain deferred.

---

## Do not start yet

- Do not start T11 deploy.
- Do not create or change Railway deployment config.
- Do not start final QA package work.
- Do not create new future task files.

The next handoff after `DESIGN-IMPLEMENT-1` should state whether visual implementation passed, list changed files and checks, and confirm readiness for deferred Railway/Nixpacks deploy.
