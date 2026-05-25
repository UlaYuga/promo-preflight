# ADR-0003 — Deterministic checks run first; AI is augmentation only

**Status**: Accepted
**Date**: 2026-05-16

## Context

Promo Preflight findings must be reproducible and traceable to the configured policy/rule artifacts. Responsible owners need to see why a bundle was flagged without relying on an unrepeatable model assessment. Three additional constraints reinforce this:

1. **External dependency** — Anthropic API calls add a network/model dependency and metered usage to a path that can run locally.
2. **Rate limits** — API rate limits make AI a poor fit for the synchronous hot path.
3. **Hallucination risk** — LLMs can misclassify configured terms or invent artifact references, making a workflow result harder for owners to verify.

An Anthropic SDK wrapper already exists at `lib/ai/` (now `infrastructure/ai/`) — so AI integration is technically available, just not wired into the checks path.

## Decision

All 11 preflight checks run deterministically against YAML policy/rule artifacts (`rules/*.yaml`). The artifacts are human-authored and version-controlled. The same input and artifact version always produce the same verdict.

AI is an optional augmentation layer on top of the deterministic core:
- AI may help *extract* structured campaign data from unstructured input (PDF T&C, free-text brief).
- AI may generate *human-readable explanations* of blockers after the deterministic verdict is set.
- AI may suggest *fix drafts* per blocker in the target locale.
- AI never decides or overrides a verdict.

The augmentation layer is activated by `ANTHROPIC_API_KEY` and bypassed completely by `USE_MOCK_AI=true`. See [ADR-0005](./0005-ai-augmentation-roadmap.md) for the full planned roadmap.

## Consequences

**Positive**
- Every run is reproducible: given the same campaign bundle and rule artifact version, the output is identical.
- Traceable: a persisted run can cite the specific `ruleId` and `rule artifact version` that triggered each blocker.
- The default path makes no AI API calls.
- Works offline and in air-gapped environments.

**Negative**
- Rule maintenance is fully manual: adding a new scenario requires a responsible owner to author and review YAML artifacts.
- The system cannot account for policy changes unless its artifacts are explicitly reviewed and updated.
- AI UX improvements (plain-language explanations, fix suggestions) are deferred to v1.x.

**Neutral**
- `USE_MOCK_AI=true` lets local development and CI run without an Anthropic API key. Mock responses are deterministic stubs, not real AI output.
