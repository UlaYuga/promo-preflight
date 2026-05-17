# ADR-0003 — Deterministic checks run first; AI is augmentation only

**Status**: Accepted
**Date**: 2026-05-16

## Context

Promo compliance checks must be reproducible and auditable. A regulator asking "why was this campaign flagged?" cannot accept "the language model assessed it." Three additional constraints reinforce this:

1. **Cost and latency** — Anthropic API calls add ~1-3 seconds and non-trivial cost per run. At 20-30 campaigns a month across 8-15 locales, this compounds quickly.
2. **Rate limits** — API rate limits make AI a poor fit for the synchronous hot path.
3. **Hallucination risk** — LLMs can misclassify regulatory terms or invent rule citations. A false negative (flagging a compliant campaign) has operational cost; a false positive (clearing a non-compliant one) has legal cost.

An Anthropic SDK wrapper already exists at `lib/ai/` (now `infrastructure/ai/`) — so AI integration is technically available, just not wired into the checks path.

## Decision

All 11 compliance checks run deterministically against YAML rule artifacts (`rules/*.yaml`). The rule artifacts are human-authored and version-controlled. The same input always produces the same verdict.

AI is an optional augmentation layer on top of the deterministic core:
- AI may help *extract* structured campaign data from unstructured input (PDF T&C, free-text brief).
- AI may generate *human-readable explanations* of blockers after the deterministic verdict is set.
- AI may suggest *fix drafts* per blocker in the target locale.
- AI never decides or overrides a verdict.

The augmentation layer is activated by `ANTHROPIC_API_KEY` and bypassed completely by `USE_MOCK_AI=true`. See [ADR-0005](./0005-ai-augmentation-roadmap.md) for the full planned roadmap.

## Consequences

**Positive**
- Every run is reproducible: given the same campaign bundle and rule artifact version, the output is identical.
- Audit-friendly: a compliance log entry can cite the specific `ruleId` and `rule artifact version` that triggered each blocker.
- Runs are fast (~12ms for 8 checks) and cheap — no API calls in the default path.
- Works offline and in air-gapped environments.

**Negative**
- Rule maintenance is fully manual: adding a new jurisdiction requires a human to author YAML rules.
- The system cannot adapt to regulatory changes it has not been explicitly updated for.
- AI UX improvements (plain-language explanations, fix suggestions) are deferred to v1.x.

**Neutral**
- `USE_MOCK_AI=true` lets local development and CI run without an Anthropic API key. Mock responses are deterministic stubs, not real AI output.
