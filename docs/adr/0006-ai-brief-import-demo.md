# ADR-0006 — AI Brief Import Demo

**Status**: Accepted
**Date**: 2026-05-27

## Context

ADR-0005 scoped five AI augmentations as a planned v1.x roadmap. Augmentation #1 (text extraction) was listed as the highest priority: "an operator drops a T&C PDF or pastes a free-text campaign brief; AI extracts candidate CampaignBundle fields for review."

This ADR implements a bounded browser-demo version of augmentation #1: free-text brief input with structured AI extraction, human review, and deterministic rule-based verdict. It does not implement PDF input or augmentations #2-#5.

## Decision

Add an "Import from brief" mode to the existing Campaign bundle intake screen. The flow:

1. User pastes a free-text campaign brief or loads the supplied synthetic sample.
2. `POST /api/brief-extraction` accepts the text, runs extraction through the existing Claude provider (or deterministic mock), and returns a Zod-validated partial candidate with evidence fields, confidence labels, and missing-information lists.
3. A review panel shows extracted fields grouped by confidence, lists items needing human confirmation, and enumerates what the brief did not provide.
4. On human confirmation, candidate fields merge into the browser draft state in `IntakeForm`. The existing deterministic check engine then runs as normal.

Key constraints:

- The extraction endpoint is a public browser-demo helper, NOT part of the authenticated `/api/v1/*` persisted contract. It returns `Cache-Control: no-store` and never stores raw brief text.
- In mock mode (`USE_MOCK_AI=true`), only the supplied synthetic sample brief produces an extraction. Arbitrary free-form text returns an explicit "mock_unavailable" 422 response — no attempt to fabricate AI output.
- In live mode, the existing `generateJsonWithRepair` utility drives extraction with a dedicated prompt that forbids invented facts.
- The extraction schema intentionally allows incomplete candidates. Required fields are never fabricated to pass validation.
- The product promise is explicit: "AI extracts candidate fields. Versioned rules determine the verdict."

## Consequences

**Positive**
- Demonstrates AI as a workflow accelerator, not a decision-maker — the core value proposition for an AI Product Manager role.
- Uses existing infrastructure: Claude provider, JSON repair, Zod validation, deterministic check engine.
- The extraction endpoint is a separate non-persisted surface — no changes to domain models, run repository, audit log, or outbox.
- Mock mode provides an honest synthetic demo without API key dependency.

**Negative**
- Free-form extraction requires `ANTHROPIC_API_KEY` and `USE_MOCK_AI=false`. The default mock only supports one sample.
- Extraction quality depends on prompt engineering and Claude's output consistency — no evaluation harness yet.
- No PDF input — file handling, parsing, and multi-page document extraction are deferred.

**Neutral**
- Augmentations #2-#5 remain deferred per ADR-0005. This ADR partially supersedes ADR-0005 for augmentation #1 only.
- The review panel UI lives in a new component (`brief-import-panel.tsx`) that `IntakeForm` imports — no structural changes to the form itself beyond a mode toggle.
