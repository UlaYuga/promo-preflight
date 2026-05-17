# Preflight v2 — 40h sprint backlog

> Цель: в понедельник Нина (Head of Python and Go в 01tech) открывает репо и за 90 секунд понимает: этот PM умеет говорить с инженерами на их языке, нашёл реальную боль, спроектировал решение, и довёл его до работающего сервиса. WOW не в коде самом по себе — в очевидной способности декомпозировать продукт и довести до production-posture за weekend.

## Контекст и ограничения

- **Дедлайн**: понедельник 2026-05-18, 09:00 МСК
- **Бюджет**: 40 часов активной работы (после пивота под 01.tech: ~42 ч, режем буфер из Block 11)
- **Исполнитель кода**: Claude Code; ты управляешь и проверяешь acceptance criteria
- **Целевой читатель**: Нина, Head of Python and Go в 01.tech. Сегмент клиентов 01.tech: emerging markets multi-jurisdiction iGaming operators (Tier-1 + лицензируемые LATAM + офшорный сегмент CIS/APAC/AFR)
- **Pain framing**: основан на `01.tech × G GATE MEDIA Global iGaming Report 2026` (см RESEARCH-NOTES.md). #1 риск 2026 — локальные блокировки и регуляторное давление в LATAM и Asia.
- **Риск-профиль**: глубже, но уже. Лучше сделать 8 блоков из 11 на full quality, чем 11 на 60%
- **Безопасные дропы (если время кончится)**: Block 9 (CI) → Block 8 (CLI) → T-013c (jurisdictional risk — оставить базовый чек без YAML расширения) → Block 5 (упрощаем outbox до прямой публикации) → Block 11 (polish)
- **Не дропаем**: Block 1 (positioning), Block 3 core + T-013a (payment) + T-013b (crypto), Block 4 (Postgres + API), Block 6 (Telegram), Block 7 (тесты), T-035 (case study)

## Как пользоваться файлом

1. **Открываешь координатор-чат** (Codex Desktop GPT-5.5, запущен из `COORDINATOR-PROMPT.md`). Координатор выдаёт следующий тикет.
2. Координатор указывает **рекомендуемую модель и effort** (см. `MODELS.md`). Открываешь соответствующий инструмент:
   - Claude Code Pro — для архитектуры, типизации, тестов, сложных рассуждений
   - Codex Desktop B (второй ChatGPT Plus) — для CRUD, Docker, CI, стандартного boilerplate
   - OpenCode Go — bulk-задачи (YAML), failover
3. **Копируешь промпт** из тикета BACKLOG.md, отправляешь в выбранный инструмент.
4. Получаешь результат → **возвращаешься в координатор-чат** с paste-ом результата или подтверждением.
5. Координатор делает **ревью по acceptance criteria** этого тикета.
6. Если pass: помечаешь `[x]` + commit. Если fail: возвращаешь worker-у с конкретным пунктом.
7. Координатор выдаёт следующий тикет.

## Operating Procedure

### Git workflow

- **Каждый завершённый тикет = один conventional commit** в текущей worktree (`claude/serene-mayer-697d54`)
- Формат сообщения: `[T-XXX] feat|fix|docs|test|ci|chore: <короткое описание>`
- Merge в `main` делается **одним PR в самом конце** (Block 11, T-038), после полной полировки
- НЕ amend-ить старые коммиты после push в remote

### Текстовые артефакты — через TEXTS.md

Тикеты Block 1 (README), Block 2 (docs/ADR), Block 10 (CASE-STUDY) **не пишут напрямую** в `README.md` / `docs/*` / `docs/adr/*` файлы. Вместо этого:

1. Worker заполняет соответствующую секцию в `TEXTS.md` (статус → `drafted`)
2. Owner делает manual polishing pass (статус → `polished`) — это критично чтобы текст не выглядел "нейронно"
3. Block 11 финальный шаг (T-038) копирует polished секции в финальные файлы (статус → `shipped`)

### Визуальные артефакты — через VISUALS.md

Картинки (hero, before/after, фон Telegram) генерирует **owner** в ChatGPT Image по готовым промптам из `VISUALS.md`. Mermaid диаграммы — inline в TEXTS.md, рендерятся GitHub.

### Verbatim citations

Регуляторные цитаты, фамилии экспертов, фразы CONAR/UKGC/ASA — **только из DEEP-RESEARCH.md / OLD-RESEARCH.md** в виде, как они там лежат в "Verbatim quotes" секции TEXTS.md. **Никаких изобретений.** Если worker не нашёл нужной цитаты — помечает `[TODO: verify with owner]` и возвращает координатору.

### Когда корректировать план

Координатор имеет право обновлять BACKLOG.md / TEXTS.md / MODELS.md / VISUALS.md когда:
- Тикет показал что acceptance criteria недостаточно — тогда уточняет
- Worker предложил лучший паттерн без нарушения ADR — adopt
- Гипотеза из RESEARCH-NOTES после worker-проверки оказалась неверна — обновить sec.15

ADR (`docs/adr/`) **не редактируются** после принятия — это история. Изменение решения = новый ADR superseding старый.

### Model & effort routing

Полная карта в `MODELS.md`. Краткая логика:
- **Block 3, 5, 7, 10** → Claude Code Pro Sonnet 4.6 effort=high (где critical) / medium (где обычно)
- **Block 4, 6, 8, 9** + UI selector (T-013d) → Codex Desktop B GPT-5.3-Codex / GPT-5.4-mini medium / low
- **Block 1, 2** → Claude Code Pro Sonnet 4.6 medium (нужен полный research-контекст)
- **Block 11** → Координатор chat сам делает (Codex GPT-5.5)

### Failover при лимитах

Если Claude Code Pro выбил лимит → OpenCode Go Kimi K2.6 или DeepSeek V4 Pro.
Если Codex Desktop B выбил лимит → OpenCode Go DeepSeek V4 Pro.
Координатор-чат **никогда не покидает** Codex Desktop A — единственный персистентный hub.

## Общие правила для всех тикетов

- Все артефакты для внешнего просмотра (README, docs/, ADR) — **на английском**.
- Acceptance criteria и commit messages — **на английском**.
- Внутренние комментарии в коде — минимум, только где WHY не очевидно.
- TypeScript strict, без `any`. Все границы — через Zod.
- Никаких новых зависимостей кроме явно указанных в тикете.
- После каждого тикета — `npm run typecheck && npm run lint` должны быть зелёными.

## Definition of Done (применяется к каждому тикету)

- Все пункты acceptance criteria выполнены.
- `npm run typecheck` зелёный.
- `npm run lint` зелёный.
- Локально приложение запускается (`npm run dev`).
- Коммит сделан с conventional commit message.

## Зависимости между блоками

```
Block 1 (Pain + README)  ─┐
Block 2 (docs + ADR)     ─┤
Block 3 (Layers + Bus)   ─┴─→ Block 4 (Postgres API) ─→ Block 5 (Events) ─→ Block 6 (Telegram)
                                      ↓
                                  Block 7 (Tests, параллельно с 5-6)
                                      ↓
                                  Block 8 (Docker + CLI) ─→ Block 9 (CI)
                                      ↓
                                  Block 10 (Case study)
                                      ↓
                                  Block 11 (Polish)
```

Можно параллелить: Block 1 + Block 3 (Pain-story и слои не пересекаются). Но если делаешь один — иди по порядку.

---

# Block 1 — Pain framing + README + screenshots (4 ч)

> Самый высокий ROI блок. Если Нина закроет вкладку после первого экрана README — ничего больше не имеет значения.
> **Видео не делаем** (решение от 2026-05-16). Освободившийся час кладём в общий буфер.
>
> **Важно для всех тикетов в Block 1**: тексты пишутся в **`TEXTS.md`** (соответствующие секции с `<!-- STATUS: empty -->`), не напрямую в README.md. README.md финализируется в Block 11 (T-038). Visual artifacts генерируются owner-ом в ChatGPT Image по спекам в **`VISUALS.md`**.
> **Recommended model для всех Block 1**: Claude Code Pro / Sonnet 4.6 / effort=medium

## T-001 — Pain section в README (под emerging markets pivot) (1.5 ч)

**Статус**: [ ]
**Зависимости**: none
**Файлы**: `TEXTS.md` (секция "README — The problem (T-001)"). **НЕ редактировать README.md напрямую** — финальный перенос делает T-036b в Block 11.
**Источник данных**: `TEXTS.md` секция "Verbatim quotes — DO NOT EDIT" + "Industry estimates — MUST be marked" + "Competitive positioning — canonical formulation". Это canonical bank цитат и форматирования. Backup-источник: `RESEARCH-NOTES.md` секции 7, 14, 15. Дип-ресерч уже пришёл и зашит в TEXTS.md.

**Acceptance criteria**:
- [ ] Сейчас секция "README — The problem (T-001)" в TEXTS.md имеет STATUS=`empty` — после выполнения должна быть `drafted`
- [ ] Hook line (3-5 секунд на чтение): про multi-jurisdiction промо, НЕ про UKGC fines
- [ ] 3 концентрированных bullet-а:
  - Bullet 1: цитата **Stanislav, SEO Product Manager 01.tech** (English translation из TEXTS.md verbatim) — про "local blockings as #1 underrated trend 2026"
  - Bullet 2: цитата **Emmanuel Omoloyin, SEO Content Writer 2026** verbatim — *"Gamble responsibly as a footer link no longer satisfies several jurisdictions"*
  - Bullet 3: 3 verified fines из таблицы TEXTS.md (Perfect Storm €5M + 2-year ban Spain Apr 2026 / Sky Betting £1.17M UK 2022 / Kindred SEK 100M Sweden 2020) как one-line callout "real money lost when promo compliance fails"
- [ ] Industry estimates (если используются — 20-30 кампаний / месяц, 2-5 ч на review, etc.) формат: `*industry estimate, no public hard data*` markdown-сноска
- [ ] Параграф "Why existing tooling doesn't solve this" — цитата про Slack/Google Docs/Excel/Notion (paraphrased) + Adam Mateja verbatim quote inline
- [ ] Параграф "What Preflight does differently" — pre-launch readiness, 11 deterministic checks per jurisdiction, audit-friendly, webhooks (Telegram first)
- [ ] Closing line: "Built around the regulatory and operational realities described in the [01.tech × G GATE MEDIA Global iGaming Report 2026]. Preflight closes the gap that report identifies as 2026's most underrated risk."
- [ ] Максимум 350 слов
- [ ] Английский, тон direct/honest, без маркетингового жаргона (банятся: revolutionary, powered by AI, next-gen)
- [ ] Verbatim citations НЕ перефразируются (особенно регуляторные и named-person quotes)

**Промпт для Claude Code**:
```
This ticket writes into TEXTS.md, NOT directly into README.md.

Read TEXTS.md fully first — especially:
- "Verbatim quotes — DO NOT EDIT" section at the top (canonical quote bank)
- "Industry estimates — MUST be marked" section (formatting discipline for numbers)
- "Competitive positioning — canonical formulation" section
- "README — The problem (T-001)" section where you'll write the result

Also read RESEARCH-NOTES.md sections 7, 14, 15.

Fill the README "The problem" section in TEXTS.md. Output goes into that section. Update its STATUS marker from `empty` to `drafted` when done. Do NOT touch README.md.

The section must:

1. **Open with one sharp hook line** (3-5 seconds to read). Tone: honest, technical, slightly self-aware. NOT marketing. Example direction (DON'T copy verbatim — rewrite in your own words): "Every quarter, every regulator in every emerging market changes something. Brazilian SPA, Indian UPI, Mexican SPEI. Your promo team is still diffing T&C in Google Docs across 8 locales."

2. **Three concrete pain bullets**, each citing a quote VERBATIM from TEXTS.md "Verbatim quotes" section:
   - Bullet 1: Use **Stanislav, SEO Product Manager 01.tech** English translation about local blockings being the #1 underrated 2026 trend.
   - Bullet 2: Use **Emmanuel Omoloyin, SEO Content Writer 2026** verbatim: *"Gamble responsibly as a footer link no longer satisfies several jurisdictions"* — frames the depth-of-compliance pain.
   - Bullet 3: Use **3 verified fines from the table** in TEXTS.md (pick the 3 most striking: Perfect Storm €5M + 2-year ban Spain Apr 2026, Sky Betting £1.17M UK 2022, Kindred SEK 100M Sweden 2020). Format as a one-line callout — "real money lost when promo compliance fails."

3. **Industry-estimate numbers if used**: must follow the formatting from TEXTS.md "Industry estimates" section — `*industry estimate, no public hard data*` footnote.

4. **One short paragraph "Why existing tooling doesn't solve this"**. Use the cited quote *"In the industry there's no ready solution for automated promo review: teams use Slack, Google Docs, Excel, Notion and email"* (OLD-RESEARCH §4, paraphrased in English). Add the Adam Mateja quote VERBATIM from TEXTS.md as inline reinforcement.

5. **One short paragraph "What Preflight does differently"**: pre-launch readiness check; one canonical campaign bundle in one format; 11 deterministic checks against versioned YAML rules PER target jurisdiction; flags blockers with rule reference and suggested owner; events go via webhooks (Telegram first); audit log for compliance defense.

6. **End with**: "Built around the regulatory and operational realities described in the [01.tech × G GATE MEDIA Global iGaming Report 2026]. Preflight closes the gap that report identifies as 2026's most underrated risk."

Style: GitHub-flavored markdown, no emoji, no buzzwords ("revolutionary", "powered by AI", "next-gen" banned). Direct, technical tone. Maximum 350 words for the whole section. Verbatim citations sacred — do not paraphrase regulatory or named-person quotes.

After editing, print the section you wrote and confirm STATUS marker is `drafted`.
```

---

## T-002 — README hero block в TEXTS.md (1 ч)

**Статус**: [ ]
**Зависимости**: T-001 (секция "README — The problem" в TEXTS.md должна быть STATUS=`drafted` — hero пишется с пониманием тона pain section)
**Файлы**: `TEXTS.md` секция "Hero block (T-002)". **НЕ редактировать README.md напрямую** — финальный перенос в T-036b (Block 11).

**Acceptance criteria**:
- [ ] STATUS секции "Hero block (T-002)" в TEXTS.md обновлён с `empty` на `drafted`
- [ ] h1: `Promo Preflight`
- [ ] Tagline italic: `*Pre-launch readiness checks for iGaming operators expanding into emerging markets. Built by a PM over a weekend with Claude Code.*`
- [ ] Attribution italic small line: `*Built around the regulatory realities described in the [01.tech × G GATE MEDIA Global iGaming Report 2026](link-tbd).*`
- [ ] Badge row (shields.io): License Apache 2.0 / Next.js 16 / TypeScript 6 / Tests placeholder yellow / CI placeholder yellow
- [ ] Placeholder для hero image: `<!-- TODO: insert hero from VISUALS §1 -->` (owner генерит через ChatGPT Image)
- [ ] 3-link row: `[Live demo](https://promo-preflight-production.up.railway.app/) · [Docs](./docs) · [Case study](./docs/CASE-STUDY.md)`
- [ ] `---` separator на отдельной строке в конце блока
- [ ] Финальный блок ≤ 30 строк
- [ ] README.md **не тронут**

**Промпт для Claude Code**:
```
This ticket writes ONLY into TEXTS.md section "Hero block (T-002)". Do NOT touch README.md. Final README.md assembly is T-036b in Block 11.

Read TEXTS.md fully first. Locate the section "## Hero block (T-002)" and the existing template inside its ```...``` code block (lines starting with `# Promo Preflight` and ending with `---`). You will replace placeholders in that template with the final content.

Required exact content in the section's code block, in this order:

1. h1: `# Promo Preflight`
2. Blank line
3. Tagline italic line: `*Pre-launch readiness checks for iGaming operators expanding into emerging markets. Built by a PM over a weekend with Claude Code.*`
4. Blank line
5. Attribution italic small line: `*Built around the regulatory realities described in the [01.tech × G GATE MEDIA Global iGaming Report 2026](link-tbd).*`
6. Blank line
7. Badge row, each badge on its own inline using shields.io URLs:
   - `[![License](https://img.shields.io/badge/license-Apache_2.0-blue)](LICENSE)`
   - `[![Next.js](https://img.shields.io/badge/Next.js-16-black)]()`
   - `[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)]()`
   - `[![Tests](https://img.shields.io/badge/tests-placeholder-yellow)]()` (will be replaced in T-027)
   - `[![CI](https://img.shields.io/badge/ci-placeholder-yellow)]()` (will be replaced in T-034)
8. Blank line
9. Image placeholder comment: `<!-- TODO: insert hero from VISUALS §1 -->`
10. Blank line
11. 3-link row: `[Live demo](https://promo-preflight-production.up.railway.app/) · [Docs](./docs) · [Case study](./docs/CASE-STUDY.md)`
12. Blank line
13. `---` separator

Update STATUS marker from `empty` to `drafted`.

