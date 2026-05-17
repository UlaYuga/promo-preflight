# Promo Preflight — REST API

All endpoints are prefixed `/api`. The versioned path is `/api/v1/...`.

## Table of contents

1. [POST /api/v1/runs](#1-post-apiv1runs)
2. [GET /api/v1/runs/:id](#2-get-apiv1runsid)
3. [GET /api/v1/campaigns](#3-get-apiv1campaigns)
4. [GET /api/v1/campaigns/:id](#4-get-apiv1campaignsid)
5. [GET /api/v1/campaigns/:id/versions](#5-get-apiv1campaignsidversions)
6. [GET /api/v1/campaigns/:id/diff](#6-get-apiv1campaignsiddiff)
7. [GET /api/health](#7-get-apihealth)
8. [GET /api/ready](#8-get-apiready)
9. [Error model](#error-model)
10. [Versioning policy](#versioning-policy)

---

## 1. POST /api/v1/runs

Runs all enabled checks against a campaign bundle. Idempotent — submitting the same `Idempotency-Key` twice returns the same result.

**Headers**

| Header | Required | Description |
|---|---|---|
| `Content-Type` | yes | `application/json` |
| `Idempotency-Key` | yes | Client-generated UUID. Same key + same body → same `runId`. Same key + different body → 409. |

**Request body** — `{ campaign: CampaignBundle, options?: RunOptions }`

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
  options?: {
    skipChecks?: string[]           // check IDs to skip, e.g. ["mobile-first-format"]
  }
}
```

**Response — 200 OK**

```ts
{
  runId: string                   // UUID
  campaignId: string
  verdict: "GO" | "WARN" | "BLOCK"
  counts: {
    blockers: number
    warnings: number
    passed: number
  }
  blockers: Array<{
    checkId: string
    severity: "BLOCK" | "WARN"
    ruleId: string
    message: string
    ownerHint?: string
  }>
  createdAt: string               // ISO 8601
}
```

**curl example**

```bash
# Export the sample bundle from schemas/fixtures.ts to JSON first, then POST it:
curl -X POST http://localhost:3000/api/v1/runs \
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
  "runId": "018f4b2c-1234-7abc-9def-000000000001",
  "campaignId": "camp_br_welcome_q2_2026",
  "verdict": "BLOCK",
  "counts": { "blockers": 3, "warnings": 2, "passed": 6 },
  "blockers": [
    {
      "checkId": "jurisdictional-tc-completeness",
      "severity": "BLOCK",
      "ruleId": "BR-SPA-LICENSE-REQUIRED",
      "message": "T&C for BR must include the SPA/MF license number (Portaria SPA/MF #1231/2024)",
      "ownerHint": "legal"
    },
    {
      "checkId": "jurisdictional-risk-signals",
      "severity": "BLOCK",
      "ruleId": "BR-FORBIDDEN-PHRASE-GARANTIDO",
      "message": "Phrase 'bônus garantido' found in pt-BR copy — prohibited by CONAR 2024 ruling",
      "ownerHint": "compliance"
    },
    {
      "checkId": "payment-compatibility",
      "severity": "BLOCK",
      "ruleId": "IN-UPI-GAMING-BLOCKED",
      "message": "UPI listed as payment method for IN — NPCI blocked UPI Collect for gaming since Q3 2022",
      "ownerHint": "payments"
    }
  ],
  "createdAt": "2026-05-16T09:14:00.000Z"
}
```

---

## 2. GET /api/v1/runs/:id

Fetches a run with all blockers and full result detail.

**Path params**: `id` — UUID from `POST /api/v1/runs` response.

**Response — 200 OK**: same shape as the `POST` response, plus `campaignVersion` field.

**Errors**: `404 RunNotFoundException` if `id` is unknown.

---

## 3. GET /api/v1/campaigns

Lists campaigns, newest first. Paginated.

**Query params**

| Param | Default | Description |
|---|---|---|
| `limit` | 20 | Max items per page (1–100) |
| `cursor` | — | Opaque cursor from previous response's `nextCursor` field |

**Response — 200 OK**

```ts
{
  items: Array<{
    id: string
    name: string
    geo: string
    targetJurisdiction: string[]       // v2 planned; empty array until v2 field is wired
    latestVerdict: "GO" | "WARN" | "BLOCK" | null
    updatedAt: string
  }>
  nextCursor: string | null
}
```

---

## 4. GET /api/v1/campaigns/:id

Fetches a campaign with its latest version and most recent run summary.

**Response — 200 OK**: campaign object with `latestRun` nested.

**Errors**: `404 CampaignNotFoundException`.

---

## 5. GET /api/v1/campaigns/:id/versions

Lists all saved versions of a campaign, newest first.

**Response — 200 OK**

```ts
{
  items: Array<{
    version: string          // e.g. "v3"
    runId: string
    verdict: "GO" | "WARN" | "BLOCK"
    createdAt: string
  }>
}
```

---

## 6. GET /api/v1/campaigns/:id/diff

Returns the blocker diff between two run versions — which blockers were introduced, resolved, or unchanged.

**Query params**: `from` (version string, e.g. `v1`) and `to` (version string, e.g. `v3`). Both required.

**Response — 200 OK**

```ts
{
  campaignId: string
  from: string
  to: string
  introduced: Blocker[]    // new blockers in `to` not present in `from`
  resolved: Blocker[]      // blockers present in `from` but gone in `to`
  unchanged: Blocker[]     // blockers present in both
}
```

---

## 7. GET /api/health

Liveness probe. Used by Docker `HEALTHCHECK` and uptime monitors.

Always returns `200` as long as the process is running.

**Response — 200 OK**

```json
{ "status": "ok" }
```

---

## 8. GET /api/ready

Readiness probe. Returns `200` only when the database is reachable **and** all migrations have been applied. Returns `503` otherwise.

**Response — 200 OK**

```json
{
  "status": "ok",
  "checks": {
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
    "db": "error",
    "migrations": "pending"
  }
}
```

---

## Error model

All error responses share this shape:

```ts
{
  error: {
    code: string        // machine-readable, e.g. "CAMPAIGN_NOT_FOUND"
    message: string     // human-readable
    details?: unknown   // Zod issues array for 400 validation errors
  }
}
```

| HTTP status | Exception class | When it happens |
|---|---|---|
| 400 | `InvalidCampaignException` | Zod validation fails on request body |
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
