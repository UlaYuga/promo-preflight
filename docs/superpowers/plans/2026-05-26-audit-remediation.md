# Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the active audit findings in independently reviewable changes: trusted rate limiting, truthful command palette behavior, deliberate locale-selection behavior, and dependency hygiene.

**Architecture:** Keep each fix narrowly scoped and independently releasable. The security fix changes only the request identity used by the existing best-effort in-memory limiter; the UI fixes remove behavior the product does not implement instead of inventing a cross-page command protocol. The dead language gate is removed by default because the header language toggle is already the supported interaction.

**Tech Stack:** Next.js 16 proxy, React 19, TypeScript strict mode, Vitest, EN/RU JSON locale dictionaries, Railway public networking.

---

## Coordinator Scope

### Active Remediation Queue

| ID | Severity | Workstream | Status | Delivery Unit |
| --- | --- | --- | --- | --- |
| SEC-01 | High | Do not trust client-controlled `X-Forwarded-For` for rate limiting | Completed | `fcc0132` |
| UI-01 | High | Remove inert command palette actions/results | Completed | `eaad225` |
| UI-02 | Medium | Correct command palette footer translation paths | Completed with UI-01 | `eaad225` |
| UI-03 | Medium | Remove unreachable first-visit language gate | Completed | `8a28f8b` |
| DEP-01 | Low | Clear moderate `npm audit` advisory without broad upgrades | Completed | `4443ea6` |

### Removed From Incident Scope

`/.opencode.json` contains an expired Refero credential. Because the credential is already invalid, this plan does not require revocation, secret-history rewriting, or release blocking. Optional repository hygiene is to remove the tracked local connector config in a separate cleanup change; it is not part of the active defect queue.

### Coordination Rule

Implemented in queue order. `SEC-01` is isolated. `UI-01` and `UI-02` landed together because one runtime browser check covers both defects. `UI-03` followed the approved removal decision. `DEP-01` stayed last so lockfile changes did not obscure behavioral diffs.

---

## Decision: Language Selection

**Accepted decision (2026-05-26):** Remove `LanguageGate` and its locale strings. The application already exposes `LanguageToggle` on the public welcome screen and in the workspace header, and the gate is unreachable in current behavior.

**Out of scope:** Restoring a mandatory first-visit modal. If that behavior is needed later, implement it as a separate feature with storage semantics, hydration behavior, focus management, keyboard accessibility, and browser coverage in both languages.

---

### Task 1: Trust Railway Client IP For Rate Limiting (`SEC-01`)

**Files:**
- Modify: `proxy.ts:18-29`
- Modify: `proxy.test.ts:48-64`
- Modify: `docs/CONFIGURATION.md`

**Rationale:** Railway Public Networking documents `X-Real-IP` as the request header identifying the client's remote IP. The current code prefers the first caller-provided `X-Forwarded-For` value, allowing requests to rotate the rate-limit bucket.

**Source:** <https://docs.railway.com/networking/public-networking/specs-and-limits>

- [x] **Step 1: Add the failing spoofing regression test**

Add the following test beside the existing throttle test in `proxy.test.ts`:

```ts
  it('does not allow rotating x-forwarded-for to bypass a client limit', () => {
    const request = (forwardedFor: string) =>
      proxy(
        new NextRequest('http://localhost/api/v1/audit', {
          headers: {
            authorization: 'Bearer wrong-rate-limited-key',
            'x-real-ip': 'railway-client-address',
            'x-forwarded-for': forwardedFor,
          },
        })
      );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect(request(`forged-${attempt}`)).toHaveProperty('status', 401);
    }

    expect(request('forged-after-limit').status).toBe(429);
  });
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- proxy.test.ts
```

Expected before implementation: the new test fails because every rotated `x-forwarded-for` creates a new bucket and the last response remains `401`, not `429`.

- [x] **Step 3: Make the request identity explicit and use the trusted header**

Replace the current header selection in `proxy.ts` with a small helper so the security assumption is visible and testable:

```ts
function getRateLimitClientIp(request: NextRequest): string {
  // Railway Public Networking sets X-Real-IP to the client's remote IP.
  // Do not use X-Forwarded-For for enforcement; callers can supply it.
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = getRateLimitClientIp(request);
  const result = checkRateLimit(ip, WINDOW_SECONDS, MAX_REQUESTS);
```