After editing, print the populated section + the diff vs the original template. Confirm README.md is untouched (`git status README.md` should show no changes).
```

---

## T-003 — README sections в TEXTS.md (1 ч)

**Статус**: [ ]
**Зависимости**: T-002
**Файлы**: `TEXTS.md` секции "What this is", "Who this is for (T-003)", "How it works (T-003)", "Three paths to use (T-003)", "Tech stack (T-003)", "Architecture (T-003)", "What we deliberately don't do (T-003)", "AI augmentation roadmap (T-003 — new sub-section)", "Contributing / License / Author (T-003)". **НЕ редактировать README.md напрямую** — финальный перенос в T-036b.

**Acceptance criteria**:
- [ ] Все 9 секций перечисленных выше получают STATUS=`drafted`
- [ ] "Who this is for" — markdown table 3 строки (Casino operator / Platform engineer / Startup promo team) — этот шаблон уже лежит в TEXTS.md как готовый, нужно только подтвердить и перевести в drafted
- [ ] "How it works" — две mermaid диаграммы (data flow + Preflight in your workflow), которые уже лежат как готовые шаблоны в TEXTS.md — подтвердить/доработать
- [ ] "Three paths to use" — 3 нумерованных подсекции (self-host / npm package / SaaS soon)
- [ ] "Tech stack" — markdown table со стеком v2 (см. AGENTS.md "Стек v2")
- [ ] "Architecture" — ASCII tree из AGENTS.md "Архитектура v2"
- [ ] "What we deliberately don't do" — bulleted list, **должен ссылаться на ADR-0003 + ADR-0005**
- [ ] "AI augmentation roadmap" — ~150 слов, 5 bullets, заканчивается verbatim Romanov quote из TEXTS.md "Verbatim quotes"
- [ ] "Contributing / License / Author" — короткие блоки
- [ ] README.md **не тронут**

**Промпт для Claude Code**:
```
This ticket fills 9 sections inside TEXTS.md. Do NOT touch README.md. Final README.md assembly is T-036b in Block 11.

Read TEXTS.md fully first — many of these sections already have ready scaffolding (Who this is for has a complete table, How it works has both mermaid diagrams ready, etc.). Your job is to **populate where TBD, polish where scaffolded, and update STATUS markers**.

Sections to fill (each lives inside its own ```...``` block in TEXTS.md):

1. **"What this is"** — 2-3 paragraphs explaining what Preflight is (11 deterministic checks per jurisdiction, etc.). Reference VISUALS §2 for the before/after collage placement. Reference AGENTS.md "11 чеков v2" table for accuracy.

2. **"Who this is for (T-003)"** — table already exists in TEXTS.md, confirm/polish. No major rewrite needed.

3. **"How it works (T-003)"** — both mermaid diagrams already exist in TEXTS.md. Verify they render correctly (no syntax issues), add 1-2 sentence intro paragraph above each.

4. **"Three paths to use (T-003)"** — 3 numbered subsections. Path 1: `docker-compose up`. Path 2: npm package + CLI (mark "shipped in T-033"). Path 3: managed SaaS "coming soon".

5. **"Tech stack (T-003)"** — markdown table. Pull stack from AGENTS.md "Стек v2" section. One-line rationale per dep.

6. **"Architecture (T-003)"** — ASCII directory tree. Pull from AGENTS.md "Архитектура v2 (target)" section. Mention that `lib/` is legacy with v2.1 migration TODO.

7. **"What we deliberately don't do (T-003)"** — bulleted list already templated in TEXTS.md, confirm/polish. Ensure both ADR-0003 and ADR-0005 are referenced.

8. **"AI augmentation roadmap (T-003 — new sub-section)"** — ~150 words. Follow the TBD template inside that section in TEXTS.md. MUST use the verbatim Romanov quote from TEXTS.md "Verbatim quotes" section (do NOT paraphrase). Reference ADR-0005 explicitly.

9. **"Contributing / License / Author (T-003)"** — short, see template in TEXTS.md.

For each section: update STATUS marker from `empty` to `drafted`. Do NOT mark `polished` — that's owner's job during manual polish pass.

Style: GitHub-flavored markdown, no emoji, no buzzwords ("revolutionary", "powered by AI", "next-gen" banned). Direct, technical, slightly self-aware.

After editing, print the diff of TEXTS.md sections only. Run `git status README.md` to confirm README is untouched.
```

---

## T-004 — REMOVED

Тикет был "Loom-script для 90-секундного видео". Видео не делаем (решение от 2026-05-16). Час освобождён в буфер. Пропускаем сразу к T-005.

---

## T-005 — Before/after изображения (картинки в docs/assets + embed в TEXTS.md) (1 ч)

**Статус**: [ ]
**Зависимости**: T-003 (секция "What this is" в TEXTS.md должна быть STATUS=`drafted`)
**Файлы**: `docs/assets/before.png`, `docs/assets/after.png` (физические PNG-файлы) + `TEXTS.md` секция "What this is" (HTML embed). README.md **не трогается**.

**Acceptance criteria**:
- [ ] `docs/assets/after.png` создан копированием существующего `risk-report-final.png` из корня репо, сжат до < 300KB если нужно
- [ ] `docs/assets/before.png` — **отложен на owner** (генерация через ChatGPT Image по VISUALS §2a). В коде создаётся placeholder-файл `docs/assets/before.png.txt` с одной строкой "Generated by owner via ChatGPT Image, see VISUALS.md §2a"
- [ ] В TEXTS.md секция "What this is" — HTML `<table>` embed добавлен в конец секции (до закрывающего ``` блока секции)
- [ ] README.md **не тронут**

**Промпт для Claude Code**:
```
This ticket creates two physical PNG files in docs/assets/ AND adds an HTML embed block inside TEXTS.md section "What this is". Do NOT touch README.md.

Step 1: Create docs/assets/ directory if missing.

Step 2: Create docs/assets/after.png from the existing repo screenshot:
```bash
cp risk-report-final.png docs/assets/after.png
```
Verify size — if > 300KB, compress with `pngquant` or similar to under 300KB.

Step 3: For docs/assets/before.png — DO NOT generate via HTML/CSS. Owner generates this via ChatGPT Image (per VISUALS.md §2a). Instead, create a placeholder file:
```bash
echo "TODO: generated by owner via ChatGPT Image. See VISUALS.md §2a for the generation prompt." > docs/assets/before.png.txt
```

Step 4: Open TEXTS.md, locate section "## What this is" (under "# README — full content"). Add this HTML `<table>` block at the end of that section's `...` code block, just before the closing fence:

```
<table>
<tr>
<td><strong>Before</strong><br>4 tabs, 8 chats, 0 versioning.<br><img src="./docs/assets/before.png" /></td>
<td><strong>After</strong><br>One workspace. Verdict in 12 seconds.<br><img src="./docs/assets/after.png" /></td>
</tr>
</table>
```

Verify:
- `ls docs/assets/` shows after.png + before.png.txt
- `git status README.md` shows no changes
- TEXTS.md section "What this is" contains the HTML table block

Print result + diff.
```

---

# Block 2 — docs/ + 4 ADR (4 ч)

> Это блок, который Нина листает дольше всего, если первый экран её зацепил. ADR — самый сильный PM-сигнал во всём репо.
>
> **Важно для всех тикетов в Block 2**: тексты пишутся в **`TEXTS.md`** (секции `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/CONFIGURATION.md`, `docs/ERRORS.md`, `docs/INTEGRATIONS.md`, `docs/adr/0001..0004`), не напрямую в docs/. Финализация в Block 11.
> **Recommended model для всех Block 2**: Claude Code Pro / Sonnet 4.6 / effort=medium

## T-006 — docs/ARCHITECTURE.md в TEXTS.md (1 ч)

**Статус**: [ ]
**Зависимости**: T-003
**Файлы**: `TEXTS.md` секция "docs/ARCHITECTURE.md (T-006)". **НЕ создавать docs/ARCHITECTURE.md напрямую** — финальный перенос в T-036b (Block 11).

**Acceptance criteria**:
- [ ] STATUS секции "docs/ARCHITECTURE.md (T-006)" в TEXTS.md обновлён с `empty` на `drafted`
- [ ] Mermaid-диаграмма слоёв (domain / application / infrastructure / api) с явными зависимостями (стрелки только сверху вниз)
- [ ] Секции внутри: Layers, Source layout, Data flow (с sequence diagram), Key invariants, Dependencies, What we deliberately don't do
- [ ] "What we deliberately don't do" — список из 5-7 пунктов с обоснованием (no multi-tenant yet, no gRPC, no live LLM in default path...)
- [ ] Все упоминания файлов/папок кликабельны (markdown links)
- [ ] `docs/ARCHITECTURE.md` физически **не создан**

**Промпт для Claude Code**:
```
This ticket writes ONLY into TEXTS.md section "docs/ARCHITECTURE.md (T-006)". Do NOT create or edit docs/ARCHITECTURE.md as a physical file — that happens in T-036b (Block 11 assembly).

Find the section "## docs/ARCHITECTURE.md (T-006)" in TEXTS.md. Its `...` code block currently contains `TBD by T-006`. Replace that placeholder with the full content described below. Update STATUS marker from `empty` to `drafted`.

Required sections inside the code block, in this order:

## Layers
A mermaid `flowchart TD` showing: api → application → domain ← infrastructure (infrastructure implements ports defined in application/port). Show that api never imports infrastructure directly. Show that domain has no outgoing dependencies.

## Source layout
A code block with the target directory tree:
```
domain/
  model/         # Aggregates: Campaign, Run, Blocker, Owner
  vo/            # Value objects: Amount, Url, Locale, Severity (branded types)
  service/       # Pure domain services: ReadinessCalculator, BlockerDiff
  event/         # Sealed PreflightEvent discriminated union
  exception/     # PreflightException hierarchy
application/
  command/       # Pure command DTOs
  query/         # Pure query DTOs + view shapes
  usecase/       # Orchestrators that call ports + domain
  port/          # Interfaces for infrastructure: IRunRepository, ITelegramAdapter, IAuditRepository, IEventPublisher
  bus/           # Bus + HandlerRegistry
infrastructure/
  persistence/   # Drizzle/Postgres implementations of repositories
  telegram/      # Telegram bot adapter
  outbox/        # Outbox publisher + worker
  ai/            # Anthropic adapter (existing)
api/
  v1/            # Next.js API route handlers — thin, call Bus
```

For each layer, write 2-3 sentences explaining what it owns and what it does NOT own.

## Data flow
A mermaid `sequenceDiagram` showing the full lifecycle of POST /v1/runs:
api → Bus → RunChecksHandler → loads Campaign via IRunRepository → calls deterministic check engine → builds Blockers → starts transaction → saves Run + writes events to outbox → commits → outbox worker delivers PreflightEvent to subscribers (TelegramAdapter, AuditRepository) → response returned to client with runId

## Key invariants
A bulleted list of 6-8 invariants. Example:
- Domain layer has zero runtime dependencies on anything outside domain/
- Ports are owned by application/, implementations live in infrastructure/
- Commands return Result<T, PreflightException>, queries return T or throw NotFoundException
- All write paths go through repositories; no direct SQL outside infrastructure/persistence
- Events published after DB commit (outbox pattern) — no phantom events on rollback
- Idempotency-Key required for POST /v1/runs; same key returns the same runId
- All API boundaries validated by Zod schemas owned by application/

## Dependencies
Table: Next.js, drizzle-orm, postgres, vitest, zod, @anthropic-ai/sdk, yaml. One-line justification for each.

## What we deliberately don't do
Bulleted list with rationale:
- No multi-tenant / RLS — out of scope for this sprint, can be added by introducing org_id without changing core
- No gRPC — REST + webhooks fit the consumer model (Promo/CRM Ops)
- No live LLM in default checks path — checks must be deterministic and reproducible; AI is an optional augmentation
- No auth — out of scope for demo; production deployment expects auth at infra layer (Cloudflare Access / nginx basic-auth / API gateway)
- No microservices — one process for now; outbox worker is a separate entrypoint of the same binary

Write in clear, direct English. No filler.

After editing, confirm:
- TEXTS.md section "docs/ARCHITECTURE.md (T-006)" STATUS = `drafted`
- `git status docs/ARCHITECTURE.md` shows no changes (file should not exist yet)
- Print the populated section
```

---

## T-007 — docs/API.md в TEXTS.md (1 ч)

**Статус**: [ ]
**Зависимости**: T-006
**Файлы**: `TEXTS.md` секция "docs/API.md (T-007)". **НЕ создавать docs/API.md напрямую** — финальный перенос в T-036b.

**Acceptance criteria**:
- [ ] Перечислены все эндпоинты: `POST /api/v1/runs`, `GET /api/v1/runs/:id`, `GET /api/v1/campaigns`, `GET /api/v1/campaigns/:id`, `GET /api/v1/campaigns/:id/versions`, `GET /api/v1/campaigns/:id/diff?from=&to=`, `GET /api/health`, `GET /api/ready`
- [ ] Для каждого: метод, путь, заголовки (включая Idempotency-Key), request schema (Zod-like), response schema, error codes
- [ ] Один полный пример с `curl` для POST /v1/runs
- [ ] Секция "Error model" — таблица: HTTPStatus / PreflightException class / when it happens
- [ ] Версионирование: путь `/api/v1/...`, политика breaking changes (semver на major)

**Промпт для Claude Code**:
```
This ticket writes ONLY into TEXTS.md section "docs/API.md (T-007)". Do NOT create docs/API.md as a physical file — T-036b handles assembly.

Find the section "## docs/API.md (T-007)" in TEXTS.md. Replace the `TBD by T-007` placeholder with the full content described below. Update STATUS to `drafted`.

Format inside the section: a table-of-contents at the top, then one section per endpoint, then a final "Error model" section and "Versioning" section.

For each endpoint, document:
- Method + path
- Required headers (especially `Idempotency-Key` on POST /v1/runs and `Content-Type: application/json`)
- Request body schema as a TypeScript-style snippet (e.g. `{ campaign: CampaignBundle, options?: { skipChecks?: CheckId[] } }`)
- Successful response: status + body schema
- Error responses: status + body shape
- One real curl example

Endpoints to document:
1. `POST /api/v1/runs` — runs all enabled checks against a campaign bundle, returns runId + verdict
2. `GET /api/v1/runs/:id` — fetches a run with all blockers and result detail
3. `GET /api/v1/campaigns` — lists campaigns (paginated, ?limit&cursor)
4. `GET /api/v1/campaigns/:id` — fetches a campaign with its latest version
5. `GET /api/v1/campaigns/:id/versions` — lists all versions of a campaign
6. `GET /api/v1/campaigns/:id/diff?from=v1&to=v2` — returns blocker diff between two versions
7. `GET /api/health` — liveness, returns `{ status: "ok" }` always (used by docker healthcheck)
8. `GET /api/ready` — readiness, returns `{ status: "ok", checks: { db, migrations } }` only when DB is reachable AND migrations are applied; else 503

For the full curl example on POST /v1/runs, include:
```bash
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @./schemas/fixtures.ts.json | jq
```

Show a redacted but realistic response with: runId, campaignId, verdict ("BLOCK" | "WARN" | "GO"), counts (blockers, warnings, passed), blockers array.

For the Error model section, build a table:
| HTTP status | Exception class            | When it happens                                |
|-------------|----------------------------|------------------------------------------------|
| 400         | InvalidCampaignException   | Zod validation fails on input                  |
| 404         | CampaignNotFoundException  | GET /v1/campaigns/:id with unknown id          |
| 404         | RunNotFoundException       | GET /v1/runs/:id with unknown id               |
| 409         | IdempotencyConflictExc.    | Same Idempotency-Key with different body       |
| 422         | UnprocessableEntityException| Domain rule violation (e.g. zero offer cap)    |
| 500         | PreflightSystemException   | Unexpected internal failure                    |
| 503         | NotReadyException          | DB unreachable or migrations not applied       |

For Versioning section: explain that `/api/v1/` will not have breaking changes; new fields are added with sensible defaults; deprecated fields are documented with `@deprecated` and a sunset date. Major version bump to `/api/v2/` is the only place where breaking changes happen.

Write in clear English. Use markdown tables and code blocks liberally.

Confirm: TEXTS.md section "docs/API.md (T-007)" STATUS=`drafted`. `git status docs/API.md` shows no changes.
```

---

## T-008 — docs/CONFIGURATION.md / ERRORS.md / INTEGRATIONS.md в TEXTS.md (1 ч)

**Статус**: [ ]
**Зависимости**: T-006
**Файлы**: `TEXTS.md` 3 секции: "docs/CONFIGURATION.md (T-008)", "docs/ERRORS.md (T-008)", "docs/INTEGRATIONS.md (T-008 + expanded in T-024)". **НЕ создавать docs/-файлы напрямую** — T-036b делает assembly.

**Acceptance criteria**:
- [ ] `CONFIGURATION.md`: таблица всех env vars с дефолтами и описанием; разделение на required и optional; пример `.env`
- [ ] `ERRORS.md`: дерево классов `PreflightException`, mapping на HTTP-статусы (ссылка на API.md), правила: когда какой бросать
- [ ] `INTEGRATIONS.md`: текущая (Telegram) с пошаговой инструкцией по подключению, и list of future (Slack, Jira, Linear) как roadmap

