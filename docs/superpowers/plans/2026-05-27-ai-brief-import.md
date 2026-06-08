# AI Brief Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paste-to-structured-candidate AI demo that hands confirmed fields to the existing deterministic campaign check flow.

**Architecture:** A public browser-demo route performs validated, non-persisted extraction through the existing AI adapter or an honest synthetic mock. A focused client panel owns import/review UI; `IntakeForm` remains responsible for draft state and deterministic execution.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Anthropic adapter, Vitest, Tailwind.

---

### Task 1: Extraction Contract And Service

**Files:**
- Create: `schemas/brief-extraction.ts`
- Create: `lib/ai/brief-extraction.ts`
- Test: `lib/ai/brief-extraction.test.ts`

- [ ] Write tests proving that extraction candidates may be incomplete, the supplied sample maps to BR campaign candidate fields and evidence, and mock mode rejects arbitrary text.
- [ ] Run `npm test -- lib/ai/brief-extraction.test.ts` and confirm failure because the new modules do not yet exist.
- [ ] Implement Zod schemas, sample text, deterministic mock extraction, prompt text that forbids invented facts, and live `generateJsonWithRepair` orchestration.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Non-Persisted Demo Route

**Files:**
- Create: `app/api/brief-extraction/route.ts`
- Test: `app/api/brief-extraction/route.test.ts`

- [ ] Write tests for mock sample success, `Cache-Control: no-store`, oversized input rejection and explicit non-sample mock rejection.
- [ ] Run `npm test -- app/api/brief-extraction/route.test.ts` and confirm failure because the endpoint does not exist.
- [ ] Implement `POST /api/brief-extraction` with Zod body parsing, input-size validation, `USE_MOCK_AI` selection and safe error responses.
- [ ] Re-run the focused route test and confirm it passes.

### Task 3: Intake Review UI

**Files:**
- Create: `components/brief-import-panel.tsx`
- Modify: `components/intake-form.tsx`
- Modify: `locales/en.json`
- Modify: `locales/ru.json`
- Test: `components/brief-import-boundary.test.ts`

- [ ] Write source-boundary tests proving the panel calls only the demo extraction route, exposes the trust statement, and EN/RU strings describe confirmation before deterministic checks.
- [ ] Run `npm test -- components/brief-import-boundary.test.ts` and confirm failure until the panel and copy exist.
- [ ] Implement a compact mode switch and review panel with loading/error/empty states, evidence rows and `Confirm and run deterministic checks`.
- [ ] Merge candidate fields into `IntakeForm` state without storing raw text; execute the current offline runner only after minimum fields are valid.
- [ ] Run focused tests and `npm run i18n:check`.

### Task 4: Verification And UI Review

**Files:**
- Review: `components/brief-import-panel.tsx`
- Review: `components/intake-form.tsx`

- [ ] Check accessibility and responsive behavior for buttons, textarea labels, status messaging, evidence lists and longer RU copy.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run i18n:check`, `npm run checks:run`, and `npm run build`.
- [ ] Run the app and inspect the sample extraction -> confirmation -> Risk Report flow in a browser.