Do not change the limiter storage model in this task. It remains a per-process safeguard as currently designed.

- [x] **Step 4: Document the deployment assumption**

Add a short note to `docs/CONFIGURATION.md` near `RATE_LIMIT_*`:

```md
On Railway public networking, application rate limiting keys requests by the
platform-provided `X-Real-IP` header. Do not change enforcement to use incoming
`X-Forwarded-For`; callers can spoof that header. The in-memory limiter is
process-local and should be replaced by shared infrastructure before scaling
the protected API across multiple instances.
```

- [x] **Step 5: Verify GREEN and the route boundary**

Run:

```bash
npm test -- proxy.test.ts
npm run typecheck
npm run lint
```

Expected: the new spoofing regression and existing bearer-auth/rate-limit tests pass; typecheck and lint exit `0`.

- [x] **Step 6: Commit only the security fix**

```bash
git add proxy.ts proxy.test.ts docs/CONFIGURATION.md
git commit -m "fix: trust Railway client address for API rate limiting"
```

**Acceptance criteria:**
- Rotating `X-Forwarded-For` while retaining one `X-Real-IP` reaches `429` on request 21.
- Existing protected API auth behavior remains unchanged.
- The process-local limitation is documented and not presented as multi-instance protection.

---

### Task 2: Make The Command Palette Truthful (`UI-01`, `UI-02`)

**Files:**
- Modify: `components/command-palette.tsx:5-95, 186-190`
- Modify: `locales/en.json:875-893`
- Modify: `locales/ru.json:875-893`
- Create: `components/command-palette.test.ts`

**Rationale:** The current palette exposes save/export/example entries that close the modal without performing the advertised operation. Its `Run check` entry only opens intake, check names remain English under RU, and it requests `palette.move/open/stats`, although dictionaries define `palette.footer.move/open/stats`. The minimal reliable fix is to expose only supported navigation/search entries and label navigation truthfully; wiring global actions is a future feature, not a bugfix requirement.

- [x] **Step 1: Write a failing source-contract regression test**

Create `components/command-palette.test.ts` using the repository's existing source-contract testing style:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('command palette supported behavior', () => {
  it('does not advertise commands that have no implementation', () => {
    const source = readSource('components/command-palette.tsx');

    expect(source).toContain('palette.actions.openIntake');
    expect(source).not.toContain('palette.actions.run');
    expect(source).not.toContain('palette.actions.save');
    expect(source).not.toContain('palette.actions.exportMd');
    expect(source).not.toContain('palette.actions.exportSlack');
    expect(source).not.toContain('WORKED_EXAMPLES');
  });

  it('uses the defined footer translations', () => {
    const source = readSource('components/command-palette.tsx');

    expect(source).toContain('palette.footer.move');
    expect(source).toContain('palette.footer.open');
    expect(source).toContain('palette.footer.stats');
    expect(source).not.toContain('t("palette.move"');
    expect(source).not.toContain('t("palette.open"');
    expect(source).not.toContain('t("palette.stats"');
  });

  it('uses localized check labels', () => {
    const source = readSource('components/command-palette.tsx');

    expect(source).toContain('language === "ru" ? c.nameRu : c.nameEn');
  });
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- components/command-palette.test.ts
```

Expected before implementation: assertions fail for misleading/no-op command entries, `WORKED_EXAMPLES`, localized check labels, and wrong footer key paths.

- [x] **Step 3: Remove the unsupported palette entries**

In `components/command-palette.tsx`, remove `WORKED_EXAMPLES` from the import and remove these four entry categories from `base`:

```ts
      {
        kind: t("palette.action" as TranslationKey),
        label: t("palette.actions.save" as TranslationKey),
        hint: "⌘S",
        action: onClose
      },
      {
        kind: t("palette.action" as TranslationKey),
        label: t("palette.actions.exportMd" as TranslationKey),
        hint: "E M",
        action: onClose
      },
      {
        kind: t("palette.action" as TranslationKey),
        label: t("palette.actions.exportSlack" as TranslationKey),
        hint: "E S",
        action: onClose
      },
      ...WORKED_EXAMPLES.map(/* no-op result entries */),
```

Keep the navigation entries and check-result route entries because they navigate to a concrete screen. Replace the misleading intake action entry with:

```ts
      {
        kind: t("palette.action" as TranslationKey),
        label: t("palette.actions.openIntake" as TranslationKey),
        hint: "G I",
        action: () => { router.push("/app/intake"); onClose(); }
      },