**Промпт для Claude Code**:
```
This ticket writes ONLY into TEXTS.md three sections (CONFIGURATION, ERRORS, INTEGRATIONS). Do NOT create physical docs/-files — T-036b handles assembly.

Find the three sections in TEXTS.md:
- "## docs/CONFIGURATION.md (T-008)"
- "## docs/ERRORS.md (T-008)"
- "## docs/INTEGRATIONS.md (T-008 + expanded in T-024)"

For each, replace the `TBD` placeholder with the content described below. Update STATUS marker on each from `empty` to `drafted`.

### docs/CONFIGURATION.md (TEXTS.md section)

Section 1: Required environment variables — table with columns: Variable / Description / Example.
- DATABASE_URL (Postgres connection string)
- TELEGRAM_BOT_TOKEN (from @BotFather)
- TELEGRAM_CHAT_ID (target channel/chat id)

Section 2: Optional environment variables — table.
- ANTHROPIC_API_KEY — enables AI augmentation; without it AI features fall back to deterministic-only
- USE_MOCK_AI — `true` to short-circuit AI provider with deterministic stubs
- HTTP_PORT — default 3000
- LOG_LEVEL — default `info`
- PREFLIGHT_MODE — `localStorage` (default UI mode, no backend) or `server` (uses API)
- OUTBOX_POLL_INTERVAL_MS — default 1000

Section 3: Example .env file — full block ready to copy.

Section 4: Per-environment configuration — bullet points explaining differences between local / docker-compose / production deployments.

### docs/ERRORS.md (TEXTS.md section)

Section 1: Exception hierarchy — a tree diagram in code block:
```
PreflightException (abstract)
├── BadRequestException
│   ├── InvalidCampaignException
│   └── UnprocessableEntityException
├── NotFoundException
│   ├── CampaignNotFoundException
│   └── RunNotFoundException
├── ConflictException
│   └── IdempotencyConflictException
├── ForbiddenException
└── SystemException
    └── NotReadyException
```

Section 2: How to throw — code example using `domainRequire(condition, () => new InvalidCampaignException(...))`. Reference to API.md error model table.

Section 3: Rules — bullet list:
- Never throw raw `Error` or `TypeError` for business rule violations
- Domain layer throws only PreflightException subclasses
- Infrastructure can throw external library errors; the adapter wraps them into SystemException at the boundary
- API layer never catches PreflightException — global error handler in middleware does the mapping

Section 4: Adding a new exception — 3-step list.

### docs/INTEGRATIONS.md (TEXTS.md section)

Section 1: Currently supported.
- **Telegram bot** — full step-by-step setup: (1) talk to @BotFather, get token; (2) create a private channel; (3) add bot as admin; (4) get chat_id via curl to getUpdates; (5) put token + chat_id in .env; (6) restart; (7) trigger a test run and verify the message arrived. Include exact curl snippets and what each step's success looks like.

Section 2: Roadmap.
- Slack incoming webhook adapter (`ISlackHandoffAdapter`)
- Jira issue creator adapter
- Linear issue creator adapter
- Discord webhook adapter
- Generic webhook (POST your JSON anywhere)

For each roadmap item, describe in 2 sentences: what it would do, what port it implements, what config it needs.

Section 3: Building your own adapter — bullet list:
- Implement `IHandoffAdapter` from application/port/handoff.ts
- Register it in the DI registry (see infrastructure/registry.ts)
- Set `HANDOFF_ADAPTER=your-adapter-name` in .env
- Done — no core code changes needed

End with a link back to ARCHITECTURE.md for the broader port/adapter pattern.

Confirm: all three TEXTS.md sections STATUS=`drafted`. `git status docs/` shows no new physical files.
```

---

## T-009 — 4 ADR в TEXTS.md (1 ч)

**Статус**: [ ]
**Зависимости**: T-006
**Файлы**: `TEXTS.md` 4 секции: "docs/adr/0001-...", "docs/adr/0002-...", "docs/adr/0003-...", "docs/adr/0004-...". **НЕ создавать физические docs/adr/*.md файлы** — T-036b делает assembly. Index `docs/adr/README.md` тоже создаётся в T-036b на основе содержимого TEXTS.md.

**Acceptance criteria**:
- [ ] Все ADR по шаблону Michael Nygard: Title / Status (Accepted) / Context / Decision / Consequences (positive + negative + neutral)
- [ ] Каждый ADR — 200-350 слов
- [ ] Honest о tradeoffs (явно перечислены негативные последствия)
- [ ] `docs/adr/README.md` — индекс с одной строкой описания на каждый ADR

**Промпт для Claude Code**:
```
This ticket writes ONLY into TEXTS.md 4 ADR sections. Do NOT create physical files in docs/adr/. T-036b builds the actual files and the docs/adr/README.md index.

Find sections in TEXTS.md:
- "## docs/adr/0001-postgres-over-localstorage.md (T-009)"
- "## docs/adr/0002-cqrs-lite-bus.md (T-009)"
- "## docs/adr/0003-deterministic-first-ai-second.md (T-009)"
- "## docs/adr/0004-outbox-pattern-for-events.md (T-009)"

For each: replace `TBD by T-009` placeholder with the full ADR text. Format: Michael Nygard's (Title, Status, Context, Decision, Consequences with positive/negative/neutral sub-bullets). 200-350 words per ADR. Update STATUS=`drafted` on each.

Reference for content (paste these as the basis, then expand):

### docs/adr/README.md
A short index:
```
# Architecture Decision Records

| # | Title | Status | Date |
|---|-------|--------|------|
| [0001](./0001-postgres-over-localstorage.md) | Persist runs in Postgres instead of browser localStorage | Accepted | 2026-05-16 |
| [0002](./0002-cqrs-lite-bus.md) | CQRS-lite with a tiny in-process bus | Accepted | 2026-05-16 |
| [0003](./0003-deterministic-first-ai-second.md) | Deterministic checks run first; AI is augmentation only | Accepted | 2026-05-16 |
| [0004](./0004-outbox-pattern-for-events.md) | Outbox pattern for at-least-once event delivery | Accepted | 2026-05-16 |

Decisions follow [Michael Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).
```

### docs/adr/0001-postgres-over-localstorage.md
Context: Promo Preflight v1 stored everything in browser localStorage. This worked for a single-user demo but broke as soon as the workspace needed: (a) cross-user sharing of campaign runs, (b) audit log for compliance, (c) version history that survives a cleared browser, (d) a backend API consumable by CI/CD pipelines.
Decision: Move all runs, campaigns, versions, and audit log to Postgres. Keep browser localStorage as a legacy fallback for the `localStorage` mode (controlled by `PREFLIGHT_MODE` env var) so the demo still works without infrastructure.
Consequences: positive — durable history, multi-user share, queryable audit log, foundation for multi-tenant later; negative — adds infrastructure dependency (postgres + migrations), more complex local setup; neutral — UI now has two paths and must handle both during the transition.

### docs/adr/0002-cqrs-lite-bus.md
Context: With 8 check modules, 6 endpoints, and an event-driven side-effect layer, request handling was getting tangled in Next.js route handlers. We wanted clear separation of "intent → handler" without dragging in a framework.
Decision: Implement a minimal in-process Bus + HandlerRegistry. Commands return Result<T, PreflightException>. Queries return T or throw NotFoundException. Handlers are registered via `import.meta.glob` on boot. Each handler is one file.
Consequences: positive — adding a new operation = one file + one line; clean separation between API layer (calls bus) and infrastructure (handlers); easy to test; negative — slight learning curve for contributors who haven't seen CQRS; reflection-style handler discovery is one place that can fail silently if a file isn't picked up; neutral — we are NOT using a full CQRS read/write split; same models, just different operations.

### docs/adr/0003-deterministic-first-ai-second.md
Context: Promo compliance checks must be reproducible. A regulator asking "why was this flagged" cannot accept "the LLM said so." Anthropic API rate limits, cost, and latency also make AI a bad fit for the hot path.
Decision: All 8 core checks run deterministically against the YAML rule artifact. AI is an optional second layer that (a) extracts structured campaign data from PDF/text, (b) writes human-readable explanations of blockers, (c) suggests fix drafts. AI never decides verdicts.
Consequences: positive — every run is reproducible; same input always gives same output; cheap and fast; passes audit; negative — AI value is limited to UX polish; rule maintenance falls on humans; neutral — `USE_MOCK_AI=true` lets local dev work without an API key.

### docs/adr/0004-outbox-pattern-for-events.md
Context: When a run completes, we publish PreflightEvents (RunCompleted, BlockerRaised, etc.) for subscribers — Telegram, audit log, future Slack/Jira. Naive approach: publish inside the request handler after the DB commit. Problem: if the publish fails (network, broker down), the events are lost despite the DB state being correct. Worse: if we publish before commit, a rollback creates phantom events.
Decision: Use the transactional outbox pattern. The handler writes events to an `outbox` table within the same transaction as the run insert. A background worker polls the outbox, delivers events to subscribers, marks rows as delivered. At-least-once delivery, idempotent subscribers.
Consequences: positive — no phantom events, no lost events, audit-friendly; negative — small delay (poll interval, default 1s) between commit and delivery; outbox table needs periodic cleanup; neutral — subscribers must be idempotent (event_id deduplication).

Confirm at the end: all 4 ADR sections in TEXTS.md have STATUS=`drafted`. `git status docs/adr/` shows no new physical files.
```

---

## T-009b — ADR-0005 "AI augmentation roadmap" + README sub-section (0.5 ч)

**Статус**: [ ]
**Зависимости**: T-009 (4 базовых ADR должны быть; T-009b — пятый)
**Файлы**: `TEXTS.md` секция `docs/adr/0005-ai-augmentation-roadmap.md` + `TEXTS.md` секция "AI augmentation roadmap" в README
**Recommended model**: Claude Code Pro / Sonnet 4.6 / effort=medium
**Time estimate**: 0.5 ч

**Acceptance criteria**:
- [ ] `docs/adr/0005-...` секция в TEXTS.md заполнена в формате Michael Nygard (Context / Decision / Consequences positive+negative+neutral)
- [ ] 5 AI-augmentations явно перечислены и обоснованы как **planned roadmap**, не done
- [ ] README sub-section заполнена с opening line + 5 bullets + closing line + Romanov verbatim quote
- [ ] Цитата Romanov взята **verbatim** из TEXTS.md "Verbatim quotes" секции (не переписывать)
- [ ] Явная ссылка из README sub-section на ADR-0005 для full reasoning
- [ ] Phrase "AI is the planned augmentation layer on top — never the decision-maker" присутствует в одной из секций (это и есть core message)
- [ ] Owner после полировки меняет статус обеих секций на `polished`

**Промпт для Claude Code**:
```
Read TEXTS.md fully first — especially the existing "docs/adr/0005-ai-augmentation-roadmap.md (T-009b)" section's TBD instructions and the "AI augmentation roadmap" sub-section under README.

Fill both sections following the TBD bullet specs. Constraints:

1. ADR format must match the existing 4 ADRs (0001-0004) in TEXTS.md — Michael Nygard's Context/Decision/Consequences with explicit positive + negative + neutral sub-bullets in Consequences.
2. Use the Romanov verbatim quote that lives in TEXTS.md "Verbatim quotes" section under "Alexander Romanov, Head of White Label 01.tech (Ch.4 closing)". Do NOT paraphrase.
3. README sub-section is ~150 words. Tone: direct, technical, slightly self-aware. No marketing language. No emoji.
4. Position the README sub-section logically after "What we deliberately don't do" and before "Contributing / License / Author".
5. Update both section STATUS markers from `empty` to `drafted`.

After filling, print the diff of TEXTS.md (those two sections only).
```

---

# Block 3 — Слои + Bus + 2 миграции + 3 новых чека (7.5 ч)

> Это то, что Нина увидит, когда откроет дерево папок.

## T-010 — Создать структуру domain/application/infrastructure/api (1 ч)

**Статус**: [ ]
**Зависимости**: ~~T-006~~ — **может стартовать БЕЗ T-006 в marathon-режиме.** Архитектурные инварианты уже зафиксированы в AGENTS.md (раздел "Архитектура v2" + "Ключевые архитектурные инварианты") и EXPLAINER.md часть 5. T-006 (ARCHITECTURE.md) только **документирует** это в формальный doc, не определяет архитектуру. Сначала строим код по AGENTS.md, потом T-006 attest-ит документ к существующему коду.
**Файлы**: новые директории + index файлы

**Acceptance criteria**:
- [ ] Созданы папки: `domain/{model,vo,service,event,exception}`, `application/{command,query,usecase,port,bus}`, `infrastructure/{persistence,telegram,outbox,ai,registry}`, `api/v1/`
- [ ] В каждой папке — index.ts (пустой) и README.md с одной строкой "What lives here"
- [ ] `tsconfig.json` обновлён: добавлены path-аliases `@domain/*`, `@app/*`, `@infra/*`, `@api/*`
- [ ] Существующий `lib/` пока не трогаем — он останется как legacy и будет постепенно мигрирован в T-011

**Промпт для Claude Code**:
```
Create the layered directory structure for Preflight v2. Do NOT move any existing code yet — just create the scaffolding.

Directories to create:
- domain/model/
- domain/vo/
- domain/service/
- domain/event/
- domain/exception/
- application/command/
- application/query/
- application/usecase/
- application/port/
- application/bus/
- infrastructure/persistence/
- infrastructure/telegram/
- infrastructure/outbox/
- infrastructure/ai/
- infrastructure/registry/
- api/v1/

In each directory:
- Create an empty `index.ts`
- Create a `README.md` with exactly one line: `<!-- What lives here: <description> -->` (description from docs/ARCHITECTURE.md)

Update tsconfig.json: add to `compilerOptions.paths`:
```json
"@domain/*": ["./domain/*"],
"@app/*": ["./application/*"],
"@infra/*": ["./infrastructure/*"],
"@api/*": ["./api/*"]
```

Do not delete or modify lib/. Do not move any existing code. After creating, run `npm run typecheck` and confirm it still passes. Print `find domain application infrastructure api -type f` so I can verify the layout.
```

---

## T-011 — Перенести существующие schemas + value objects в domain/ (1 ч)

**Статус**: [ ]
**Зависимости**: T-010
**Файлы**: `domain/vo/`, `domain/model/`, `domain/exception/`, `schemas/` (старое остаётся как re-export)

**Acceptance criteria**:
- [ ] Branded value objects созданы: `Amount`, `Url`, `Locale`, `Severity` (с runtime validation через Zod refinements)
- [ ] `domain/model/Campaign.ts`, `Run.ts`, `Blocker.ts`, `Owner.ts` — определяют доменные сущности (типы и фабричные функции)
- [ ] `domain/exception/PreflightException.ts` — все классы из ERRORS.md
- [ ] `schemas/index.ts` — оставляем как re-export из новых мест, чтобы существующие импорты не сломались
- [ ] `npm run typecheck` зелёный

**Промпт для Claude Code**:
```
Read schemas/index.ts and identify the core types: CampaignBundle, CheckResult, Blocker, ReadinessReport, RuleArtifact, OwnerMatrix, CampaignVersion. We will refactor these into a clean domain layer.

Step 1 — Create domain/vo/ branded types:
- domain/vo/Amount.ts: `export type Amount = number & { readonly __brand: 'Amount' }` plus a constructor `amount(n: number): Amount` that throws `InvalidAmountException` if `n < 0 || !Number.isFinite(n)`.
- domain/vo/Url.ts: branded `Url`, constructor validates via `new URL()`.
- domain/vo/Locale.ts: branded `Locale`, validates against an allowlist of ['en', 'ru', 'de', 'es', ...]. Read the existing locales/ directory to determine the allowlist.
- domain/vo/Severity.ts: literal type `'block' | 'warn' | 'info'` (no branding needed but export from here for centrality).

Step 2 — Create domain/exception/PreflightException.ts:
- abstract class PreflightException extends Error with `code: string` and `httpStatus: number`
- subclasses from docs/ERRORS.md: BadRequestException, InvalidCampaignException, UnprocessableEntityException, NotFoundException, CampaignNotFoundException, RunNotFoundException, ConflictException, IdempotencyConflictException, ForbiddenException, SystemException, NotReadyException
- Export a `domainRequire(condition, () => exception)` helper

Step 3 — Create domain/model/ files for the main entities:
- Campaign.ts — re-export the existing Zod schema from schemas/index.ts AND define a factory `createCampaign(input): Campaign` that throws InvalidCampaignException on invalid input.
- Run.ts — Run entity with id, campaignId, version, verdict, blockers, createdAt, completedAt. Status enum: 'started' | 'completed' | 'failed'.
- Blocker.ts — Blocker entity (ruleId, severity, evidence, suggestion, ownerHint). Likely already exists in schemas/index.ts — wrap it.
- Owner.ts — Owner entity (id, name, role, channel).

Step 4 — Update schemas/index.ts so that the old types are still exported (as re-exports from domain/) and existing code doesn't break.

Step 5 — Run `npm run typecheck`. If it fails, print the errors. If it passes, print the new directory listing.

Do not yet touch lib/checks/ — those handlers will migrate in T-013.
```

---

## T-012 — Implement Bus + HandlerRegistry (1.5 ч)

**Статус**: [ ]
**Зависимости**: T-011
**Файлы**: `application/bus/Bus.ts`, `application/bus/HandlerRegistry.ts`, `application/bus/types.ts`

**Acceptance criteria**:
- [ ] `Bus.dispatch<C extends Command>(command: C): Promise<Result<R, PreflightException>>`
- [ ] `Bus.query<Q extends Query>(query: Q): Promise<R>`
- [ ] Handlers самостоятельно регистрируются через `import.meta.glob` на boot
- [ ] Handler API: `export const handler = { commandType: 'RunChecks', execute: async (cmd, ctx) => ... }`
- [ ] Если хэндлер не найден — `BusException: NoHandlerForCommand`
- [ ] Юнит-тест: реальный мини-handler регистрируется, диспатчится, возвращает результат
- [ ] `npm run typecheck` зелёный

**Промпт для Claude Code**:
```
Implement a minimal in-process CQRS Bus in application/bus/.

### application/bus/types.ts
```typescript
export interface Command<R = unknown> {
  readonly type: string;
  readonly _result?: R; // phantom type for inference
}

export interface Query<R = unknown> {
  readonly type: string;
  readonly _result?: R;
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface HandlerContext {
  // injected per-request: db client, logger, idempotency key, etc.
  // for now empty — extend in T-014
}

export interface CommandHandler<C extends Command<R>, R> {
  readonly commandType: C['type'];
  execute(command: C, ctx: HandlerContext): Promise<Result<R, PreflightException>>;
}

export interface QueryHandler<Q extends Query<R>, R> {
  readonly queryType: Q['type'];
  execute(query: Q, ctx: HandlerContext): Promise<R>;
}
```

### application/bus/HandlerRegistry.ts
Class HandlerRegistry with:
- `register(handler: CommandHandler | QueryHandler)`
- `getCommandHandler(type: string)` → throws if not found
- `getQueryHandler(type: string)` → throws if not found
- `static fromGlob(handlers: Record<string, { handler: CommandHandler | QueryHandler }>)` — populates from `import.meta.glob` result

### application/bus/Bus.ts
Class Bus that wraps a HandlerRegistry:
- `dispatch<C extends Command<R>, R>(command: C, ctx?: HandlerContext): Promise<Result<R, PreflightException>>`
- `query<Q extends Query<R>, R>(q: Q, ctx?: HandlerContext): Promise<R>`
- ctx is optional, defaults to {}
- All exceptions get wrapped as `{ ok: false, error }` for commands; queries propagate.

### application/bus/index.ts
Export Bus, HandlerRegistry, types.

### application/bus/Bus.test.ts (vitest)
- `it('registers a command handler and dispatches')` — registers a fake AddNumbersCommand handler, dispatches, expects ok: true with sum
- `it('returns error when no handler')` — dispatch unknown command type, expects ok: false with NoHandlerException
- `it('queries return T directly')` — register query handler, query, expect result

Skip Block 3.5 if vitest isn't set up yet — write tests as a separate .ts file under application/bus/Bus.test.ts and we'll wire vitest in T-027.

Print Bus.ts, HandlerRegistry.ts, and the test file. Run `npm run typecheck`.
```

---

## T-013 — Migrate 2 checks to handler pattern (1.5 ч)

**Статус**: [ ]
**Зависимости**: T-012
**Файлы**: `infrastructure/handler/checks/RunChecksHandler.ts`, `application/command/RunChecksCommand.ts`, `application/usecase/RunChecksUseCase.ts`

**Acceptance criteria**:
- [ ] `RunChecksCommand` defined in application/command/
- [ ] `RunChecksUseCase` orchestrates: loads campaign → calls deterministic check engine → builds Run aggregate → returns Run
- [ ] `RunChecksHandler` registered via the registry and callable through Bus
- [ ] **2 существующих чека** мигрированы в новый паттерн (формат QA + ссылок QA — самые простые): `infrastructure/checks/FormatQaCheck.ts`, `LinkQaCheck.ts`
- [ ] **2 новых чека** реализованы в новом паттерне (см T-013a, T-013b)
- [ ] Остальные 6 чеков остаются в `lib/checks/` и вызываются из RunChecksUseCase напрямую — это явный TODO с комментарием "migrate in v2.1"
- [ ] Демо-скрипт `scripts/demo-bus.ts` — запускает Bus.dispatch(RunChecksCommand) с offline fixture и печатает результат

**Промпт для Claude Code**:
```
Wire the first command into the Bus to demonstrate the pattern end-to-end.

### application/command/RunChecksCommand.ts
```typescript
import type { Command } from '@app/bus/types';
import type { CampaignBundle } from '@domain/model/Campaign';
import type { Run } from '@domain/model/Run';

export interface RunChecksCommand extends Command<Run> {
  readonly type: 'RunChecks';
  readonly campaign: CampaignBundle;
  readonly options?: { skipChecks?: string[] };
}
```

### application/usecase/RunChecksUseCase.ts
Class that takes the existing offline check runner (from lib/checks/) as a dependency, runs the 8 checks, builds a Run domain object with blockers, and returns it. Do NOT rewrite the 8 check modules — call them via the existing lib/checks/run.ts.

### infrastructure/handler/checks/RunChecksHandler.ts
```typescript
import type { CommandHandler, HandlerContext, Result } from '@app/bus/types';
import type { RunChecksCommand } from '@app/command/RunChecksCommand';
import type { Run } from '@domain/model/Run';
import { RunChecksUseCase } from '@app/usecase/RunChecksUseCase';
import type { PreflightException } from '@domain/exception/PreflightException';

export const handler: CommandHandler<RunChecksCommand, Run> = {
  commandType: 'RunChecks',
  async execute(command, ctx): Promise<Result<Run, PreflightException>> {
    const useCase = new RunChecksUseCase(/* deps */);
    return useCase.run(command.campaign, command.options);
  },
};
```

### Migrate 2 checks as new-pattern reference:
- infrastructure/checks/FormatQaCheck.ts — wraps the existing format QA logic with a clean interface `ICheck { id: string; run(campaign): Promise<Blocker[]> }`
- infrastructure/checks/LinkQaCheck.ts — same pattern

The other 6 checks stay in lib/checks/ for now. Add a TODO comment in RunChecksUseCase: `// TODO(v2.1): migrate remaining 6 checks into infrastructure/checks/`

