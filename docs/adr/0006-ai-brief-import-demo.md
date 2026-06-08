# ADR-0006 - AI Brief Import for the browser demo

**Status**: Accepted
**Date**: 2026-05-27

## Context

ADR-0005 deferred five possible AI augmentations while the deterministic kernel
and integration API were established. The portfolio now needs one bounded AI
Product Manager scenario: converting an unstructured brief into reviewable
structured input without claiming that an LLM makes launch decisions.

The browser demo and authenticated API are intentionally separate. Browser
drafts and reports remain local; persisted API runs require bearer
authentication and carry audit/outbox behavior.

## Decision

Ship text-only AI Brief Import in the browser demo:

1. A user pastes a synthetic campaign brief in the existing Intake screen.
2. `POST /api/brief-extraction` returns a Zod-validated partial candidate,
   source evidence snippets, fields requiring confirmation and fields not
   supplied in the brief.
3. The user confirms the candidate. Only then does the existing browser-local
   deterministic check runner produce a verdict.

The endpoint is rate-limited through the existing `/api/*` proxy, uses
`Cache-Control: no-store`, and does not persist raw brief text, API runs,
audit events or outbox events. `USE_MOCK_AI=true` supports only the labeled
synthetic sample. With `USE_MOCK_AI=false`, the existing server-side Claude
adapter sends the pasted text to the configured model provider and performs
free-text extraction using the same validated response contract.

This decision implements the text portion of ADR-0005 augmentation #1. PDF
upload and the remaining augmentation ideas remain deferred.

## Consequences

**Positive**

- The portfolio demonstrates human-in-the-loop AI on top of a reproducible
  decision engine.
- Missing facts remain visible instead of being fabricated to satisfy a full
  `CampaignBundle`.
- The existing authenticated API and deterministic checks need no semantic
  changes.

**Negative**

- The mock experience is intentionally limited to the supplied sample brief.
- Live extraction requires configured model credentials and still needs
  evaluation before any production use.

**Neutral**

- This is a browser-demo feature, not evidence of durable AI-run storage or
  legal/compliance automation.
