# AI Brief Import Design

## Goal

Show an AI Product Manager / Product Builder scenario in which AI structures a messy
campaign brief, a person confirms candidate fields, and existing versioned rules make
the launch verdict.

## User Flow

The existing Campaign bundle screen gains an `Import from brief` mode beside the
manual-entry path. A user pastes a synthetic free-text brief or loads the supplied
sample and selects `Extract candidate fields`.

Extraction opens a review panel instead of running checks automatically. It shows:

- extracted fields with short source snippets and confidence labels;
- fields needing confirmation before handoff;
- fields not supplied by the brief and intentionally not inferred.

The panel carries the product promise: `AI extracts candidate fields. Versioned rules
determine the verdict.` Selecting `Confirm and run deterministic checks` applies the
candidate fields to the browser draft. When the minimum required fields are present,
the existing offline runner creates the Risk Report. When fields remain missing, the
draft remains editable and the existing requirements panel identifies the gaps.

## Data And Trust Boundary

`POST /api/brief-extraction` is a browser-demo endpoint, separate from authenticated
`/api/v1/*` persisted runs. It accepts only `{ rawBrief: string }`, validates input
size, is already covered by the global `/api/*` rate limit, returns `Cache-Control:
no-store`, and does not store the raw brief.

The extraction payload is Zod-validated and intentionally allows an incomplete
candidate bundle. Required deterministic-run fields are never fabricated merely to
pass schema validation. With `USE_MOCK_AI=true`, only the provided synthetic sample
brief produces an extraction; arbitrary free-form extraction requires a configured
Claude provider. With live AI enabled, the existing Claude JSON/repair utility
produces the same extraction contract.

## Components

- `schemas/brief-extraction.ts`: candidate, evidence, review and response contracts.
- `lib/ai/brief-extraction.ts`: sample brief, mock result, prompt construction and
  live extraction orchestration.
- `app/api/brief-extraction/route.ts`: request boundary and no-store response.
- `components/brief-import-panel.tsx`: textarea, extraction state and human review.
- `components/intake-form.tsx`: merge confirmed candidate fields into the existing
  draft and invoke the current deterministic run path.

## Errors And States

- Empty or too-short input: user-facing validation before request and server `400`.
- Input over configured size: server `413`.
- Mock mode with non-sample text: explicit explanatory `422`, not pretend AI output.
- Missing provider configuration or provider failure: actionable unavailable state.
- Incomplete extraction: no automatic run; fields are merged for manual completion.

## Verification

Unit tests cover partial extraction schema validation, mock/sample behavior, endpoint
size/error/no-store behavior, and UI boundary copy/source guarantees. Completion also
requires typecheck, lint, i18n parity, test suite, deterministic checks regression,
build, and browser inspection of the intake flow.