### scripts/demo-bus.ts
A runnable demo script that:
1. Builds a Bus with HandlerRegistry populated from import.meta.glob('../infrastructure/handler/**/handler.ts')
2. Loads the offline fixture from schemas/fixtures.ts
3. Calls bus.dispatch({ type: 'RunChecks', campaign: fixture })
4. Pretty-prints the Run object

Add npm script: `"demo:bus": "tsx scripts/demo-bus.ts"`. Install `tsx` as a dev dep if not present (`npm i -D tsx`).

Verify it works: `npm run demo:bus` should print a Run with blockers from EX01 fixture. Print stdout.
```

---

## T-013a — Payment Compatibility Check (1 ч)

**Статус**: [ ]
**Зависимости**: T-013
**Файлы**: `infrastructure/checks/PaymentCompatibilityCheck.ts`, `rules/payment-methods-by-region.yaml`, тесты

**Acceptance criteria**:
- [ ] YAML-артефакт `rules/payment-methods-by-region.yaml` со списком: для каждого региона (BR, MX, CO, AR, IN, RU, TR, UK, DE, NG, ZA) — разрешённые / запрещённые / условные payment methods (Pix, UPI, SPEI, USDT/TRC20, BTC, mobile money, SEPA, etc.) с ссылкой на регуляторный источник (даже placeholder если ресерч ещё не пришёл)
- [ ] Чек принимает campaign bundle, для каждой упомянутой в копии payment method проверяет: разрешена ли в target jurisdiction
- [ ] Возвращает blocker если method illegal (e.g. UPI в Индии после SPA cut-off, instant deposits после Circular 1/2025 в Мексике)
- [ ] Возвращает warning если method grey-зона
- [ ] Минимум 5 unit-тестов

**Промпт для Claude Code**:
```
Read RESEARCH-NOTES.md sections 7 and 8 first.

Implement a new check: Payment Compatibility.

### rules/payment-methods-by-region.yaml
A versioned rule artifact with the structure:
```yaml
version: 1
regions:
  BR:
    allowed: [pix, credit_card, debit_card]
    grey: [usdt_trc20, btc]
    forbidden: []
    rule_refs:
      - "Banco Central Pix anti-money-laundering rules (2024)"
      - "PL 4173/2023 crypto regulation"
  IN:
    allowed: [imps, neft, rupay]
    grey: []
    forbidden: [upi, usdt_trc20, btc]
    rule_refs:
      - "Ministry of Finance circular Q3 2024 (UPI Collect ban for gaming merchants)"
      - "Total ban on online real-money gaming, January 2025"
  RU:
    allowed: [usdt_trc20, usdt_erc20, btc, ltc, eth, sbp]
    grey: [credit_card_visa]
    forbidden: []
    rule_refs:
      - "01.tech G GATE Report 2026, Ch.3 — 100% operator crypto adoption"
  AL:
    allowed: []
    grey: []
    forbidden: [usdt_trc20, btc, ltc, eth, any_crypto]
    rule_refs:
      - "Algeria: all virtual currency illegal (Loi 18-13)"
  # add: MX, CO, AR, TR, UK, DE, NG, ZA — fill with placeholder rule_refs where deep research data isn't in yet
```

### infrastructure/checks/PaymentCompatibilityCheck.ts
A class implementing `ICheck`:
- Reads the YAML at startup
- For each payment method extracted from campaign.channels.* copy + campaign.terms (regex or explicit field — start with explicit field `campaign.paymentMethods: string[]`)
- For target jurisdiction (`campaign.targetJurisdiction: string` — add to schema if missing)
- Emit blocker per forbidden method, warning per grey method
- Blocker shape: `{ ruleId: 'payment-compat-001', severity: 'block', evidence: '...', suggestion: 'Replace UPI with IMPS for IN target', ownerHint: 'payments-lead' }`

### Tests
infrastructure/checks/PaymentCompatibilityCheck.test.ts — minimum 5:
- BR campaign mentioning Pix → no blocker
- IN campaign mentioning UPI → BLOCK
- RU campaign mentioning only fiat → WARN (crypto is the operator-standard there)
- AL campaign mentioning any crypto → BLOCK
- Unknown jurisdiction → returns InvalidCampaignException

Print the YAML, the check, the tests, and `npm run test` output.
```

---

## T-013b — Crypto Disclosure Check (0.5 ч)

**Статус**: [ ]
**Зависимости**: T-013a
**Файлы**: `infrastructure/checks/CryptoDisclosureCheck.ts`, тесты

**Acceptance criteria**:
- [ ] Если campaign упоминает крипту в копии → проверяет наличие обязательного disclaimer для targeted jurisdiction
- [ ] Если регион Russia → blocker если нет disclaimer про "цена криптовалюты колеблется" (mandatory под Положения ЦБ)
- [ ] Если регион Algeria → blocker если есть ЛЮБОЕ упоминание крипты
- [ ] Минимум 4 unit-теста

**Промпт для Claude Code**:
```
Read RESEARCH-NOTES.md section 8 first.

Implement infrastructure/checks/CryptoDisclosureCheck.ts.

Logic:
1. Scan campaign.channels.email.body + sms.body + push.body + landingCopy + termsText for mentions of crypto (regex: usdt|btc|bitcoin|crypto|кр[иы]пт|tether|tron|trc20|erc20|stablecoin).
2. If no mentions and target region is RU → emit warning "campaign for RU market does not mention crypto despite 100% operator adoption" (info-level).
3. If mentions present:
   - If target region in [AL, IN] → BLOCK with rule_ref to local regulator
   - If target region in [BR, MX, CO] → check that mandatory disclaimer text appears verbatim (configurable per region in the YAML from T-013a)
   - If target region == RU → check that volatility disclaimer is present in T&C in Russian
4. Use rules/crypto-disclosure-rules.yaml (extend the T-013a YAML or create separate).

Tests (4+):
- RU campaign mentioning USDT with volatility disclaimer in T&C → no blocker
- RU campaign mentioning USDT WITHOUT disclaimer → BLOCK
- AL campaign mentioning BTC → BLOCK
- IN campaign mentioning crypto → BLOCK
- BR campaign mentioning crypto without PL 4173/2023 reference disclaimer → BLOCK

Print the check, tests, and `npm run test` output.
```

---

## T-013c — Jurisdictional Risk Signals (расширение существующего, 1 ч)

**Статус**: [ ]
**Зависимости**: T-013
**Файлы**: `infrastructure/checks/JurisdictionalRiskCheck.ts`, `rules/forbidden-phrases-by-region.yaml`, тесты

**Acceptance criteria**:
- [ ] YAML-артефакт со списком запрещённых фраз / обязательных дисклеймеров per region:
  - UK: запрещены "risk-free", "guaranteed", "no risk"; обязательно "BeGambleAware" + 18+ + UKGC license number
  - Brazil: ограничения на бонусы под SPA/MF #3 — конкретные запрещённые формулировки
  - Russia: обязательно "18+", обязательно "финансовые риски"
  - Spain: обязательно "Juega con responsabilidad" + Jugar Bien link
  - Italy: запрет на celebrities (Dignity Decree)
  - Germany: упоминание лимитов депозита (€1000/мес) обязательно
- [ ] Чек сканирует все каналы (email, sms, push, landing copy) на forbidden phrases и наличие обязательных
- [ ] Минимум 6 unit-тестов

**Промпт для Claude Code**:
```
Read RESEARCH-NOTES.md section 7 first.

Replace / extend the existing "Jurisdictional risk signals" check in lib/checks/ with a new infrastructure/checks/JurisdictionalRiskCheck.ts.

### rules/forbidden-phrases-by-region.yaml
```yaml
version: 1
regions:
  UK:
    forbidden:
      - phrase: "risk-free"
        rule_ref: "UKGC LCCP / CAP advertising guidance"
        severity: block
      - phrase: "guaranteed win"
        rule_ref: "UKGC LCCP"
        severity: block
    mandatory:
      - text: "18+"
        rule_ref: "UKGC LCCP 17.1"
        severity: block
      - text: "BeGambleAware.org"
        rule_ref: "UKGC LCCP — responsible gambling messaging"
        severity: block
  BR:
    forbidden:
      - phrase: "bônus sem condições"
        rule_ref: "SPA/MF #3 — promo restrictions"
        severity: block
    mandatory:
      - text: "18+"
        rule_ref: "Lei 14.790/2023"
        severity: block
      - text: "Jogue com responsabilidade"
        rule_ref: "SPA/MF #3"
        severity: block
  RU:
    forbidden: []
    mandatory:
      - text: "18+"
        rule_ref: "ФЗ-244"
        severity: block
  ES:
    forbidden: []
    mandatory:
      - text: "Juega con responsabilidad"
        rule_ref: "DGOJ Royal Decree 958/2020"
        severity: block
  DE, IT, etc. — placeholder entries with TODO
```

### infrastructure/checks/JurisdictionalRiskCheck.ts
For target jurisdiction:
- Scan all text content for forbidden phrases → BLOCK per match
- Verify each mandatory text appears at least once across the channels → BLOCK if missing
- Case-insensitive matching, with word-boundary regex

Tests (6+):
- UK campaign with "risk-free" → BLOCK
- UK campaign without "18+" anywhere → BLOCK
- BR campaign without "Jogue com responsabilidade" → BLOCK
- RU campaign with all mandatory → no blocker
- ES campaign with "Juega con responsabilidad" → no blocker
- Multi-jurisdiction campaign (targetJurisdiction: [BR, UK]) → applies BOTH rule sets

Print all files and test output.
```

---

## T-013d — UI: targetJurisdiction selector в intake form (1.5 ч)

**Статус**: [ ]
**Зависимости**: T-013a (нужен YAML с regions list)
**Файлы**: `app/intake/...` существующая форма + `components/JurisdictionSelector.tsx` новый + расширение Zod CampaignBundle schema
**Recommended model**: Codex Desktop B / GPT-5.3-Codex / effort=medium
**Time estimate**: 1.5 ч

**Acceptance criteria**:
- [ ] В intake-форме появляется multi-select поле "Target jurisdiction(s)" с регионами из rules/payment-methods-by-region.yaml: BR, MX, CO, AR, IN, RU, TR, UK, DE, ES, IT, NG, ZA, KR, MY
- [ ] Каждый регион — chip-стиль (выбираешь — добавляется), Tailwind кастомные токены (text-accent / bg-accent-muted)
- [ ] Значение сохраняется в campaign.targetJurisdiction: string[] (минимум 1, максимум 3 для одной кампании)
- [ ] Zod CampaignBundleSchema расширен: targetJurisdiction обязательное поле
- [ ] Существующие EX01-EX11 fixtures дополнены targetJurisdiction (по дефолту "UK" или "BR" по контексту)
- [ ] UI не падает на legacy campaign-ах без targetJurisdiction (migration: default "UK")
- [ ] Минимум 2 unit-теста на JurisdictionSelector (selection / deselection / max 3 limit)

**Промпт для Claude Code**:
```
Read RESEARCH-NOTES.md section 13 (11 checks per jurisdiction) and rules/payment-methods-by-region.yaml first.

