# ADR-0005 — AI augmentation roadmap (planned, deferred from v1)

**Status**: Accepted, deferred
**Date**: 2026-05-16

## Context

The 11 deterministic checks form a defensible compliance core (see ADR-0003): same input, same verdict, audit-friendly, reproducible. This is the contract Preflight makes with operators.

At the same time, an Anthropic SDK wrapper already exists at `infrastructure/ai/` but is not wired into the main flow. AI offers a genuine UX multiplier on top of the deterministic core — not as a decision-maker, but as the layer that helps marketers understand, act on, and fix what the deterministic engine flagged.

The 01.tech Global iGaming Report 2026 puts this plainly:

> "Ecosystem solutions that unify traffic, product, analytics, payments, and infrastructure into a single growth model gain the most value." — **Alexander Romanov, Head of White Label, 01.tech**

Five high-leverage AI augmentations have been scoped, prototyped conceptually, and explicitly *not* built in v1. They are documented here so contributors understand the roadmap and do not inadvertently block it.

## Decision

Document AI augmentation as a planned v1.x roadmap. AI is the planned augmentation layer on top — never the decision-maker. Five augmentations are scoped for v1.x, in priority order:

1. **PDF / text extraction** — Operator drops a 5-page T&C PDF or pastes a free-text campaign brief. AI extracts structured `CampaignBundle` fields. The deterministic check flow then runs as normal. This eliminates the manual data-entry step that currently precedes every run.

2. **Fix suggestion per blocker** — For each `BLOCK` or `WARN` verdict, AI generates 3 locale-aware replacement copy variants that preserve marketing intent while removing the offending phrase or missing clause. Operator picks one, edits, re-runs.

3. **Cultural localization audit** — AI detects culture-specific mismatches that regex rules cannot catch: alcohol references in Malaysia (dual-age-gate market), religious imagery in MENA, gender-coded financial promises in markets where these are considered predatory. Supplements, never replaces, the YAML rule artifacts.

4. **Plain-language explanation per blocker** — Each blocker currently surfaces a `ruleId` and a technical message. AI rewrites this as a marketer-facing explanation: *why* this matters, which regulator, which article, what the practical consequence is. Reduces the compliance-to-marketing translation round-trip.

5. **Compliance Q&A** — Operator asks "Can I say 'risk-free' in the UK copy?" or "What does Brazil require in the T&C for a welcome bonus?" AI answers grounded in the `rules/*.yaml` artifacts and `DEEP-RESEARCH.md` knowledge base. Reduces dependency on legal counsel for routine questions.

All five remain "AI on top of deterministic core." The deterministic verdict is always computed first. AI never overrides or bypasses it.

## Consequences

**Positive**
- Clear architectural separation between the defensible compliance kernel (v1, ships now) and the UX-multiplier layer (v1.x, ships incrementally).
- Each augmentation can be shipped independently without touching the domain layer or the deterministic check engine.
- The `ANTHROPIC_API_KEY` / `USE_MOCK_AI` toggle is already in place; augmentations activate behind this gate.
- Operators get a clear roadmap: deterministic is the contract, AI is the experience layer on top.

**Negative**
- Until v1.x ships, marketers read raw `ruleId` strings and must manually rephrase blocked copy — no guided fix suggestions yet.
- Some operators evaluating "AI-powered compliance" tools may undervalue the deterministic-first approach without seeing the AI layer.
- PDF extraction (augmentation #1) requires careful prompt engineering to avoid hallucinated structured fields — needs an evaluation harness before production use.

**Neutral**
- When each AI augmentation lands, it warrants its own ADR covering: model selection, cost budget per run, prompt caching strategy (Anthropic prompt cache has 5-min TTL), and evaluation harness.
- The existing `infrastructure/ai/` adapter is the correct extension point for all five augmentations. No new infrastructure layer is needed.
