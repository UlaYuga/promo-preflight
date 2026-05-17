# Models & token-economy routing

> Where to send each ticket, which model, which reasoning effort. Single source of truth for the coordinator chat.

## Tools available

| Tool | Subscription | Best models (May 2026) | Reasoning controls | Когда использовать |
|---|---|---|---|---|
| **Claude Code Pro #1** | $20/mo Anthropic (основной) | Claude Sonnet 4.6 (default), Claude Opus 4.6 | Adaptive Thinking — `effort: low / medium / high` | Strategic reserve. Block 5 (outbox), Block 7 (tests), Block 10 (case study) |
| **Claude Code Pro #2** ⚡ TODAY ONLY | $20/mo Anthropic (второй аккаунт, burn-down — токены до конца дня) | Sonnet 4.6, Opus 4.6 | Same | **Block 3 целиком (T-010 → T-013a/b/c) сегодня в один marathon-run.** Если остаётся время — Block 2 (T-006..T-009b) |
| **Codex Desktop A** (coordinator) | $20/mo ChatGPT Plus #1 | GPT-5.5 (default), GPT-5.4, GPT-5.3-Codex, GPT-5.4-mini | `minimal / low / medium / high / xhigh` — Alt+, / Alt+. | Координатор-чат — единственный персистентный hub |
| **Codex Desktop B** (worker) | $20/mo ChatGPT Plus #2 | Same as above | Same | Block 4 (Postgres + API), Block 6 (Telegram), Block 8 (Docker + CLI), Block 9 (CI), T-013d (UI selector) |
| **OpenCode Go** | $10/mo OpenCode | DeepSeek V4 Pro / V4 Flash, Kimi K2.6, GLM-5.1, Qwen3.6 Plus | Per-model varies | Failover для bulk-YAML; backup если Claude Code Pro #1 выбит до Block 5/7/10 |

## Reasoning-effort principles

| Effort | When |
|---|---|
| `minimal` / `low` | Boilerplate, known templates (Docker, CI YAML, package.json) |
| `medium` | Standard CRUD, route handlers, ORM mappers, simple tests, README/docs prose |
| `high` | Domain modeling, type-level work, concurrency, outbox, idempotency, complex tests |
| `xhigh` | Architectural fork-points, complex refactors across many files. Rare — costs 3-5× tokens |

**Default rule**: start one notch lower than instinct, raise if the worker gets it wrong. Don't burn `high` on a CRUD route handler.

## Per-block routing — обновлено под parallel execution (2 Claude Code accounts)

### Сегодня (burn-down session — Claude Code Pro #2, токены до конца дня)

**Приоритет 1 — Block 3 целиком в одной marathon-сессии** (~3.5-7.5 ч):
| Ticket | Effort |
|---|---|
| T-010 структура папок | medium |
| T-011 domain types + value objects | high |
| T-012 Bus + HandlerRegistry | **high** |
| T-013 миграция 2 чеков в новый паттерн | high |
| T-013a Payment Compatibility Check | medium |
| T-013b Crypto Disclosure Check | medium |
| T-013c Jurisdictional Risk Signals | medium |

**Стратегия для marathon-сессии**: давай координатору **группу тикетов сразу** (T-010 → T-013), а не по одному. Claude Code Pro #2 за один pass сделает всю архитектуру без context reloading. Координатор делает full review **после** marathon-завершения, не по каждому тикету.

**Приоритет 2 (если останется бюджет токенов сегодня)** — Block 2 (docs + ADR):
| Ticket | Effort |
|---|---|
| T-006 ARCHITECTURE.md | medium |
| T-007 API.md | medium |
| T-008 CONFIGURATION/ERRORS/INTEGRATIONS | medium |
| T-009 4 ADR | medium |
| T-009b ADR-0005 AI roadmap | medium |

### Завтра (после сегодняшнего progress)