Add a Target Jurisdiction multi-selector to the campaign intake form.

### Step 1: Extend the Zod schema in schemas/index.ts (or in domain/model/Campaign.ts if T-011 is done):
Add field:
```typescript
targetJurisdiction: z.array(
  z.enum(['BR','MX','CO','AR','IN','RU','TR','UK','DE','ES','IT','NG','ZA','KR','MY'])
).min(1).max(3)
```

Backward compatibility: if existing campaigns don't have this field, default to ['UK'] in a migration utility. Add a TODO comment.

### Step 2: Create components/JurisdictionSelector.tsx:
- Multi-select with chip-style toggle UI
- Uses Tailwind custom tokens (text-accent, bg-accent-muted for active, text-subtle for inactive)
- Region labels (full names): Brazil, Mexico, Colombia, Argentina, India, Russia, Turkey, UK, Germany, Spain, Italy, Nigeria, South Africa, South Korea, Malaysia
- Max 3 selections, show warning if user tries 4th
- Sticky position in form so user always sees their selection while filling other fields
- Aria-labels for accessibility

### Step 3: Wire into app/intake/... existing form:
- Place above the existing offer-math section
- Make required: form won't submit without at least 1 jurisdiction
- Update validation messages

### Step 4: Update fixtures:
- schemas/fixtures.ts, schemas/worked-examples.ts: add targetJurisdiction to EX01-EX11 based on context. Default to ['UK'] except where the example is clearly LATAM/APAC themed.

### Step 5: Update existing checks to use targetJurisdiction:
- The new checks from T-013a/b/c already accept it as input
- Legacy 6 checks in lib/checks/ — leave as-is; they'll receive but ignore the field
- Update lib/checks/ runner to pass targetJurisdiction through

### Tests
- components/JurisdictionSelector.test.tsx: 2-3 tests for selection / deselection / max-3 limit

After implementation, run `npm run dev`, open intake page, confirm selector works, submit a campaign with targetJurisdiction=['BR'], confirm it reaches the API as expected.

Print modified files, test output, screenshot path for owner to add to VISUALS later.
```

---

# Block 4 — Postgres backend + REST API + idempotency (7 ч)

> Это блок, который превращает Preflight из demo в сервис.

## T-014 — Setup Drizzle + миграции (1 ч)

**Статус**: [ ]
**Зависимости**: T-011
**Файлы**: `drizzle.config.ts`, `infrastructure/persistence/schema.ts`, `infrastructure/persistence/migrations/`, `package.json` (scripts)

**Acceptance criteria**:
- [ ] Установлены `drizzle-orm`, `drizzle-kit`, `postgres`
- [ ] `drizzle.config.ts` сконфигурирован
- [ ] Schema в `infrastructure/persistence/schema.ts`: таблицы `campaigns`, `runs`, `blockers`, `versions`, `outbox`, `audit_log`, `idempotency_keys`
- [ ] Первая миграция сгенерирована: `npm run db:generate`
- [ ] Миграция применяется: `npm run db:migrate` (на тестовой Postgres-инстанс)
- [ ] Скрипты в package.json: `db:generate`, `db:migrate`, `db:studio`, `db:reset`

**Промпт для Claude Code**:
```
Set up Drizzle ORM for Postgres.

Install:
```
npm i drizzle-orm postgres
npm i -D drizzle-kit
```

### drizzle.config.ts (project root)
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './infrastructure/persistence/schema.ts',
  out: './infrastructure/persistence/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/preflight',
  },
} satisfies Config;
```

### infrastructure/persistence/schema.ts
Tables (use `pgTable`):

1. **campaigns** — id (uuid pk), name (text), latest_version_id (uuid), created_at, updated_at
2. **versions** — id (uuid pk), campaign_id (fk), version_number (int), bundle (jsonb, the full CampaignBundle), created_at
3. **runs** — id (uuid pk), campaign_id (fk), version_id (fk), verdict (text: 'GO'|'WARN'|'BLOCK'), counts (jsonb), started_at, completed_at, created_by (text, nullable)
4. **blockers** — id (uuid pk), run_id (fk), rule_id (text), severity (text), evidence (jsonb), suggestion (text), owner_hint (text, nullable), resolved (boolean default false), resolved_at (timestamp, nullable)
5. **outbox** — id (uuid pk), event_type (text), payload (jsonb), created_at, delivered_at (nullable), attempts (int default 0), last_error (text nullable)
6. **audit_log** — id (uuid pk), event_type (text), payload (jsonb), actor (text nullable), created_at — append-only, no updates, no deletes
7. **idempotency_keys** — key (text pk), command_type (text), request_hash (text), response_json (jsonb nullable), status (text: 'pending'|'completed'|'failed'), created_at, expires_at (default now + 24h)

Add indices: outbox(delivered_at, created_at), audit_log(created_at), blockers(run_id), runs(campaign_id, started_at), idempotency_keys(expires_at).

### package.json scripts
- `db:generate`: `drizzle-kit generate`
- `db:migrate`: `tsx infrastructure/persistence/migrate.ts`
- `db:studio`: `drizzle-kit studio`
- `db:reset`: `drizzle-kit drop && npm run db:migrate`

### infrastructure/persistence/migrate.ts
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');

const client = postgres(url, { max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder: './infrastructure/persistence/migrations' });
await client.end();
console.log('Migrations applied');
```

### infrastructure/persistence/client.ts
Single shared postgres + drizzle client.

After setup, run `npm run db:generate`. Confirm the migrations directory has SQL files. Print the generated SQL.

Do not run db:migrate (no DB up yet) — that's the user's job locally / docker-compose's job in Block 8.
```

---

## T-015 — IRunRepository + ICampaignRepository (Postgres impl) (2 ч)

**Статус**: [ ]
**Зависимости**: T-014
**Файлы**: `application/port/IRunRepository.ts`, `ICampaignRepository.ts`, `infrastructure/persistence/PgRunRepository.ts`, `PgCampaignRepository.ts`

**Acceptance criteria**:
- [ ] Интерфейсы определены в `application/port/`
- [ ] Postgres-реализации в `infrastructure/persistence/`
- [ ] Все методы возвращают доменные сущности, не Drizzle-rows
- [ ] FK violations превращаются в `CampaignNotFoundException` / `RunNotFoundException`
- [ ] Базовый smoke-тест: создаём campaign, сохраняем run, читаем обратно — оба совпадают

**Промпт для Claude Code**:
```
Implement repository ports and their Postgres adapters.

### application/port/IRunRepository.ts
```typescript
export interface IRunRepository {
  save(run: Run): Promise<Run>;
  findById(id: string): Promise<Run>; // throws RunNotFoundException
  findByCampaign(campaignId: string, limit?: number): Promise<Run[]>;
}
```

### application/port/ICampaignRepository.ts
```typescript
export interface ICampaignRepository {
  saveCampaign(campaign: Campaign): Promise<Campaign>;
  saveVersion(campaignId: string, bundle: CampaignBundle): Promise<{ versionId: string; versionNumber: number }>;
  findById(id: string): Promise<Campaign>; // throws CampaignNotFoundException
  listVersions(campaignId: string): Promise<Version[]>;
  findVersion(campaignId: string, versionNumber: number): Promise<Version>;
  list(limit: number, cursor?: string): Promise<{ items: Campaign[]; nextCursor: string | null }>;
}
```

### infrastructure/persistence/PgRunRepository.ts
Implement using the drizzle client from infrastructure/persistence/client.ts. Map between domain Run and the runs+blockers tables (one Run = one runs row + N blockers rows). Use a transaction when saving (insert run, then bulk-insert blockers).

### infrastructure/persistence/PgCampaignRepository.ts
Same pattern. `saveVersion` increments version_number atomically (use `SELECT MAX(version_number) + 1` inside the transaction with row-level lock OR a sequence per campaign — pick whichever you find cleaner).

### Smoke test scripts/smoke-repo.ts
A script that:
1. Connects to DATABASE_URL (expect docker-compose Postgres up)
2. Creates a campaign
3. Saves a version
4. Creates a Run with 2 blockers
5. Reads back the Run by id
6. Asserts equality on the key fields
7. Prints OK or fails loudly

Add npm script: `"smoke:repo": "tsx scripts/smoke-repo.ts"`.

Print all files. Run `npm run typecheck`.
```

---

## T-016 — POST /api/v1/runs endpoint (1 ч)

**Статус**: [ ]
**Зависимости**: T-013, T-015
**Файлы**: `app/api/v1/runs/route.ts`, `api/v1/handlers/postRun.ts`

**Acceptance criteria**:
- [ ] Endpoint валидирует body через Zod
- [ ] Возвращает 200 с `{ runId, verdict, counts }` на успех
- [ ] Маппит `PreflightException` на HTTP-статусы (через middleware/handler-wrapper)
- [ ] Использует Bus.dispatch(RunChecksCommand)
- [ ] Тест curl-ом возвращает реальный run

**Промпт для Claude Code**:
```
Implement POST /api/v1/runs as a Next.js route handler.

### api/v1/handlers/errorMapping.ts
Central function `mapExceptionToResponse(e: unknown): Response`:
- If e is PreflightException → return NextResponse.json({ error: { code, message } }, { status: e.httpStatus })
- Else → log and return 500 with { error: { code: 'INTERNAL', message: 'Internal error' } }

### app/api/v1/runs/route.ts (Next.js App Router route handler)
```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Bus } from '@app/bus/Bus';
import { CampaignBundleSchema } from '@domain/model/Campaign';
import { mapExceptionToResponse } from '@api/v1/handlers/errorMapping';
import { createBus } from '@infra/registry/bus';

const RequestSchema = z.object({
  campaign: CampaignBundleSchema,
  options: z.object({ skipChecks: z.array(z.string()).optional() }).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_CAMPAIGN', message: parsed.error.message } },
        { status: 400 },
      );
    }
    const bus = createBus();
    const result = await bus.dispatch({
      type: 'RunChecks' as const,
      campaign: parsed.data.campaign,
      options: parsed.data.options,
    });
    if (!result.ok) return mapExceptionToResponse(result.error);
    const run = result.value;
    return NextResponse.json({
      runId: run.id,
      verdict: run.verdict,
      counts: run.counts,
      blockers: run.blockers,
    });
  } catch (e) {
    return mapExceptionToResponse(e);
  }
}
```

### infrastructure/registry/bus.ts
Factory function `createBus()` that:
- Loads handlers via `import.meta.glob('@infra/handler/**/handler.ts', { eager: true })`
- Registers them in a HandlerRegistry
- Returns a Bus wrapping the registry
- Memoize (one bus per process, cached in module scope)

