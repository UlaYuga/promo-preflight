# Promo Preflight — REST API

All endpoints are prefixed `/api`. The versioned path is `/api/v1/...`.

## Authentication

Every endpoint under `/api/v1/*` requires:

```http
Authorization: Bearer <PREFLIGHT_API_KEY>
```

Configure the server-side key through `PREFLIGHT_API_KEY`. If it is unset or the bearer value is missing or invalid, the versioned API returns `401 UNAUTHORIZED`; it never falls back to public access. Liveness and readiness probes (`/api/health` and `/api/ready`) are intentionally public.

## Table of contents

1. [POST /api/v1/runs](#1-post-apiv1runs)
2. [GET /api/v1/runs/:id](#2-get-apiv1runsid)
3. [GET /api/v1/campaigns](#3-get-apiv1campaigns)
4. [GET /api/v1/campaigns/:id](#4-get-apiv1campaignsid)
5. [GET /api/v1/campaigns/:id/versions](#5-get-apiv1campaignsidversions)
6. [GET /api/v1/campaigns/:id/diff](#6-get-apiv1campaignsiddiff)
7. [GET /api/v1/audit](#7-get-apiv1audit)
8. [GET /api/v1/stats](#8-get-apiv1stats)
9. [GET /api/health](#9-get-apihealth)
10. [GET /api/ready](#10-get-apiready)
11. [Error model](#error-model)
12. [Versioning policy](#versioning-policy)

---

## 1. POST /api/v1/runs

Runs the mandatory API check pipeline against a campaign bundle. Idempotent — submitting the same `Idempotency-Key` twice returns the same result.

**Headers**

| Header | Required | Description |
|---|---|---|
| `Authorization` | yes | `Bearer <PREFLIGHT_API_KEY>` |
| `Content-Type` | yes | `application/json` |
| `Idempotency-Key` | yes | Client-generated UUID (for example, `$(uuidgen)`). Same key + same body → same `runId`. Same key + different body → 409. |

**Request body** — `{ campaign: CampaignBundle, options?: Record<string, never> }`

The `campaign` field matches [`CampaignBundleSchema`](../schemas/index.ts) exactly:

```ts
{
  campaign: {
    metadata: {
      campaignName: string          // max 120 chars
      operatorLabel?: string        // max 80 chars
      promoType: "welcome" | "reload" | "freebet" | "cashback"
                | "tournament" | "loyalty" | "reactivation"
      geo: string                   // e.g. "MGA generic", "Brazil SPA/MF"
      locale: string                // e.g. "pt-BR", "en-GB"
      currency: string              // ISO 4217, e.g. "BRL", "EUR"
      launchDate?: string           // ISO 8601 date
      channelsIncluded: Array<"email" | "push" | "onsite" | "landing" | "sms" | "in_app">
    }
    offer: {
      minDeposit?: number
      bonusAmount?: number
      bonusPercentage?: number
      maxBonus?: number
      wageringRequirement?: string  // e.g. "35x bonus" (string, not a multiplier number)
      maxCashout?: number
      maxBet?: number
      eligibleGames?: string
      contribution?: string
      cooldown?: string
      eligibilityRules?: string
    }
    assets: Array<{
      channel: "email" | "push" | "onsite" | "landing" | "sms" | "in_app"
      fieldName: string             // e.g. "subject", "body", "headline"
      text: string                  // max 20 000 chars
      softLimit?: number
      hardLimit?: number
    }>
    links: Array<{
      label: string                 // e.g. "CTA", "T&C"
      url: string
      expectedDomain?: string
      requiresUtm?: boolean         // default true
    }>
    owners: Array<{
      role: "product" | "crm" | "legal" | "risk" | "localization" | "analytics"
      name?: string
      status?: "pending" | "approved" | "blocked" | "not_required"  // default "pending"
      dueDate?: string
      notes?: string
    }>
    termsText: string               // full T&C text, max 50 000 chars (required)
    notes?: string
    // Jurisdiction-aware fields added by Block 3:
    targetJurisdiction?: string[]   // e.g. ["UK", "BR"] — use "UK", not "GB"
    paymentMethods?: string[]       // e.g. ["PIX", "VISA", "USDT"]
  }
  options?: {}                      // reserved; no supported client settings
}
```

Every API run executes all eight core offline checks: `channel_consistency`, `terms_robustness`, `offer_math_sanity`, `jurisdictional_risk_signals`, `localization_qa`, `launch_ownership`, `link_qa`, and `format_qa`.

The API pipeline additionally executes mandatory policy checks for payment compatibility (`payment_compat`), crypto disclosure (`crypto_disclosure`), and jurisdictional risk (`jurisdictional_risk`). The API `format_qa` and `link_qa` wrappers overlap with the core pipeline; identical findings are de-duplicated in the run result. Clients cannot exclude mandatory checks. Unknown members in `options` are rejected with `400 BAD_REQUEST`.

The complete JSON request body must not exceed `MAX_INPUT_CHARS` characters (default `50000`). Larger requests return `413 PAYLOAD_TOO_LARGE` before checks run or data is written.

**Response — 200 OK**

```ts
{
  runId: string                   // UUID
  campaignId?: string             // UUID; present when a campaign was found-or-created
  campaignVersion?: number        // 1-based version number for this run
  verdict: "GO" | "WARN" | "BLOCK"
  status: string                  // e.g. "completed"
  counts: {
    block: number
    warn: number
    info: number
  }
  blockers: Array<{
    ruleId: string                // e.g. "terms_robustness.TERMS_ROBUSTNESS-002"
    severity: "block" | "warn" | "info"
    evidence: string              // semicolon-joined "field: snippet" pairs
    suggestion: string
    ownerHint?: string            // e.g. "legal", "risk"
  }>
  createdAt: string               // ISO 8601
  completedAt?: string            // ISO 8601
}
```

**curl example**

```bash
# Export the sample bundle from schemas/fixtures.ts to JSON first, then POST it:
export PREFLIGHT_API_KEY='replace-with-the-key-configured-on-the-server'
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Authorization: Bearer $PREFLIGHT_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "campaign": {
      "metadata": {
        "campaignName": "BR Welcome Q2 2026",
        "promoType": "welcome",
        "geo": "Brazil SPA/MF",
        "locale": "pt-BR",
        "currency": "BRL",
        "channelsIncluded": ["email", "push"]
      },
      "offer": {
        "bonusPercentage": 100,
        "maxBonus": 500,
        "wageringRequirement": "35x bonus",
        "maxBet": 5
      },
      "assets": [
        { "channel": "email", "fieldName": "subject", "text": "Bônus de boas-vindas: 100% até R$500" }
      ],
      "links": [{ "label": "CTA", "url": "https://example.com/promo?utm_source=email", "requiresUtm": true }],
      "owners": [{ "role": "legal", "status": "pending" }],
      "termsText": "Wagering: 35x. Max cashout: R$1000. Max bet durante bônus: R$5.",
      "targetJurisdiction": ["BR"]
    }
  }' | jq
```

**Example response**

```json
{
  "runId": "2a099960-d864-4d93-954f-1886bd5e980c",
  "campaignId": "631f7c66-f803-4302-85f7-956634e5f40d",
  "campaignVersion": 5,
  "verdict": "BLOCK",
  "status": "completed",
  "counts": { "block": 2, "warn": 2, "info": 0 },
  "blockers": [
    {
      "ruleId": "terms_robustness.TERMS_ROBUSTNESS-002",
      "severity": "block",
      "evidence": "termsText: 100% welcome bonus up to 200 EUR. 30x wagering on bonus.…",
      "suggestion": "Add the missing required clauses to the terms before launch.",
      "ownerHint": "legal"
    },
    {
      "ruleId": "format_qa.FORMAT_QA-001",
      "severity": "warn",
      "evidence": "email.subject: 95 chars > 60-char soft limit",
      "suggestion": "Shorten subject to fit the soft limit.",
      "ownerHint": "crm"
    }
  ],
  "createdAt": "2026-05-17T20:48:00.000Z",
  "completedAt": "2026-05-17T20:48:00.100Z"
}
```

---

## 2. GET /api/v1/runs/:id

Fetches a run with all blockers and full result detail.

**Path params**: `id` — UUID from `POST /api/v1/runs` response. Non-UUID ids return `404`.

**Response — 200 OK**: same shape as the `POST` response.

**Errors**: `404 RunNotFoundException` if `id` is unknown or not a UUID.

---

## 3. GET /api/v1/campaigns

Lists campaigns, newest first.

**Response — 200 OK**

```ts
{
  campaigns: Array<{
    id: string                          // UUID
    campaignName: string
    operatorLabel: string | null
    promoType: string
    geo: string
    locale: string
    currency: string
    launchDate: string | null           // ISO 8601 date
    createdAt: string                   // ISO 8601
  }>
}
```

---

## 4. GET /api/v1/campaigns/:id

Fetches a single campaign by id. Non-UUID ids return `404`.

**Response — 200 OK**

```ts
{
  campaign: {
    id: string
    campaignName: string
    operatorLabel: string | null
    promoType: string
    geo: string
    locale: string
    currency: string
    launchDate: string | null
    createdAt: string
  }
}
```

**Errors**: `404 CampaignNotFoundException`.

---

## 5. GET /api/v1/campaigns/:id/versions

Lists all saved versions of a campaign, newest first. Versions are created when `POST /api/v1/runs` is called for a campaign.

**Response — 200 OK**

```ts
{
  campaignId: string
  versions: Array<{
    id: string                          // version UUID
    campaignId: string
    n: number                           // 1-based version number
    createdAt: string                   // ISO 8601
    blockers: Blocker[]                 // same blocker shape as POST /runs response
    readinessState: string              // e.g. "BLOCKED", "READY"
  }>
}
```

**Errors**: `404 CampaignNotFoundException` if the campaign id is unknown or not a UUID.

---

## 6. GET /api/v1/campaigns/:id/diff

Returns the blocker diff between two campaign versions — which blockers were added, resolved, or unchanged.

**Query params**: `from` and `to` — positive integers matching the `n` field returned by `GET /campaigns/:id/versions`. Both required.

**Response — 200 OK**

```ts
{
  campaignId: string
  from: number
  to: number
  diff: {
    added: Blocker[]       // new blockers in `to` not present in `from`
    resolved: Blocker[]    // blockers present in `from` but gone in `to`
    unchanged: Blocker[]   // blockers present in both
  }
}
```

**Errors**:
- `400` if `from` or `to` is missing or not a positive integer.
- `404 CampaignNotFoundException` if the campaign id is unknown.
- `404` if either version number does not exist for the campaign.

---

## 7. GET /api/v1/audit

Lists append-only audit events delivered by the outbox worker. The endpoint is queryable by event type and cursor, and is the same feed shown in `/app/status`.

**Query params**

| Param | Required | Description |
|---|---|---|
| `limit` | no | Integer `1..200`; defaults to `50`. |
| `type` | no | One event type, e.g. `RunStarted`, `BlockerRaised`, `RunCompleted`. |
| `cursor` | no | Opaque cursor returned as `nextCursor` from the previous response. |

**Response — 200 OK**

```ts
{
  items: Array<{
    id: string
    eventType: "RunStarted" | "BlockerRaised" | "RunCompleted"
    payload: PreflightEvent
    actor: string | null
    createdAt: string
  }>
  nextCursor: string | null
}
```

**Errors**:
- `400` if `limit`, `type`, or `cursor` is invalid.

---

## 8. GET /api/v1/stats

Returns aggregate run telemetry for the System Status dashboard.

**Response — 200 OK**

```ts
{
  totalRuns: number
  totalEvents: number
  lastEventAt: string | null
  runP95LatencyMs: number | null
}
```

`runP95LatencyMs` is computed from completed runs using Postgres `percentile_cont(0.95)` over `completed_at - created_at`.

---

## 9. GET /api/health

Liveness probe. Used by Docker `HEALTHCHECK` and uptime monitors.

Always returns `200` as long as the process is running.

**Response — 200 OK**

```json
{ "status": "ok" }
```

---

## 10. GET /api/ready

Readiness probe. Returns `200` only when the database is reachable **and** all migrations have been applied. Returns `503` otherwise.

**Response — 200 OK**

```json
{
  "status": "ok",
  "checks": {
    "env": "ok",
    "db": "ok",
    "migrations": "ok"
  }
}
```

**Response — 503 Service Unavailable**

```json
{
  "status": "not-ready",
  "checks": {
    "env": "ok",
    "db": "error",
    "migrations": "pending"
  }
}
```

---

## Error model

All error responses share this flat shape:

```ts
{
  error: string         // machine-readable code, e.g. "CAMPAIGN_NOT_FOUND", "BAD_REQUEST"
  message: string       // human-readable; for 400 validation errors, the Zod issues are stringified into the message
}
```

| HTTP status | Exception class | When it happens |
|---|---|---|
| 400 | `BAD_REQUEST` | Request body validation fails or `Idempotency-Key` is not a UUID |
| 401 | `UNAUTHORIZED` | Missing or invalid `Authorization: Bearer <PREFLIGHT_API_KEY>` on `/api/v1/*`, including when the server key is unset |
| 413 | `PAYLOAD_TOO_LARGE` | `POST /api/v1/runs` body exceeds `MAX_INPUT_CHARS` |
| 404 | `CampaignNotFoundException` | `GET /api/v1/campaigns/:id` — unknown id |
| 404 | `RunNotFoundException` | `GET /api/v1/runs/:id` — unknown id |
| 409 | `IdempotencyConflictException` | Same `Idempotency-Key` submitted with a different request body |
| 422 | `UnprocessableEntityException` | Domain rule violation (e.g. `bonusAmount` = 0, `wageringRequirement` < 1) |
| 500 | `PreflightSystemException` | Unexpected internal failure |
| 503 | `NotReadyException` | DB unreachable or migrations not applied (readiness endpoint only) |

---

## Versioning policy

- The path prefix `/api/v1/` will not have breaking changes. New optional fields may be added to request and response bodies at any time; clients must be tolerant of unknown fields.
- Deprecated fields are marked with a `@deprecated` annotation in schema comments and carry a sunset date in the changelog.
- Breaking changes (field removal, type change, behaviour change) are introduced only under a new major version path `/api/v2/`. The v1 path remains available until its documented sunset date.
- The `Idempotency-Key` contract is stable across minor versions.