| Block | Tickets | Tool | Model | Effort |
|---|---|---|---|---|
| 1 — README + pain | T-001, T-002, T-003, T-005 | Claude Code Pro #1 | Sonnet 4.6 | medium |
| 3.5 — UI targetJurisdiction selector | T-013d | Codex Desktop B | GPT-5.3-Codex | medium |
| 4 — Postgres + REST API | T-014..T-019 | Codex Desktop B | GPT-5.3-Codex | medium |
| 5 — events + outbox | T-020..T-023 | **Claude Code Pro #1** | Sonnet 4.6 | **high** |
| 6 — Telegram | T-024..T-026 | Codex Desktop B | GPT-5.3-Codex | medium |
| 7 — tests | T-027..T-030 | **Claude Code Pro #1** | Sonnet 4.6 | medium |
| 8 — Docker + CLI | T-031..T-033 | Codex Desktop B | GPT-5.4-mini | low |
| 9 — CI | T-034 | Codex Desktop B | GPT-5.4-mini | low |
| 10 — case study | T-035, T-036 | **Claude Code Pro #1** | Sonnet 4.6 | medium |
| 11 — polish + assembly | T-036b, T-037, T-038 | Coordinator (Codex A) | GPT-5.5 | medium |

### Логика распределения

- **Сегодня выжимаем Claude Code Pro #2** на самом дорогом по reasoning блоке (Block 3) пока токены живы
- **Claude Code Pro #1 — стратегический резерв** на завтра для Block 5 (outbox критично), Block 7 (тесты), Block 10 (case study)
- **Codex Desktop B — workhorse** для всего боилерплейта завтра
- **Координатор-чат (Codex A)** — единственный hub, не мигрирует

## Per-ticket override (where it differs from block default)

| Ticket | Override | Reason |
|---|---|---|
| T-005 (before/after images) | Manual — you, via ChatGPT Image | See VISUALS.md §1, §2 — image gen, not text gen |
| T-013a/b/c (YAML rule artifacts) | If Claude limit hits → OpenCode Go DeepSeek V4 Pro | Long YAML is bulk work; DeepSeek cheaper |
| T-026 (Telegram screenshot) | Manual — you, after T-024 wired | Real screenshot, not AI |
| T-036 (hero image) | Manual — you, via ChatGPT Image | See VISUALS.md §1 |

## Failover chain

If the recommended tool hits limit:

1. **Claude Code Pro #2 limit hit сегодня** до окончания Block 3 → продолжаем на **Claude Code Pro #1** (но дороже стратегически — съедает резерв на завтра). Если Block 3 на грани — пробовать **OpenCode Go → Kimi K2.6** для финальных тикетов
2. **Claude Code Pro #1 limit hit завтра** → switch to **OpenCode Go → Kimi K2.6** (closest reasoning quality)
3. **Codex Desktop B limit hit** → switch to **OpenCode Go → DeepSeek V4 Pro**
4. **Если оба Claude Code Pro выбиты** до Block 5/7/10 → координатор переключает критичные тикеты на OpenCode Go Kimi K2.6 (приемлемая замена для domain reasoning), Block 4/6/8/9 продолжают на Codex B

## Token-economy rules of thumb

- **Group connected tickets in one tool session.** Block 3's 7 tickets should run in one Claude Code Pro session — saves context-loading cost.
- **Don't reload research on every ticket.** Workers should reference `RESEARCH-NOTES.md` / `DEEP-RESEARCH.md` paths; the coordinator confirms they read them once.
- **Coordinator stays in Codex Desktop A** (GPT-5.5 medium). All workers go elsewhere. Never lose the coordinator session.
- **If coordinator session approaches limit**, use `COORDINATOR-PROMPT.md` to bootstrap a new Codex session and re-load context. All work-state is in the repo files.

## What lives in which subscription's history

- **Claude Code Pro session**: Block 3 + Block 5 + Block 7 + Block 10 work (the architecture-heavy lifts)
- **Codex Desktop A**: coordinator chat — full session history of every ticket review
- **Codex Desktop B**: Block 4 + Block 6 + Block 8 + Block 9 + UI selector (T-013d) — the standard boilerplate
- **OpenCode Go**: opportunistic — YAML bulk, when others are out

When the weekend ends, all four sessions can be archived. The repo files are the artifact.
