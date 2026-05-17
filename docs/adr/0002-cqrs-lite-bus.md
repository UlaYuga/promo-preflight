# ADR-0002 — CQRS-lite with a tiny in-process bus

**Status**: Accepted
**Date**: 2026-05-16

## Context

With 11 check modules, 8 API endpoints, and an event-driven side-effect layer (Telegram, audit log), request handling was becoming entangled inside Next.js route handlers. Each handler was importing repositories, calling domain services, and triggering side effects directly — making individual handlers hard to test and impossible to reason about in isolation.

A full CQRS framework (Axon, NestJS CQRS module) would have been overkill for a single-developer project. We needed a pattern that gave us the separation benefits without the framework weight.

## Decision

Implement a minimal in-process `Bus` with a `HandlerRegistry`. Rules:

- **Commands** represent write intent (e.g. `RunChecksCommand`). Handlers return `Result<T, PreflightException>` — never throw directly.
- **Queries** represent read intent (e.g. `FindRunQuery`). Handlers return `T` directly or throw `NotFoundException`.
- Each handler lives in exactly one file in `infrastructure/handler/`.
- `HandlerRegistry` supports glob-based registration via a `fromGlob(...)` factory; production boot wiring lives in `infrastructure/registry/` and can use `import.meta.glob` where the runtime supports it. Handlers are not self-registering — the registry must be initialised explicitly at startup.
- API route handlers call only `bus.dispatch(command)` or `bus.query(query)` — they have no direct dependency on repositories or domain services.

This is *not* a full CQRS read/write model split. The same domain models serve both sides. The bus is purely an in-process dispatch mechanism, not a message broker.

## Consequences

**Positive**
- Adding a new operation is one file plus one registration call in the boot registry.
- API routes are trivially testable: mock the bus, assert the dispatched command.
- Handler test suites are isolated: inject mock ports, assert the result.
- No circular dependencies between layers — every import flows in one direction.

**Negative**
- Slight learning curve for contributors unfamiliar with CQRS terminology: commands, queries, handlers.
- If a handler is not registered in `infrastructure/registry/`, it silently does not exist — there is no compile-time enforcement that every command or query has a handler wired up.

**Neutral**
- This is not event sourcing. The bus does not persist commands or events. The outbox pattern (ADR-0004) handles durable event delivery separately.