After implementation, run:
```
docker-compose up -d postgres  # or your local pg
npm run db:migrate
npm run dev
# in another terminal:
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"campaign": <inline EX01 fixture>}'
```
Confirm you get a 200 with runId. (Idempotency-Key is not enforced yet — that's T-019.)

Print the response.
```

---

## T-017 — GET /api/v1/runs/:id, GET /api/v1/campaigns endpoints (1 ч)

**Статус**: [ ]
**Зависимости**: T-016
**Файлы**: `app/api/v1/runs/[id]/route.ts`, `app/api/v1/campaigns/route.ts`, `app/api/v1/campaigns/[id]/route.ts`, `application/query/`

**Acceptance criteria**:
- [ ] 3 endpoint-а реализованы через Bus.query
- [ ] Query handlers зарегистрированы
- [ ] 404 на несуществующий id
- [ ] Pagination на /campaigns: ?limit&cursor

**Промпт для Claude Code**:
```
Add three GET endpoints. Mirror the structure from T-016.

For each endpoint:
1. Define a Query in application/query/
2. Define a QueryHandler in infrastructure/handler/
3. Add a Next.js route handler

### Queries
- application/query/FindRunQuery.ts: `{ type: 'FindRun', runId: string }` returns Run (throws RunNotFoundException)
- application/query/FindCampaignQuery.ts: `{ type: 'FindCampaign', campaignId: string }` returns Campaign with latest version inlined
- application/query/ListCampaignsQuery.ts: `{ type: 'ListCampaigns', limit: number, cursor?: string }` returns `{ items: Campaign[], nextCursor: string|null }`

### Routes
- app/api/v1/runs/[id]/route.ts — GET
- app/api/v1/campaigns/route.ts — GET (parses ?limit and ?cursor)
- app/api/v1/campaigns/[id]/route.ts — GET

Use the same mapExceptionToResponse helper. Test each with curl after starting.

Print all files and curl outputs.
```

---

## T-018 — GET /api/v1/campaigns/:id/diff endpoint (1 ч)

**Статус**: [ ]
**Зависимости**: T-017
**Файлы**: `application/query/CampaignDiffQuery.ts`, `application/usecase/VersionDiff.ts`, route handler

**Acceptance criteria**:
- [ ] Endpoint принимает `?from=N&to=M`
- [ ] Возвращает diff: `{ resolved: Blocker[], new: Blocker[], reopened: Blocker[], stillOpen: Blocker[] }`
- [ ] Логика diff-а вынесена в `domain/service/BlockerDiff.ts` (чистая функция, тестируемая)
- [ ] 400 если from >= to

**Промпт для Claude Code**:
```
Implement version diff.

### domain/service/BlockerDiff.ts
Pure function `diffBlockers(fromRun: Run, toRun: Run): BlockerDiff`. The existing lib/versioning.ts has the algorithm — extract it as a pure function in the domain layer, port the types to use the new domain models.

Definitions:
- `resolved`: blockers present in fromRun, NOT in toRun
- `new`: blockers present in toRun, NOT in fromRun
- `reopened`: blockers that were resolved in some intermediate run but appear again in toRun — for simplicity in this sprint, ignore the intermediate runs and define reopened = empty array for now. Add a TODO comment.
- `stillOpen`: blockers present in both fromRun and toRun

Identity of a blocker for diff purposes: `(rule_id, evidence_hash)`. Compute evidence_hash via JSON-stable stringify.

### application/query/CampaignDiffQuery.ts
`{ type: 'CampaignDiff', campaignId: string, from: number, to: number }` returns `BlockerDiff`.

Handler loads two Runs (most recent for each version_number), calls diffBlockers, returns the result.

### Route
app/api/v1/campaigns/[id]/diff/route.ts — parses ?from and ?to as integers, dispatches query.

Validation: from < to, both positive. Bad params → 400.

Test with curl after running two runs against different versions of the same campaign. Print the diff JSON.
```

---

## T-019 — Idempotency-Key middleware (1 ч)

**Статус**: [ ]
**Зависимости**: T-016
**Файлы**: `api/v1/middleware/idempotency.ts`, `application/port/IIdempotencyStore.ts`, `infrastructure/persistence/PgIdempotencyStore.ts`

**Acceptance criteria**:
- [ ] На POST /api/v1/runs обязателен заголовок Idempotency-Key
- [ ] Повторный POST с тем же ключом и **тем же телом** возвращает закэшированный response (тот же runId)
- [ ] Повторный POST с тем же ключом и **разным телом** → 409 IdempotencyConflictException
- [ ] Ключи живут 24 часа, после — TTL очищает (background cleanup можно как cron в T-024)

**Промпт для Claude Code**:
```
Add idempotency to POST /api/v1/runs.

### application/port/IIdempotencyStore.ts
```typescript
export interface IIdempotencyStore {
  // Returns existing entry if the key has been seen, with the matching request hash and response.
  // Throws IdempotencyConflictException if the key exists with a different request hash.
  beginOrGet(key: string, requestHash: string, commandType: string): Promise<
    | { status: 'new' }
    | { status: 'pending' } // request in flight, caller should wait/retry
    | { status: 'completed'; response: unknown }
  >;
  complete(key: string, response: unknown): Promise<void>;
  fail(key: string): Promise<void>;
}
```

### infrastructure/persistence/PgIdempotencyStore.ts
Implements IIdempotencyStore against the idempotency_keys table. Use SELECT FOR UPDATE in a transaction to handle concurrent requests safely.

### api/v1/middleware/idempotency.ts
Wrapper helper `withIdempotency(req, commandType, handler)`:
1. Read `Idempotency-Key` header. If absent → throw BadRequestException("Idempotency-Key required").
2. Compute `requestHash = sha256(canonicalJsonStringify(body))`.
3. Call `store.beginOrGet(key, requestHash, commandType)`.
4. If status==='completed' → return the cached response.
5. If status==='pending' → 409 with retry-after hint.
6. If status==='new' → call the actual handler, then `store.complete(key, response)`. On error: `store.fail(key)`.

Use this in app/api/v1/runs/route.ts.

### Tests
Add scripts/smoke-idempotency.ts that does:
1. POST with key K1 and body B1 → 200, runId R1
2. POST with key K1 and body B1 → 200, runId R1 (same!)
3. POST with key K1 and body B2 → 409
4. POST with key K2 and body B1 → 200, runId R2 (different from R1)

`npm run smoke:idempotency`.

Print the script output (should show all 4 cases passing).
```

---

# Block 5 — Sealed events + outbox + audit log (4 ч)

> Reliability/correctness signals. Backend engineers spot the outbox pattern in 3 seconds.

## T-020 — PreflightEvent discriminated union (0.5 ч)

**Статус**: [ ]
**Зависимости**: T-011
**Файлы**: `domain/event/PreflightEvent.ts`

**Acceptance criteria**:
- [ ] Sealed discriminated union: `RunStarted | BlockerRaised | BlockerResolved | RunCompleted | OwnerOverridden | VersionDiffed`
- [ ] Каждый event имеет `id`, `occurredAt`, `aggregateId`, type-specific payload
- [ ] Helper `assertExhaustive(event: never)` для проверки покрытия в switch
- [ ] Zod-схема для each event (для outbox payload validation)

**Промпт для Claude Code**:
```
Create domain/event/PreflightEvent.ts.

Define a discriminated union:
```typescript
import { z } from 'zod';

export type PreflightEvent =
  | RunStarted
  | BlockerRaised
  | BlockerResolved
  | RunCompleted
  | OwnerOverridden
  | VersionDiffed;

interface BaseEvent {
  readonly id: string;        // event uuid
  readonly occurredAt: string; // ISO timestamp
}

export interface RunStarted extends BaseEvent {
  type: 'RunStarted';
  runId: string;
  campaignId: string;
  versionId: string;
}

export interface BlockerRaised extends BaseEvent {
  type: 'BlockerRaised';
  runId: string;
  ruleId: string;
  severity: 'block' | 'warn' | 'info';
  ownerHint: string | null;
}

export interface BlockerResolved extends BaseEvent {
  type: 'BlockerResolved';
  runId: string;
  ruleId: string;
  resolvedBy: string | null;
}

export interface RunCompleted extends BaseEvent {
  type: 'RunCompleted';
  runId: string;
  verdict: 'GO' | 'WARN' | 'BLOCK';
  counts: { blockers: number; warnings: number; passed: number };
}

export interface OwnerOverridden extends BaseEvent {
  type: 'OwnerOverridden';
  runId: string;
  ruleId: string;
  fromOwner: string | null;
  toOwner: string;
}

export interface VersionDiffed extends BaseEvent {
  type: 'VersionDiffed';
  campaignId: string;
  fromVersion: number;
  toVersion: number;
  counts: { resolved: number; new: number; stillOpen: number };
}

export function assertExhaustive(_: never): never {
  throw new Error('Non-exhaustive PreflightEvent handling');
}

// Zod schemas
export const PreflightEventSchema = z.discriminatedUnion('type', [
  // ... matching schemas
]);
```

Fill in all the Zod schemas.

After creating, write a small example in scripts/event-demo.ts that constructs each event type and prints them. `npm run demo:events`.

Print PreflightEvent.ts and the demo output.
```

---

## T-021 — Outbox table + EventPublisher + writer (1.5 ч)

**Статус**: [ ]
**Зависимости**: T-020, T-014
**Файлы**: `application/port/IEventPublisher.ts`, `infrastructure/outbox/OutboxEventPublisher.ts`, `infrastructure/outbox/OutboxWriter.ts`

**Acceptance criteria**:
- [ ] `IEventPublisher.publish(event: PreflightEvent, tx?: Transaction): Promise<void>`
- [ ] `OutboxEventPublisher` пишет event в таблицу `outbox` в той же транзакции, если tx передана
- [ ] При коммите транзакции event попадает в outbox
- [ ] RunChecksUseCase обновлён: после save(run) → publisher.publish(RunCompleted) внутри той же транзакции
- [ ] Smoke test: POST /api/v1/runs → строка появляется в outbox

**Промпт для Claude Code**:
```
Implement the outbox writer half of the outbox pattern.

### application/port/IEventPublisher.ts
```typescript
import type { PreflightEvent } from '@domain/event/PreflightEvent';
import type { Transaction } from '@infra/persistence/types';

export interface IEventPublisher {
  publish(event: PreflightEvent, tx?: Transaction): Promise<void>;
  publishAll(events: PreflightEvent[], tx?: Transaction): Promise<void>;
}
```

### infrastructure/outbox/OutboxEventPublisher.ts
Implements IEventPublisher by inserting into the outbox table. If tx is provided, uses it; otherwise opens its own transaction. The payload column stores the full event JSON; event_type column stores the discriminator.

### infrastructure/persistence/types.ts
Define `Transaction` type (drizzle's transaction handle). Export so other modules can reference.

### Wire into RunChecksUseCase
Update RunChecksUseCase (created in T-013):
- Inject IRunRepository and IEventPublisher
- After computing the Run, open a transaction, save the Run, publish [RunStarted, ...BlockerRaised, RunCompleted] inside the transaction, commit.

### Smoke test scripts/smoke-outbox.ts
1. Reset DB
2. POST /api/v1/runs with EX01 fixture
3. SELECT * FROM outbox
4. Assert: 1 RunStarted + N BlockerRaised + 1 RunCompleted, all with delivered_at = NULL

`npm run smoke:outbox`. Print results.
```

---

## T-022 — Audit log writer (1 ч)

**Статус**: [ ]
**Зависимости**: T-020, T-014
**Файлы**: `application/port/IAuditRepository.ts`, `infrastructure/persistence/PgAuditRepository.ts`, query handler `GetAuditLogQuery.ts`, endpoint

**Acceptance criteria**:
- [ ] Каждое событие из outbox после delivery → запись в audit_log
- [ ] `GET /api/v1/audit?limit=&type=` — листинг с фильтром
- [ ] append-only: репозиторий не имеет update/delete методов

**Промпт для Claude Code**:
```
Implement audit log.

### application/port/IAuditRepository.ts
```typescript
export interface IAuditRepository {
  append(event: PreflightEvent, actor?: string): Promise<void>;
  list(filter: { eventType?: string; limit: number; cursor?: string }): Promise<{ items: AuditEntry[]; nextCursor: string|null }>;
}
```

Note: no update, no delete methods. Append-only is a contract.

### infrastructure/persistence/PgAuditRepository.ts
Implements via the audit_log table.

### Query
- application/query/ListAuditLogQuery.ts: `{ type: 'ListAuditLog', filter: {...} }` → returns the same shape as the repo's list().

### Route
- app/api/v1/audit/route.ts — GET with ?limit (default 50, max 200) and ?type (filter on event_type)

### Wire into outbox delivery
T-023 will be the worker that delivers outbox events. For now, in this ticket: prepare the audit append call so the worker can use it (export from infrastructure/audit/index.ts).

Smoke test:
1. POST a run
2. (Manually for now, since worker isn't built yet) call IAuditRepository.append(event) for each outbox row
3. GET /api/v1/audit → see entries
`npm run smoke:audit`. Print result.
```

---

## T-023 — Outbox worker (1 ч)

**Статус**: [ ]
**Зависимости**: T-021, T-022, T-024 (Telegram)
**Файлы**: `bin/preflight-worker.ts`, `infrastructure/outbox/OutboxWorker.ts`

**Acceptance criteria**:
- [ ] Worker запускается отдельным процессом: `npm run worker`
- [ ] Полит outbox каждую секунду (`OUTBOX_POLL_INTERVAL_MS`)
- [ ] Для каждого undelivered event: вызывает все зарегистрированные subscribers (TelegramAdapter, AuditRepository)
- [ ] Помечает event как delivered только если ВСЕ subscribers успешны
- [ ] При ошибке: увеличивает attempts, пишет last_error. После 5 attempts — переводит в dead-letter (отдельная таблица или флаг)
- [ ] Worker graceful shutdown на SIGTERM

**Промпт для Claude Code**:
```
Implement the outbox worker.

### infrastructure/outbox/OutboxWorker.ts
Class with:
```typescript
class OutboxWorker {
  constructor(
    private readonly db: DrizzleClient,
    private readonly subscribers: ((event: PreflightEvent) => Promise<void>)[],
    private readonly opts: { pollIntervalMs: number; maxAttempts: number },
  ) {}

  async start(): Promise<void> { /* loop */ }
  async stop(): Promise<void> { /* graceful */ }
}
```

The loop:
1. SELECT FROM outbox WHERE delivered_at IS NULL AND attempts < maxAttempts ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED.
2. For each row: parse payload as PreflightEvent. Call each subscriber. If all succeed, UPDATE outbox SET delivered_at = now() WHERE id = ?. If any fails, UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?.
3. After processing the batch, sleep pollIntervalMs.
4. On SIGTERM: stop the loop, await any in-flight processing, close DB connection.

### bin/preflight-worker.ts
```typescript
#!/usr/bin/env tsx
import { drizzleClient } from '@infra/persistence/client';
import { OutboxWorker } from '@infra/outbox/OutboxWorker';
import { telegramSubscriber } from '@infra/telegram/subscriber';
import { auditSubscriber } from '@infra/audit/subscriber';

const worker = new OutboxWorker(
  drizzleClient,
  [telegramSubscriber, auditSubscriber],
  { pollIntervalMs: Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 1000), maxAttempts: 5 },
);

process.on('SIGTERM', () => worker.stop());
process.on('SIGINT', () => worker.stop());

await worker.start();
```

### npm scripts
- `"worker": "tsx bin/preflight-worker.ts"`

Smoke test scripts/smoke-worker.ts:
1. POST a run (creates outbox rows)
2. Start worker for 5 seconds
3. SELECT FROM outbox — all should have delivered_at != NULL
4. SELECT FROM audit_log — all events should be there
5. (If TELEGRAM_BOT_TOKEN is set) verify the telegram channel got a message — manual check, print "verify telegram channel"

Print the OutboxWorker class and the smoke script.
```

---

# Block 6 — Telegram bot, который реально работает (3 ч)

> Главный визуальный wow. Скриншот → README → done.

## T-024 — Telegram bot setup + adapter (1 ч)

**Статус**: [ ]
**Зависимости**: T-020
**Файлы**: `application/port/IHandoffAdapter.ts`, `infrastructure/telegram/TelegramAdapter.ts`, `infrastructure/telegram/subscriber.ts`

**Acceptance criteria**:
- [ ] `IHandoffAdapter` интерфейс: `notify(event: PreflightEvent): Promise<void>`
- [ ] `TelegramAdapter` использует Telegram Bot API (POST `sendMessage`)
- [ ] Сообщение для `RunCompleted` с verdict=BLOCK — отдельный темплейт с emoji 🚨 и списком блокеров
- [ ] Markdown-разметка с inline-ссылкой на run
- [ ] Если `TELEGRAM_BOT_TOKEN` не выставлен — adapter is a no-op (логирует и идёт дальше)

**Промпт для Claude Code**:
```
Implement the Telegram handoff adapter.

### application/port/IHandoffAdapter.ts
```typescript
import type { PreflightEvent } from '@domain/event/PreflightEvent';

export interface IHandoffAdapter {
  notify(event: PreflightEvent): Promise<void>;
}
```

### infrastructure/telegram/TelegramAdapter.ts
Class TelegramAdapter implements IHandoffAdapter. Constructor takes token and chatId from env. If either is missing, the adapter is a no-op (log warning once, return immediately on every call).

Implement only one event type fully — RunCompleted — and for other types just log "ignored". (We can add per-event handling later; for the demo, RunCompleted is what matters.)

For RunCompleted:
- If verdict === 'GO': single line `✅ Run *{runId}*: all checks passed`
- If verdict === 'WARN': `⚠️ Run *{runId}*: {warnings} warnings, 0 blockers — review before launch.\nView: {url}`
- If verdict === 'BLOCK': `🚨 Run *{runId}* BLOCKED ({blockers} blockers, {warnings} warnings)\n• {top3BlockerSummaries}\nView: {url}`

Use `parse_mode=MarkdownV2`. Escape user-controlled text properly.

### infrastructure/telegram/subscriber.ts
```typescript
import { TelegramAdapter } from './TelegramAdapter';
const adapter = new TelegramAdapter(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID);
export const telegramSubscriber = (event: PreflightEvent) => adapter.notify(event);
```

### Setup guide
Expand the "Currently supported / Telegram bot" sub-section inside **TEXTS.md** section "docs/INTEGRATIONS.md (T-008 + expanded in T-024)". T-008 left a placeholder — flesh it out now with the actual API calls. **Do NOT touch docs/INTEGRATIONS.md as a physical file** — assembly is T-036b.

Steps:
1. Open Telegram, search @BotFather
2. /newbot, give name and username
3. Copy the bot token from BotFather's response
4. Create a private channel for Preflight notifications
5. Add the bot as an admin to the channel (with "Post Messages" permission)
6. To get the chat_id: send any message to the channel, then `curl https://api.telegram.org/bot<TOKEN>/getUpdates` and find the channel chat id (it'll be a negative number like -1001234567890)
7. Put in .env: `TELEGRAM_BOT_TOKEN=...` and `TELEGRAM_CHAT_ID=-100...`
8. Restart the worker
9. Trigger a run with a BLOCK verdict — confirm the message arrives

Print TelegramAdapter.ts. Run `npm run typecheck`.
```

---

## T-025 — Setup user's Telegram bot (15 мин действий user-а) (0.5 ч с проверкой)

**Статус**: [ ]
**Зависимости**: T-024
**Файлы**: `.env.local` (gitignored)

**Acceptance criteria**:
- [ ] У тебя есть бот через @BotFather
- [ ] Канал создан, бот админ
- [ ] `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` записаны в `.env.local`
- [ ] Тестовый curl на `sendMessage` приходит в канал

**Промпт для Claude Code**:
```
This ticket is mostly manual. Follow the Telegram setup guide inside **TEXTS.md section "docs/INTEGRATIONS.md (T-008 + expanded in T-024)"** — NOT the physical docs/INTEGRATIONS.md file. The physical docs file is assembled later in T-036b (Block 11). If T-024 has not yet expanded the Telegram sub-section in TEXTS.md, STOP and resolve dependency first.

When you've added TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env.local, ask me to verify by running this curl:
```
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "'"${TELEGRAM_CHAT_ID}"'", "text": "Preflight test message"}'
```

If the message appears in the channel — done. If not, walk me through the troubleshooting:
- "Forbidden: bot was kicked" → re-add bot to channel as admin
- "Bad Request: chat not found" → check chat_id sign (channels are negative)
- "Forbidden: bot is not a member" → add bot to the channel

After success, I'll confirm and mark the ticket done.
```

---

## T-026 — End-to-end test: campaign with blockers → Telegram message + screenshot for README (1.5 ч)

**Статус**: [ ]
**Зависимости**: T-024, T-025, T-023
**Файлы**: `scripts/demo-e2e.ts` (физический), `docs/assets/telegram-screenshot.png` (физический screenshot — делает owner), `TEXTS.md` секция "How it works (T-003)" (embed-блок). **НЕ редактировать README.md напрямую** — финальная сборка T-036b.

**Acceptance criteria**:
- [ ] Скрипт `npm run demo:e2e` запускает: docker-compose up → migrate → start worker → POST EX08 fixture → ждёт 3 сек → проверяет audit_log
- [ ] Сообщение реально приходит в Telegram канал
- [ ] Скриншот сохраняется в `docs/assets/telegram-screenshot.png` (manual step — owner)
- [ ] В TEXTS.md секция "How it works (T-003)" добавляется HTML embed-блок после mermaid-диаграммы (внутри секционного code block)
- [ ] README.md **не тронут**

**Промпт для Claude Code**:
```
End-to-end demo + screenshot embed. Do NOT touch README.md — only scripts/demo-e2e.ts and TEXTS.md.

### Step 1: scripts/demo-e2e.ts
A runnable script that:
1. Loads .env.local
2. Confirms docker-compose is up (probes /api/health)
3. Sends a POST /api/v1/runs with the EX08 fixture (the one with the most BLOCK blockers — pick the worst one)
4. Polls audit_log every 500ms until all events for that runId appear (or timeout 10s)
5. Prints the runId, the verdict, and how many events landed in audit
6. Prints: "Check your Telegram channel — the message should be there now."

Add `npm run demo:e2e` to package.json.

### Step 2: Screenshot — owner action
After demo:e2e runs and the Telegram message appears, the owner manually screenshots and saves to docs/assets/telegram-screenshot.png. This step is in WEEKEND-CHECKLIST.md, not in your scope.

### Step 3: TEXTS.md embed
Open TEXTS.md, locate section "## How it works (T-003)". Inside its code block, AFTER the second mermaid diagram ("Preflight in your workflow"), add this block:

```markdown
Here's what the Telegram notification looks like in production:

<img src="./docs/assets/telegram-screenshot.png" width="500" />
```

Do NOT touch README.md. Confirm via `git status README.md`.

After completion, run `npm run demo:e2e` end-to-end. Confirm:
- 200 from POST
- Worker delivered events to audit
- Message visible in Telegram (owner's responsibility to look)
- TEXTS.md "How it works" section contains the embed block
- README.md unchanged

Print all artifacts.
```

---

# Block 7 — Тесты на доменный слой (5 ч)

> Параллельно с Block 5-6. Тесты не зависят от Postgres, поэтому могут идти отдельной веткой.

## T-027 — Vitest setup (0.5 ч)

**Статус**: [ ]
**Зависимости**: T-011
**Файлы**: `vitest.config.ts`, `package.json` (scripts)

**Acceptance criteria**:
- [ ] Установлен `vitest` и `@vitest/ui`
- [ ] Config с path-aliases совпадающими с tsconfig
- [ ] `npm run test` запускает все `.test.ts` файлы
- [ ] `npm run test:watch`, `npm run test:ui` работают
- [ ] Бейдж в README обновлён (T-002 имел placeholder)

**Промпт для Claude Code**:
```
Install and configure Vitest.

```
npm i -D vitest @vitest/ui happy-dom
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@domain': resolve(__dirname, './domain'),
      '@app': resolve(__dirname, './application'),
      '@infra': resolve(__dirname, './infrastructure'),
      '@api': resolve(__dirname, './api'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'dist'],
  },
});
```

### package.json scripts
- `"test": "vitest run"`
- `"test:watch": "vitest"`
- `"test:ui": "vitest --ui"`

### Update README badge
Replace the `tests-placeholder-yellow` shield in README with a dynamic one — for now use a static `tests-passing-green` shield. (CI badge in T-034 will give a real one.)

Run `npm run test` — should run zero tests and exit 0. Print the output.
```

---

## T-028 — Tests for ReadinessCalculator + BlockerDiff (1.5 ч)

**Статус**: [ ]
**Зависимости**: T-027, T-018
**Файлы**: `domain/service/ReadinessCalculator.test.ts`, `domain/service/BlockerDiff.test.ts`

**Acceptance criteria**:
- [ ] ≥ 15 тестов на ReadinessCalculator: edge cases (нет блокеров, только warn, only block, mix, missing owners)
- [ ] ≥ 10 тестов на BlockerDiff: identical runs, all resolved, all new, mix, evidence-hash discrimination
- [ ] Названия тестов читаются как спецификация

**Промпт для Claude Code**:
```
Write thorough unit tests for the two key pure functions.

### domain/service/ReadinessCalculator.test.ts
Test that the function correctly produces a verdict and counts. Cases:
- No blockers, no warnings → GO
- Only warnings → WARN
- One BLOCK severity → BLOCK
- Mix of BLOCK + WARN → BLOCK
- Missing owners → BLOCK with synthetic owner-missing blocker (if your readiness logic adds it; if not, test that owners are independently counted)
- Empty input → throws InvalidCampaignException
- Specific rule counts per check category aggregate correctly

Aim for 15+ test cases. Use descriptive test names like:
- `it('returns GO when no blockers and no warnings present')`
- `it('returns BLOCK when at least one rule has severity=block')`
- `it('counts blockers by severity correctly when mixed')`
- `it('aggregates per-check counts into the per-stage breakdown')`

### domain/service/BlockerDiff.test.ts
Cases:
- Two identical runs → resolved=[], new=[], stillOpen=N
- toRun is empty → all resolved
- fromRun is empty → all new
- One rule with different evidence in toRun → that one is both `resolved` (old evidence) AND `new` (new evidence) — confirm both
- Same rule, same evidence — stillOpen
- 10+ blockers in both, partial overlap — counts match expectations

Aim for 10+ tests. Run `npm run test`. Print results showing all passing.
```

---

## T-029 — Tests for value objects (1 ч)

**Статус**: [ ]
**Зависимости**: T-027, T-011
**Файлы**: `domain/vo/*.test.ts`

**Acceptance criteria**:
- [ ] Тесты для Amount: negative throws, NaN throws, Infinity throws, zero ok, positive ok, operators (add/subtract if defined)
- [ ] Тесты для Url: invalid URL throws, valid http/https ok, javascript: throws, mailto: throws
- [ ] Тесты для Locale: allowlist enforcement, case sensitivity, empty string throws

**Промпт для Claude Code**:
```
Write tests for all value objects in domain/vo/.

### domain/vo/Amount.test.ts
- `amount(0)` returns Amount with value 0
- `amount(100)` returns Amount with value 100
- `amount(-1)` throws InvalidAmountException
- `amount(NaN)` throws
- `amount(Infinity)` throws
- `amount(-0)` is acceptable (treated as 0)
- ≥ 8 cases

### domain/vo/Url.test.ts
- `url('https://example.com')` ok
- `url('http://example.com')` ok
- `url('not-a-url')` throws
- `url('javascript:alert(1)')` throws (security)
- `url('mailto:x@y.z')` throws unless we explicitly support it (default: no)
- `url('https://example.com/path?q=1#h')` ok
- ≥ 8 cases

### domain/vo/Locale.test.ts
- `locale('en')`, `locale('ru')` ok
- `locale('xx')` throws (not in allowlist)
- `locale('EN')` — decide: either throws or normalizes. Test for the chosen behavior.
- `locale('')` throws
- ≥ 6 cases

Run `npm run test`. Print results. Total domain tests should now be ~35-40.
```

---

## T-030 — Tests for RunChecksUseCase (2 ч)

**Статус**: [ ]
**Зависимости**: T-027, T-013, T-021
**Файлы**: `application/usecase/RunChecksUseCase.test.ts`

**Acceptance criteria**:
- [ ] Использует mock-implementations портов (IRunRepository, IEventPublisher, ICampaignRepository)
- [ ] Тесты: успешный run с GO verdict / с BLOCK verdict / валидация падает → InvalidCampaignException / репозиторий бросает → SystemException wraps
- [ ] Тест проверяет что **публикуются правильные события** в правильном порядке: RunStarted → BlockerRaised* → RunCompleted
- [ ] Тест проверяет что save и publish — в одной транзакции (mock-tx counts begin/commit calls)
- [ ] ≥ 10 тестов

**Промпт для Claude Code**:
```
Test the RunChecksUseCase orchestration end-to-end with all ports mocked.

### application/usecase/RunChecksUseCase.test.ts

Helpers:
- `createFakeRunRepository()` — in-memory Map, exposes saved runs
- `createFakeEventPublisher()` — collects all published events into an array
- `createFakeCampaignRepository()` — returns canned campaigns

Test cases (≥ 10):
1. Happy path: campaign with no issues → publishes [RunStarted, RunCompleted{verdict: 'GO'}]; one Run saved.
2. Campaign with blockers: publishes [RunStarted, BlockerRaised, BlockerRaised, ..., RunCompleted{verdict: 'BLOCK'}] in order.
3. Verdict is BLOCK if any blocker has severity=block.
4. Verdict is WARN if all blockers are warn-level.
5. Invalid campaign input → throws InvalidCampaignException; nothing saved, nothing published.
6. Repository.save throws → publisher.publish must NOT be called (atomicity).
7. Publisher.publish throws → repository.save still committed? Depends on transaction wiring; test the contract you chose.
8. Idempotent re-run of the same campaign produces equivalent Run (modulo runId/timestamp).
9. skipChecks option excludes the named checks from execution.
10. The Run object returned matches the Run saved (round-trip identity).

Names like:
- `it('publishes RunStarted before any BlockerRaised events')`
- `it('marks the run BLOCK when any blocker severity is block')`
- `it('does not publish events if the save fails')`

Run `npm run test`. Total tests should now be 45-55. Print summary.
```

---

# Block 8 — Docker + healthchecks + CLI (3 ч)

## T-031 — Dockerfile multi-stage (1 ч)

**Статус**: [ ]
**Зависимости**: T-014
**Файлы**: `Dockerfile`, `.dockerignore`

**Acceptance criteria**:
- [ ] Multi-stage: builder (node:20-alpine) → runner (slim image)
- [ ] `next build` в builder stage
- [ ] Production runtime запускает `next start`
- [ ] Размер итогового image < 400MB
- [ ] Образ собирается локально: `docker build -t preflight .`

**Промпт для Claude Code**:
```
Create a production Dockerfile.

### Dockerfile
```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

If next.config.ts doesn't have `output: 'standalone'`, add it.

### .dockerignore
```
node_modules
.next
.git
.env
.env.local
*.log
.DS_Store
*.png
*.jpg
.claude
.agents
.playwright-mcp
docs/assets
screenshots
```

Build locally:
```
docker build -t preflight:dev .
docker images preflight:dev
```

Confirm image size < 400MB. Print docker images output.
```

---

## T-032 — docker-compose.yml + healthchecks (1 ч)

**Статус**: [ ]
**Зависимости**: T-031, T-014, T-023
**Файлы**: `docker-compose.yml`, `app/api/health/route.ts`, `app/api/ready/route.ts`

**Acceptance criteria**:
- [ ] docker-compose: postgres + app + worker, все healthchecked
- [ ] App ждёт postgres healthy перед стартом
- [ ] Worker ждёт app healthy
- [ ] `/api/health` отвечает всегда
- [ ] `/api/ready` 200 только если DB достижима И миграции применены, иначе 503
- [ ] `docker-compose up -d` → через 30 секунд все три контейнера зелёные

**Промпт для Claude Code**:
```
Author the docker-compose + healthcheck endpoints.

### app/api/health/route.ts
```typescript
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

### app/api/ready/route.ts
```typescript
import { NextResponse } from 'next/server';
import { drizzleClient } from '@infra/persistence/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // DB reachable?
    await drizzleClient.execute(sql`SELECT 1`);
    // Migrations applied? Check that 'runs' table exists.
    const { rows } = await drizzleClient.execute(
      sql`SELECT to_regclass('public.runs') AS exists`,
    );
    if (!rows[0]?.exists) {
      return NextResponse.json(
        { status: 'not-ready', reason: 'migrations not applied' },
        { status: 503 },
      );
    }
    return NextResponse.json({ status: 'ok', checks: { db: 'ok', migrations: 'ok' } });
  } catch (e) {
    return NextResponse.json(
      { status: 'not-ready', reason: String(e) },
      { status: 503 },
    );
  }
}
```

### docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: preflight
      POSTGRES_USER: preflight
      POSTGRES_PASSWORD: preflight
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U preflight"]
      interval: 5s
      timeout: 3s
      retries: 5

  migrate:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://preflight:preflight@postgres:5432/preflight
    command: ["npm", "run", "db:migrate"]
    restart: "no"

  app:
    build: .
    depends_on:
      migrate:
        condition: service_completed_successfully
    environment:
      DATABASE_URL: postgres://preflight:preflight@postgres:5432/preflight
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:-}
      TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID:-}
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O - http://localhost:3000/api/ready || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 6
      start_period: 15s

  worker:
    build: .
    depends_on:
      app:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://preflight:preflight@postgres:5432/preflight
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:-}
      TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID:-}
    command: ["npm", "run", "worker"]
    restart: unless-stopped

volumes:
  pgdata:
```

Run:
```
docker-compose up -d
sleep 30
docker-compose ps  # all should be healthy
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready
docker-compose logs app | tail -20
```

Print everything. If anything is unhealthy, debug.
```

---

## T-033 — bin/preflight-check CLI (1 ч)

**Статус**: [ ]
**Зависимости**: T-013
**Файлы**: `bin/preflight-check.ts`, `package.json`

**Acceptance criteria**:
- [ ] CLI читает campaign JSON из stdin или из `--file`
- [ ] Запускает Bus.dispatch локально (без сервера)
- [ ] Выводит JSON с verdict + blockers в stdout
- [ ] Exit code: 0 если GO, 1 если WARN, 2 если BLOCK
- [ ] Можно использовать как step в GitHub Actions / любом CI

**Промпт для Claude Code**:
```
Build a standalone CLI for running checks in CI.

### bin/preflight-check.ts
```typescript
#!/usr/bin/env tsx
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { createBus } from '@infra/registry/bus';
import { CampaignBundleSchema } from '@domain/model/Campaign';

const { values } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    format: { type: 'string', default: 'json' }, // 'json' | 'human'
  },
});

const raw = values.file
  ? await readFile(values.file, 'utf8')
  : await readStdin();

let parsed;
try {
  parsed = CampaignBundleSchema.parse(JSON.parse(raw));
} catch (e) {
  console.error('Invalid campaign JSON:', e);
  process.exit(3);
}

const bus = createBus();
const result = await bus.dispatch({ type: 'RunChecks', campaign: parsed });
if (!result.ok) {
  console.error('Check failed:', result.error.message);
  process.exit(4);
}
const run = result.value;

if (values.format === 'human') {
  console.log(`Verdict: ${run.verdict}`);
  console.log(`Blockers: ${run.counts.blockers}, Warnings: ${run.counts.warnings}`);
  for (const b of run.blockers) {
    console.log(`  [${b.severity}] ${b.ruleId}: ${b.suggestion ?? '(no suggestion)'}`);
  }
} else {
  console.log(JSON.stringify(run, null, 2));
}

process.exit(run.verdict === 'GO' ? 0 : run.verdict === 'WARN' ? 1 : 2);

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
```

### package.json
- Add `"bin": { "preflight-check": "bin/preflight-check.ts" }`
- Add npm script `"check": "tsx bin/preflight-check.ts"`

Test:
```
cat schemas/fixtures/ex08.json | npm run check -- --format human
echo "Exit: $?"
```

Expected: exit code 2 (BLOCK), list of blockers printed.

Document this in README under "Three paths to use" path 2 (npm package).

Print the CLI file and the test output.
```

---

# Block 9 — GitHub Actions CI (1 ч)

## T-034 — GitHub Actions workflow (1 ч)

**Статус**: [ ]
**Зависимости**: T-027, T-031
**Файлы**: `.github/workflows/ci.yml`

**Acceptance criteria**:
- [ ] Workflow на push в main и PR: install → typecheck → lint → tests → docker build
- [ ] Использует Postgres service container для smoke-тестов с миграциями
- [ ] CI бейдж в README обновлён на реальный
- [ ] Зелёный на main

**Промпт для Claude Code**:
```
Create .github/workflows/ci.yml.

```yaml
name: CI

on:
  push:
    branches: [main, claude/**]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: preflight
          POSTGRES_PASSWORD: preflight
          POSTGRES_DB: preflight
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgres://preflight:preflight@localhost:5432/preflight

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run db:migrate
      - run: npm run test

  docker:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - run: docker build -t preflight:ci .
```

### Update README badge
Replace the placeholder CI badge with:
```
[![CI](https://github.com/UlaYuga/promo-preflight/actions/workflows/ci.yml/badge.svg)](https://github.com/UlaYuga/promo-preflight/actions/workflows/ci.yml)
```

Commit and push. After CI run finishes, confirm green. If red, fix the reported issue and push again.
```

---

# Block 10 — Case study (2 ч)

> Один полный walkthrough — самый сильный "real pain" аргумент.
>
> **Важно**: текст case study пишется в **`TEXTS.md` секция `docs/CASE-STUDY.md`**. Готовая основа лежит в `DEEP-RESEARCH.md` §8 — worker берёт оттуда T&C на португальском + 10 блокеров + fix version и адаптирует. Финализация в Block 11.
> **Recommended model**: Claude Code Pro / Sonnet 4.6 / effort=medium (нужен multi-source synthesis)

## T-035 — Case study (Brazilian welcome offer под SPA/MF) в TEXTS.md (1.5 ч)

**Статус**: [ ]
**Зависимости**: T-026, T-013a/b/c, DEEP-RESEARCH.md (получен)
**Файлы**: `TEXTS.md` секция "docs/CASE-STUDY.md (T-035)". **НЕ создавать docs/CASE-STUDY.md напрямую** — физический файл создаёт T-036b (Block 11 assembly).

**Acceptance criteria**:
- [ ] STATUS секции "docs/CASE-STUDY.md (T-035)" в TEXTS.md обновлён с `empty` на `drafted`
- [ ] Сценарий: **"Acme Casino launches a 100% up to R$500 welcome offer for Brazilian market under SPA/MF Q2 2026 regime"**
- [ ] Шаг 1: входная кампания (JSON со специфичными для Бразилии полями: targetJurisdiction='BR', currency='BRL', payment methods, T&C in PT-BR)
- [ ] Шаг 2: запуск проверки (curl + JSON response)
- [ ] Шаг 3: 7-10 блокеров с **реальными ссылками на бразильские нормы**: SPA/MF #3, SPA/MF #1.885/2025, Conar advertising code, Portaria SPA/MF #1.231/2024
- [ ] Шаг 4: "Что произошло бы без Preflight" — со ссылками на реальные инциденты из DEEP-RESEARCH §1 (CONAR vs "vencer é só o começo", Perfect Storm €5M, etc.)
- [ ] Шаг 5: версия N+1 с фиксами → diff показывает resolved
- [ ] Шаг 6: **цитата Станислава (SEO PM 01.tech)** verbatim из TEXTS.md "Verbatim quotes" — про локальные блокировки как #1 риск 2026
- [ ] docs/CASE-STUDY.md как физический файл **не создан**

**Промпт для Claude Code**:
```
This ticket writes ONLY into TEXTS.md section "docs/CASE-STUDY.md (T-035)". Do NOT create docs/CASE-STUDY.md as a physical file — that happens in T-036b (Block 11 assembly).

Read first:
- TEXTS.md section "## docs/CASE-STUDY.md (T-035)" — locate the existing `TBD by T-035` placeholder you will replace
- TEXTS.md "Verbatim quotes — DO NOT EDIT" section (canonical quote bank, includes Stanislav English translation)
- RESEARCH-NOTES.md sections 7 (regulatory changes Brazil), 8 (payment compatibility — pix), 11 (operator brands in Brazil)
- DEEP-RESEARCH.md §1 (real Brazilian enforcement cases — CONAR "vencer é só o começo", etc.) and §8 (ready-made Brazilian walkthrough — use as backbone)

Fill the section's `...` code block with the full case study content described below. Update STATUS marker from `empty` to `drafted`.

Title inside the section: `# Case study: launching a 100% R$500 welcome offer in Brazil under SPA/MF (Q2 2026)`

# Case study: launching a 100% R$500 welcome offer in Brazil under SPA/MF (Q2 2026)

## The setup
Two-paragraph narrative. A fictional operator "Acme Casino" partners with 01.tech White Label for their Brazilian launch. Their CRM team has 4 working days to ship the welcome promo. T&C drafted in PT-BR, channel assets in pt-BR + es-MX (because the parent group also runs Mexican brand), payment methods include Pix (primary), Visa, Mastercard, USDT-TRC20 (for repeat depositors). The launch must comply with: SPA/MF #3 (promo & bonus restrictions), SPA/MF #1.885/2025, MESP #31, Conar advertising code, Pix anti-money-laundering rules, Lei 14.790/2023.

## Step 1 — Campaign bundle as input
Show the EX08-style fixture adapted to Brazil. Specifically include these fields/values that will trigger blockers:
- targetJurisdiction: ["BR"]
- currency: "BRL"
- offer: 100% match up to R$500, wagering 35x
- paymentMethods: ["pix", "visa", "mastercard", "usdt_trc20"]
- channels.email.body includes phrase "ganhe R$500 sem riscos" (deliberately uses "sem riscos" — analogue of UK's "risk-free", which under SPA/MF #3 is prohibited)
- channels.sms.body: 178 characters (over 160 limit)
- terms.text missing "Jogue com responsabilidade" string
- terms.text missing the SPA license number
- crypto mention without PL 4173/2023 disclaimer
- owner.compliance not set
- one UTM with missing utm_source
Show as JSON in a collapsible <details> block. Annotate problem fields with `// ← BLOCK: rule X` comments inline.

## Step 2 — Running Preflight
Show curl command and the full JSON response with verdict: "BLOCK" and counts.

## Step 3 — What Preflight caught (a table)
| # | Check | Rule ref | Severity | What it caught | Fix suggestion |
|---|---|---|---|---|---|
| 1 | JurisdictionalRiskCheck | SPA/MF #3 | block | "sem riscos" phrase in email body | Replace with "ganhe até R$500 em bônus" |
| 2 | JurisdictionalRiskCheck | Lei 14.790/2023 | block | Missing "18+" disclaimer in landing | Add 18+ icon and text |
| 3 | JurisdictionalRiskCheck | SPA/MF #3 | block | Missing "Jogue com responsabilidade" | Add to T&C and landing footer |
| 4 | PaymentCompatibilityCheck | Banco Central + PL 4173 | warn | USDT-TRC20 in payment list — grey for retail promo in BR | Move to "advanced players" section only |
| 5 | CryptoDisclosureCheck | PL 4173/2023 | block | Crypto mentioned without volatility disclaimer | Add "valor de criptomoedas pode flutuar" |
| 6 | FormatQaCheck | SMS provider 160-char limit | block | SMS body 178 chars | Trim or split |
| 7 | LinkQaCheck | UTM standard | warn | Missing utm_source on landing CTA | Set utm_source=email_welcome |
| 8 | LaunchOwnershipCheck | internal RACI | block | compliance owner not assigned | Assign before launch |
| 9 | TermsRobustnessCheck | SPA/MF #3 | block | Max bet during bonus play not disclosed | Add max bet R$10 per spin clause |
| 10 | TermsRobustnessCheck | SPA license rules | block | SPA license number missing from T&C | Add license # in footer |

## Step 4 — What would have happened
Two paragraphs. Reference real Brazilian regulatory actions (use placeholders `[TODO: cite specific SPA/MF enforcement action from research Section 1]` if dip-research not yet pasted). Pattern: "[Operator X] launched a similar offer in Q1 2026 without these checks. The SPA imposed a fine of [Y] and required the campaign to be pulled within 48 hours. The Preflight checks would have caught all 10 blockers in 12 seconds."

## Step 5 — Fix and diff
Show the corrected campaign as a small JSON diff. Then:
```bash
curl http://localhost:3000/api/v1/campaigns/acme-br/diff?from=1&to=2 | jq
```
With response: resolved: 10, new: 0, stillOpen: 0.

## Step 6 — Why this matters in 2026

Quote (paste verbatim, attribute to Станислав, SEO Product Manager 01.tech, G GATE Report 2026 Ch.5.3):
> "Ключевым и очень недооценённым трендом в 2026 году я бы назвал не ИИ или кор-апдейты, а возрастающие локальные блокировки и регуляторное давление в Латинской Америке и Азии."

Translate to English. Frame this as: this case study is the operational pattern that the 01.tech report identifies as the #1 risk of 2026. Preflight makes that risk addressable in your CI pipeline.

## What this took
- Manual review (Brazilian compliance + Conar + Pix + crypto + locale): 8 hours, 4 people
- Preflight: 12 seconds, 0 manual triage steps to verdict
- Iteration after fixes: 8 seconds for v2

End with a link to the live demo and to the [01.tech G GATE Report 2026](link-tbd).

Confirm at end:
- TEXTS.md section "docs/CASE-STUDY.md (T-035)" STATUS = `drafted`
- `git status docs/CASE-STUDY.md` shows no changes (file should not exist)
- All verbatim quotes (Stanislav, CONAR "vencer é só o começo") are pasted directly from TEXTS.md "Verbatim quotes" section — NOT paraphrased
- Print the populated section
```

---

## T-036 — Hero GIF / screenshot для README (1 ч)

**Статус**: [ ]
**Зависимости**: owner manual — генерация в ChatGPT Image по VISUALS §1
**Файлы**: `docs/assets/hero.png` (создаётся owner-ом). Embed-обновление в TEXTS.md секция "Hero block (T-002)" — заменить `<!-- TODO: insert hero from VISUALS §1 -->` на реальный embed.
**Note**: GIF / видео — отдельный открытый вопрос (owner сделает потом если успеет). Базовый таргет — статический PNG из ChatGPT Image.

**Acceptance criteria**:
- [ ] Файл `docs/assets/hero.png` существует (owner положил)
- [ ] Файл оптимизирован (< 500KB)
- [ ] В TEXTS.md секция "Hero block (T-002)" placeholder `<!-- TODO: insert hero from VISUALS §1 -->` заменён на `<p align="center"><img src="./docs/assets/hero.png" alt="Preflight in action" width="800" /></p>`
- [ ] README.md **не тронут**

**Промпт для Claude Code**:
```
This is a small ticket: owner has generated docs/assets/hero.png via ChatGPT Image (per VISUALS.md §1). Your job: verify file exists, then update the TEXTS.md hero placeholder.

Step 1: `ls -la docs/assets/hero.png` — file must exist. If not, STOP and tell owner "VISUALS §1 not generated yet; please run ChatGPT Image with the prompt from VISUALS.md §1 and save the result to docs/assets/hero.png before this ticket can complete."

Step 2: Check file size with `ls -la docs/assets/hero.png`. If > 500KB, compress with pngquant or similar.

Step 3: Open TEXTS.md, find section "## Hero block (T-002)". Locate the line `<!-- TODO: insert hero from VISUALS §1 -->`. Replace it with:

```html
<p align="center">
  <img src="./docs/assets/hero.png" alt="Preflight in action" width="800" />
</p>
```

Step 4: Confirm:
- `git status README.md` shows no changes (README untouched)
- TEXTS.md "Hero block (T-002)" no longer contains the TODO marker
- Print the diff
```

---

# Block 11 — Финальная полировка + перенос TEXTS → финальные файлы (2 ч)

> Этот блок собирает всё воедино. Тексты из TEXTS.md (статус `polished` — owner-полированные) переносятся в финальные `README.md` / `docs/*` / `docs/adr/*`. Картинки из VISUALS.md (готовые в `docs/assets/`) встраиваются по ссылкам. Затем — финальный smoke + commit history audit.
>
> **Recommended model**: Координатор-чат сам (Codex Desktop A / GPT-5.5 / medium)

## T-036b — Перенос TEXTS.md → финальные файлы (1 ч)

**Статус**: [ ]
**Зависимости**: все тикеты Block 1, 2, 10 завершены **И** owner отметил статус `polished` на всех секциях в TEXTS.md
**Файлы**: финальные `README.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/CONFIGURATION.md`, `docs/ERRORS.md`, `docs/INTEGRATIONS.md`, `docs/CASE-STUDY.md`, `docs/adr/0001..0004.md`
**Recommended model**: Координатор-чат сам (Codex Desktop A) — это просто перенос текста, не reasoning

**Acceptance criteria**:
- [ ] Все секции в TEXTS.md имеют статус `polished` или `shipped` (если есть `drafted` — стоп, вернуть owner-у)
- [ ] Каждая секция перенесена в соответствующий финальный файл
- [ ] Mermaid-блоки сохранили синтаксис (тестируется рендеринг на github.com)
- [ ] Все плейсхолдеры `<!-- TODO: ... -->` либо заполнены, либо явно помечены как "v2.1 follow-up"
- [ ] Verbatim quotes сохранены **без изменений** (особенно регуляторные)
- [ ] Ссылки на VISUALS файлы корректны и файлы реально существуют в docs/assets/
- [ ] После переноса статус секций TEXTS.md обновлён → `shipped`
- [ ] Один conventional commit: `[T-036b] docs: assemble final README + docs/ from TEXTS`

**Промпт**:
```
Read TEXTS.md fully. For every section with status `polished` or `shipped`:

1. Identify target file (README.md / docs/ARCHITECTURE.md / docs/adr/0001-..md / etc.) — names are in the section headings.
2. Copy the content verbatim into target file. Preserve markdown structure, mermaid blocks, tables.
3. Replace `<!-- TODO: insert hero from VISUALS §1 -->` style markers with actual image embeds if `docs/assets/<file>` exists (verify each with `ls`). If missing, leave the marker and add to a "Known TODOs" list at the end of the run.
4. After copying, update TEXTS.md section status → `shipped`.
5. Do not modify content during copy — owner did the polish, you preserve.

Sections with status `empty` or `drafted` → STOP. Report which sections aren't ready. Owner must polish them first.

After all sections copied:
- Run `npm run typecheck && npm run lint` — must be green
- Print a summary: how many sections shipped, which files were created/updated, any remaining TODOs
- Single conventional commit: `[T-036b] docs: assemble final README + docs/ from TEXTS`
```

---

## T-037 — Commit history audit (0.5 ч)

**Статус**: [ ]
**Зависимости**: все предыдущие
**Файлы**: git history

**Acceptance criteria**:
- [ ] Все commits следуют conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`
- [ ] Каждый коммит привязан к ticket id в скобках: `[T-016] feat: POST /api/v1/runs endpoint`
- [ ] Нет коммитов вида "wip", "asdf", "fix typo" (interactive rebase squash где надо)
- [ ] Чистая линейная история main → claude/serene-mayer-697d54

**Промпт для Claude Code**:
```
Audit git history. Run:
```
git log --oneline main..HEAD
```

For any commit that:
- Has a non-conventional prefix
- Lacks a ticket id in the message
- Is a wip/typo/squash candidate

— rebase to fix (interactive rebase). DO NOT amend commits that have been pushed to main. Only rebase the local feature branch.

After cleanup, print the new `git log --oneline main..HEAD`. There should be ~30-40 clean commits.

If you find any commit you're not sure about, ASK before rebasing.
```

---

## T-038 — Final README pass + smoke test (0.5 ч)

**Статус**: [ ]
**Зависимости**: все предыдущие
**Файлы**: `README.md`

**Acceptance criteria**:
- [ ] Все ссылки в README кликабельны (run a markdown linkcheck or scan manually)
- [ ] Все упомянутые npm scripts существуют в package.json
- [ ] `docker-compose up -d && curl http://localhost:3000/api/health` работает с свежего клона
- [ ] Все скриншоты на месте
- [ ] Никаких "TODO" или "[TODO]" placeholder-ов в README не осталось

**Промпт для Claude Code**:
```
Final pre-flight check (pun intended). Do all of these:

1. Read README.md top to bottom. Note any:
   - Broken links (use `find . -name "*.md" -exec grep -l "TODO\\|todo\\|placeholder" {} \\;`)
   - References to files that don't exist (use `grep -oE '\\(\\./[^)]+\\)' README.md | sort -u` and verify each)
   - Inconsistent project naming
   - Inconsistent code block syntax
   
2. Run from a clean simulated state:
   ```
   rm -rf node_modules .next
   npm ci
   npm run typecheck
   npm run lint
   npm run test
   docker-compose down -v
   docker-compose up -d
   sleep 30
   curl -f http://localhost:3000/api/health
   curl -f http://localhost:3000/api/ready
   ```

3. If ANY step fails, fix it before declaring done.

4. Print a final summary of:
   - Total commits on the branch
   - Total tests run + pass count
   - Final docker-compose ps output
   - First 50 lines of README

When everything is green, this ticket is done. Time to ship.
```

---

# Что делать, если время поджимает

Сжатый порядок дропа (от менее важного к более — дропаем сверху вниз):

1. **T-037** (commit history audit) — нет идеальной истории = ничего страшного, Нина смотрит код, не git log
2. **T-009** — оставить только 2 ADR (0001 Postgres + 0004 outbox) вместо 4
3. **T-008** — INTEGRATIONS.md и ERRORS.md упростить до 5 строк каждый
4. **T-018** (version diff endpoint) — не критично для wow, оставить только саму pure-функцию в domain/service/
5. **T-029** (value object tests) — оставить только Url.test.ts (10 кейсов), Amount и Locale пропустить
6. **T-022** (audit log endpoint) — таблицу создать, endpoint не делать
7. **T-034** (CI) — workflow сделать но не дожидаться зелёного

Не дропаем никогда (это сердце):
- T-001, T-002, T-003 (README)
- T-006 (ARCHITECTURE.md)
- T-010, T-011, T-012, T-013 (Layers + Bus)
- T-014, T-015, T-016 (Postgres + POST endpoint)
- T-021, T-023 (outbox + worker)
- T-024, T-025, T-026 (Telegram demo с скриншотом)
- T-027, T-028, T-030 (тесты)
- T-031, T-032 (Docker)
- T-035 (case study)

---

# Финальный чеклист "что увидит Нина"

После выполнения 32+ тикетов из 40, на главной странице репо Нина видит:

- [ ] Hero-блок с tagline + 5 бейджами (зелёные)
- [ ] GIF Preflight в действии
- [ ] Скриншот реального Telegram сообщения
- [ ] "The problem" с конкретикой
- [ ] mermaid sequenceDiagram "How it works"
- [ ] Quick start с одним `docker-compose up`
- [ ] Ссылка на docs/ARCHITECTURE.md
- [ ] Ссылка на docs/adr/ — 4 ADR в стиле Nygard
- [ ] Ссылка на docs/CASE-STUDY.md с walkthrough

В коде:
- [ ] Чистая структура domain/application/infrastructure/api
- [ ] Bus + HandlerRegistry с `import.meta.glob` registration
- [ ] Sealed PreflightEvent + outbox pattern
- [ ] Idempotency-Key middleware
- [ ] 45+ vitest тестов на доменный слой
- [ ] healthcheck + readiness endpoints
- [ ] docker-compose с healthchecks
- [ ] GitHub Actions CI green
- [ ] **3 новых jurisdiction-aware чека** (payment compat, crypto disclosure, jurisdictional risk signals)
- [ ] **YAML rule artifacts** per jurisdiction (payment-methods-by-region.yaml, forbidden-phrases-by-region.yaml)
- [ ] **Реальные цитаты сотрудников 01.tech** в README и case study (Станислав SEO PM, Виктория BDM, Романов Head of WL)

Этого хватит. Поехали.