```

- [x] **Step 4: Correct localized labels and footer paths**

Destructure the current language and render check names for that locale:

```ts
const { language, t } = useI18n();

label: language === "ru" ? c.nameRu : c.nameEn,
```

In both locale files, replace unused/misleading command labels with the single supported action:

```json
"actions": {
  "openIntake": "Open campaign bundle"
}
```

```json
"actions": {
  "openIntake": "Открыть пакет кампании"
}
```

Change the footer reads to:

```tsx
<span>{t("palette.footer.move")} ...</span>
<span>{t("palette.footer.open")} ...</span>
<span className="ml-auto font-mono">{t("palette.footer.stats")}</span>
```

Do not use `||` fallback with typed locale keys here; missing keys should be caught rather than visibly printed.

- [x] **Step 5: Verify GREEN and inspect the real UI in both locales**

Run:

```bash
npm test -- components/command-palette.test.ts
npm run i18n:check
npm run typecheck
npm run lint
npm run dev
```

Browser checks:

1. Open `/app/risk-report`, open the palette, and confirm no save/export/example commands are shown.
2. Confirm `Open campaign bundle` routes to `/app/intake`; switch to RU and confirm `Открыть пакет кампании` does the same.
3. Confirm footer and check labels render actual EN text, switch to RU, reopen the palette, and confirm actual RU text.

- [x] **Step 6: Commit the UI behavior fix**

```bash
git add components/command-palette.tsx components/command-palette.test.ts locales/en.json locales/ru.json
git commit -m "fix: remove inert command palette actions"
```

**Acceptance criteria:**
- No visible palette entry merely closes the palette while advertising an action.
- No palette item claims to run a check when it only opens intake.
- Footer has no raw `palette.*` key strings in EN or RU.
- Check result names reflect the selected UI locale.
- Real save and export controls remain available on Risk Report.

**Execution follow-up:** Adding regression coverage increased the verified suite from `202` to `207` tests across `37` files. Commit `f842a65` updates visible EN/RU evidence and palette statistics so the UI does not publish stale counts.

---

### Task 3: Remove Unreachable Language Gate (`UI-03`)

**Decision:** Approved on 2026-05-26: remove the unreachable gate; do not restore a modal in this remediation.

**Files:**
- Modify: `lib/i18n/index.tsx:33-93, 131-185`
- Modify: `lib/i18n/check.mjs`
- Modify: `locales/en.json:33-39`
- Modify: `locales/ru.json:33-39`
- Create: `lib/i18n/index.test.ts`

- [x] **Step 1: Write a failing dead-UI contract test**

Create `lib/i18n/index.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('locale selection surface', () => {
  it('uses the header toggle without retaining an unreachable gate', () => {
    const source = readSource('lib/i18n/index.tsx');

    expect(source).toContain('export function LanguageToggle');
    expect(source).not.toContain('languageSelected');
    expect(source).not.toContain('LanguageGate');
  });
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- lib/i18n/index.test.ts
```

Expected before implementation: failure because `languageSelected` and `LanguageGate` exist.

- [x] **Step 3: Remove the unreachable state and component**

In `lib/i18n/index.tsx`:

1. Remove `languageSelected` from `I18nContextValue`.
2. Remove the `languageSelected` state and both `setLanguageSelected(true)` calls.
3. Change context construction to:

```ts
  const value = useMemo(
    () => ({ language, setLanguage, t, get }),
    [get, language, setLanguage, t]
  );
```

4. Render only children under the provider:

```tsx
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
```

5. Delete the `LanguageGate` component.

- [x] **Step 4: Remove dead locale content**

Delete the `languageGate` object from both `locales/en.json` and `locales/ru.json`. Keep `languageToggle` intact.

- [x] **Step 5: Verify GREEN and locale switching**

Run:

```bash
npm test -- lib/i18n/index.test.ts
npm run i18n:check
npm run typecheck
npm run lint
npm run dev
```

Browser checks:

1. Open `/` in a fresh tab with no language storage value and confirm the page is usable immediately.
2. Switch EN to RU and back using the header toggle.
3. Refresh after selecting RU and confirm RU remains selected.

- [x] **Step 6: Commit the dead UI removal**

```bash
git add lib/i18n/index.tsx lib/i18n/index.test.ts locales/en.json locales/ru.json
git commit -m "fix: remove unreachable language selection gate"
```

**Acceptance criteria:**
- There is no dead gate state or dead translated UI.
- Header language switching and persisted locale selection still work.
- No new Cyrillic spacing/wrapping regression is visible on the checked workspace screen.

---

### Task 4: Clear The Moderate Dependency Advisory (`DEP-01`)

**Files:**
- Modify as required: `package-lock.json`
- Modify only if npm changes a direct range: `package.json`

- [x] **Step 1: Record the baseline advisory**

Run:

```bash
npm audit --audit-level=moderate
npm ls brace-expansion
```

Expected before remediation: one moderate advisory for the transitive `brace-expansion` path under ESLint/TypeScript tooling.

- [x] **Step 2: Apply the narrow automated fix**

Run:

```bash
npm audit fix --package-lock-only
git diff -- package.json package-lock.json
```

Reject the result and reassess if it changes unrelated direct dependencies or introduces a major-version migration. This task must remain a lockfile-level tooling update if possible.

- [x] **Step 3: Verify audit and full project gates**

Run:

```bash
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm test
npm run build
npm run schema:check
npm run rules:check
npm run owners:check
npm run i18n:check
npm run checks:mock
npm run checks:run
npm run versioning:check
npm run ai:check
```

If `DATABASE_URL` is available, also run:

```bash
npm run db:check
```

Expected: audit reports zero moderate/high/critical advisories; all available gates exit `0`.

- [x] **Step 4: Commit dependency hygiene separately**

```bash
git add package-lock.json package.json
git commit -m "chore: update vulnerable transitive tooling dependency"
```

**Acceptance criteria:**
- No moderate-or-higher npm advisory remains.
- No behavioral source change is hidden in the lockfile update.
- Full non-database verification remains green; DB verification is reported explicitly if configuration is unavailable.

---

## Final Verification Checkpoint

After all accepted tasks have landed on one branch:

- [x] Run `npm run lint`.
- [x] Run `npm run typecheck`.
- [x] Run `npm test` (`203` passed, `4` skipped; `207` total).
- [x] Run `npm run build`.
- [x] Run `npm run schema:check && npm run rules:check && npm run owners:check && npm run i18n:check`.
- [x] Run `npm run checks:mock && npm run checks:run && npm run versioning:check && npm run ai:check`.
- [x] Run `npm audit --audit-level=moderate` (0 vulnerabilities).
- [ ] Run `npm run db:check` only with a reachable configured `DATABASE_URL`. Skipped: `DATABASE_URL` is not set in the current shell.
- [x] Browser-check `/app/risk-report` command palette in EN and RU, including updated `207` test proof.
- [x] Browser-check persisted language toggle behavior after the `UI-03` decision is implemented.
- [x] Review production diffs for unrelated changes before merge.

## Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Railway header behavior is assumed incorrectly | Security fix ineffective or overly throttling | Ground `X-Real-IP` use in Railway documentation and retain spoofing regression test |
| Process-local rate limiter is mistaken for distributed protection | Multiple replicas weaken rate limit | Document scope now; create a separate shared-limiter task before horizontal scale |
| Removing palette entries is viewed as feature loss | Reduced shortcut surface | Preserve actual Risk Report controls; reintroduce commands only with real workflows and tests |
| Language modal was an undocumented product requirement | Removing it changes onboarding intent | Removal explicitly approved on 2026-05-26 before Task 3 |
| Audit fix expands into dependency migration | Review noise or regressions | Keep it as last, separate PR; reject broad lockfile changes |

## Coordinator Status

```md
### Status
| ID | Owner/PR | State | Evidence | Blocker |
| --- | --- | --- | --- | --- |
| SEC-01 | `fcc0132` | Complete | Spoofing regression reaches `429`; Railway `X-Real-IP` assumption documented | none |
| UI-01/UI-02 | `eaad225` | Complete | Contract tests and EN/RU runtime palette checks | none |
| UI-03 | `8a28f8b` | Complete | Dead gate removed; toggle persists after refresh | none |
| DEP-01 | `4443ea6` | Complete | `brace-expansion@5.0.6`; audit reports 0 vulnerabilities | none |
| COPY-01 | `f842a65` | Complete | Visible proof counts aligned to `207` tests in `37` files | none |
```
