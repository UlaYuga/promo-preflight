# ADR-0005 — AI augmentation roadmap (planned, deferred from v1)

**Status**: Accepted, partially superseded by ADR-0006
**Date**: 2026-05-16

**Update (2026-05-27):** ADR-0006 implements a bounded text-only browser-demo
version of augmentation #1. PDF input and augmentations #2-#5 remain deferred.

## Context

The 8 deterministic checks form an artifact-based preflight workflow (see ADR-0003): the same input and artifact version produce the same finding set. This is the behavior Preflight demonstrates.

At the same time, an Anthropic SDK wrapper already exists at `infrastructure/ai/` but is not wired into the main flow. AI offers a genuine UX multiplier on top of the deterministic core — not as a decision-maker, but as the layer that helps marketers understand, act on, and fix what the deterministic engine flagged.

Five potential AI augmentations are documented here and explicitly *not* built in v1. They describe possible UX work above the deterministic workflow, not product capabilities that ship today.

## Decision

Document AI augmentation as a planned v1.x roadmap. AI is the planned augmentation layer on top — never the decision-maker. Five augmentations are scoped for v1.x, in priority order:

1. **PDF / text extraction** — An operator drops a T&C PDF or pastes a free-text campaign brief. AI extracts candidate `CampaignBundle` fields for review. The deterministic check flow then runs as normal.

2. **Fix suggestion per blocker** — For a `BLOCK` or `WARN` verdict, AI can draft locale-aware replacement copy for responsible-owner review before a re-run.

3. **Cultural localization review** — AI can suggest candidate text mismatches that regex rules cannot capture. It supplements, never replaces, the YAML policy/rule artifacts or human review.

4. **Plain-language explanation per blocker** — Each blocker currently surfaces a `ruleId` and a technical message. AI can explain which artifact label matched and what copy or input field a reviewer should inspect.

5. **Policy-artifact Q&A** — An operator asks which configured artifact would flag a phrase or missing field. AI answers from `rules/*.yaml` for responsible-owner review, without issuing legal guidance.

All five remain "AI on top of deterministic core." The deterministic verdict is always computed first. AI never overrides or bypasses it.

## Consequences

**Positive**
- Clear architectural separation between the deterministic preflight workflow (v1, ships now) and the optional UX layer (v1.x, planned).
- Each augmentation can be shipped independently without touching the domain layer or the deterministic check engine.
- The `ANTHROPIC_API_KEY` / `USE_MOCK_AI` toggle is already in place; augmentations activate behind this gate.
- Contributors get a clear roadmap: deterministic findings are the shipped behavior, while AI remains an optional experience layer.

**Negative**
- Until v1.x ships, reviewers read raw `ruleId` strings and manually revise flagged copy; no guided fix suggestions are shipped.
- PDF extraction (augmentation #1) requires careful prompt engineering to avoid hallucinated structured fields — needs an evaluation harness before production use.

**Neutral**
- When each AI augmentation lands, it warrants its own ADR covering: model selection, cost budget per run, prompt caching strategy (Anthropic prompt cache has 5-min TTL), and evaluation harness.
- The existing `infrastructure/ai/` adapter is the correct extension point for all five augmentations. No new infrastructure layer is needed.
