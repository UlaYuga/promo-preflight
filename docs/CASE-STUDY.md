# Case study: launching a 100% R$500 welcome offer in Brazil under SPA/MF (Q2 2026)

## The setup

Acme Casino, a mid-size operator running on the 01.tech White Label platform, decided to enter the Brazilian market in Q2 2026. Their CRM team had four working days to ship a welcome promo before the next regulatory window closed: the SPA/MF licensing regime was fully operational, and the team needed to move fast to capture market share in Brazil's rapidly growing regulated segment (Superbet, 7Games, and Brazino777 were already running aggressive acquisition campaigns). The T&C were drafted in PT-BR; channel assets were prepared in pt-BR and es-MX (the parent group also operates a Mexican brand under the same creative pipeline). Payment methods: Pix (primary), Visa, Mastercard, and USDT-TRC20 for repeat depositors from the CIS segment.

The launch had to comply with a stack of overlapping requirements: SPA/MF #3 (promo and bonus restrictions), SPA/MF #1.885/2025, MESP #31, the Conar advertising code, Banco Central do Brasil Pix rules under Lei 15.358/2025, the cryptocurrency disclosure framework under PL 4173/2023, and the overarching Lei 14.790/2023 (the Brazilian gambling legalisation statute). A manual compliance review for this kind of cross-channel, cross-payment-method campaign in Brazil takes an estimated 10–30 person-hours.*

\*Illustrative industry estimate; no public operator metrics are published.

## Step 1 — Campaign bundle as input

The CRM team submitted the following campaign bundle to Preflight:

<details>
<summary>acme-casino-br-welcome-v1.json — click to expand</summary>

```json
{
  "id": "acme-br-welcome-v1",
  "targetJurisdiction": ["BR"],
  "currency": "BRL",
  "offer": {
    "type": "deposit_match",
    "matchPercent": 100,
    "maxBonus": 500,
    "wageringRequirement": 35,
    "minDeposit": 50
  },
  "paymentMethods": [
    "pix",
    "visa",
    "mastercard",
    "usdt_trc20"                       // ← WARN: crypto grey-area for retail BR promo (PL 4173/2023)
  ],
  "channels": {
    "email": {
      "subject": "Acme Casino — ganhe R$500 em bônus",
      "body": "Bem-vindo ao Acme Casino! Deposite R$50 e ganhe R$500 sem riscos."
              // ← BLOCK: "sem riscos" falls under SPA/MF #3 ban on risk-neutrality claims
              //          (same category as "risco zero", "sem perdas" — CONAR/SPA/MF precedent)
    },
    "sms": {
      "body": "Acme Casino: bônus 100% até R$500 para novos jogadores. Deposite R$50 agora e comece a jogar com mais! T&C se aplicam. 18+"
              // ← BLOCK: 178 chars — exceeds 160-char SMS provider limit
    },
    "landing": {
      "url": "https://acme.casino/br/welcome",
      "cta": {
        "text": "Resgatar bônus",
        "utm": "utm_medium=email&utm_campaign=welcome_br_q2"
               // ← WARN: utm_source missing
      }
    }
  },
  "terms": {
    "locale": "pt-BR",
    "text": "Bônus de 100% até R$500. Depósito mínimo R$50. Rollover 35×. Válido 30 dias. Pagamentos via Pix, cartão ou USDT.",
    // ← BLOCK: missing "Jogue com responsabilidade" (mandatory under SPA/MF #3)
    // ← BLOCK: SPA/MF license number absent
    // ← BLOCK: max bet during bonus play not stated (Portaria SPA/MF #1.231/2024)
    // ← BLOCK: no "18+" / "apenas maiores de 18 anos" in T&C body (Lei 14.790/2023)
    "cryptoMentioned": true,
    "cryptoDisclaimer": null           // ← BLOCK: PL 4173/2023 requires volatility disclosure
  },
  "owner": {
    "crm": "ana.silva@acme.casino",
    "marketing": "pedro.costa@acme.casino",
    "compliance": null                 // ← BLOCK: compliance owner required by internal RACI
  }
}
```

</details>

## Step 2 — Running Preflight

This walkthrough describes the interactive browser demo over synthetic data. The expanded bundle above is narrative input for that demo, not a runnable `/api/v1/*` request payload or an API response example. Browser-demo drafts and review state remain in `localStorage`.

For the separate authenticated integration contract, including the current `CampaignBundle` request shape, bearer authentication, required UUID `Idempotency-Key`, and persisted response schema, use [`docs/API.md`](./API.md).

Demo verdict: **BLOCK**. The synthetic scenario illustrates 8 hard blockers, 2 warnings, and 3 passes.

## Step 3 — What Preflight caught

| # | Check | Rule ref | Severity | What it caught | Fix suggestion |
|---|---|---|---|---|---|
| 1 | JurisdictionalRiskCheck | SPA/MF #3 | **block** | "sem riscos" phrase in email body — prohibited risk-neutrality claim (same category as "risco zero", "sem perdas") | Replace with "ganhe até R$500 em bônus" |
| 2 | JurisdictionalRiskCheck | Lei 14.790/2023 | **block** | Missing "18+" / "apenas maiores de 18 anos" disclaimer in landing and T&C | Add 18+ icon and mandatory age text |
| 3 | JurisdictionalRiskCheck | SPA/MF #3 | **block** | Missing "Jogue com responsabilidade" in T&C and all channel footers | Add mandatory phrase to T&C body and landing footer |
| 4 | PaymentCompatibilityCheck | Banco Central do Brasil + PL 4173/2023 | **warn** | USDT-TRC20 in payment list — grey-area for retail welcome promo in BR under current crypto framework | Move USDT to a separate "advanced depositors" opt-in section |
| 5 | CryptoDisclosureCheck | PL 4173/2023 | **block** | Crypto mentioned in T&C without volatility disclosure | Add: "O valor de criptomoedas pode flutuar significativamente" |
| 6 | FormatQaCheck | SMS provider 160-char limit | **block** | SMS body is 178 characters | Trim copy or split into two messages |
| 7 | LinkQaCheck | UTM attribution standard | **warn** | Landing CTA missing `utm_source` parameter | Set `utm_source=email_welcome` |
| 8 | LaunchOwnershipCheck | Internal RACI policy | **block** | `owner.compliance` is null — no compliance owner assigned | Assign compliance sign-off before launch |
| 9 | TermsRobustnessCheck | Portaria SPA/MF #1.231/2024 | **block** | Maximum bet during bonus play not disclosed in T&C | Add: "Aposta máxima durante o bônus: R$10 por rodada" |
| 10 | TermsRobustnessCheck | SPA/MF licensing rules | **block** | SPA/MF license number absent from T&C footer | Add SPA/MF license number in T&C and landing footer |

## Step 4 — What would have happened without Preflight

In May 2024, a major Brazilian sportsbook ran a promotional campaign built around guaranteed-outcome language. CONAR ruled the phrase **«vencer é só o começo»** (winning is just the beginning) non-compliant because it "creates unrealistic expectations and promises guaranteed financial success." The operator was required to pull the creative and revise all channel assets. In April 2026, *Make Money Now S.L.* (producers of the "Zona Gemelos" reality show) received a CONAR fine for promoting unlicensed betting operators — a reminder that even adjacent parties to a campaign carry regulatory exposure in Brazil, and that enforcement actions have begun to land.

Acme Casino's v1 bundle would have shipped the "sem riscos" claim into email inboxes, without the mandatory "Jogue com responsabilidade" footer, without the SPA license number, and with USDT listed as a payment method without the disclosure that PL 4173/2023 requires. A CONAR complaint or SPA/MF audit triggered by the campaign would have required pulling all channel assets, revising landing page copy, obtaining compliance sign-off retroactively, and reprocessing the SMS list — across a four-person CRM team already at deadline. The broader enforcement pattern is clear: *Perfect Storm B.V.* received a €5M fine and a 2-year ban from DGOJ Spain in April 2026 for running campaigns without the required compliance layer. Brazil's SPA enforcement regime is younger, but the regulatory machinery — CONAR, SPA/MF, Banco Central — is now fully operational and cross-referencing.

## Step 5 — Fix and diff

After applying all fixes, the team submitted v2:

```diff
- "body": "...ganhe R$500 sem riscos."
+ "body": "...ganhe até R$500 em bônus de boas-vindas."

- "cryptoDisclaimer": null
+ "cryptoDisclaimer": "O valor de criptomoedas pode flutuar significativamente."

- "text": "Bônus de 100% até R$500. Depósito mínimo R$50. Rollover 35×. Válido 30 dias. Pagamentos via Pix, cartão ou USDT."
+ "text": "Bônus de 100% até R$500 (mín. depósito R$50). Rollover 35×. Aposta máxima durante o bônus: R$10 por rodada. Válido 30 dias. 18+ | apenas maiores de 18 anos. Jogue com responsabilidade. Licença SPA/MF nº [XXXX]. Pagamentos via Pix, cartão ou USDT.*"

- "compliance": null
+ "compliance": "legal@acme.casino"

  // SMS trimmed to 58 chars:
- "body": "Acme Casino: bônus 100% até R$500 para novos jogadores. Deposite R$50 agora e comece a jogar com mais! T&C se aplicam. 18+"
+ "body": "Acme Casino: bônus 100% até R$500. Dep. mín R$50. T&C 18+"

  // UTM completed:
- "utm": "utm_medium=email&utm_campaign=welcome_br_q2"
+ "utm": "utm_source=email_welcome&utm_medium=email&utm_campaign=welcome_br_q2"
```

In the browser demo, the local version comparison illustrates the fixed outcome: all 10 findings resolved, no new findings, and a **GO** verdict. This is demo narrative, not a protected API response example. Authenticated clients can inspect persisted API-run versions and diffs only through the protected endpoints documented in [`docs/API.md`](./API.md).

## Step 6 — Why this matters in 2026

The 01.tech × G GATE MEDIA Global iGaming Report 2026 identifies the operational pattern above as the #1 underrated risk of the year. Станислав, SEO Product Manager at 01.tech, writes in Chapter 5.3:

> «Ключевым и очень недооценённым трендом в 2026 году я бы назвал не ИИ или кор-апдейты, а возрастающие локальные блокировки и регуляторное давление в Латинской Америке и Азии, которые начались ещё в прошлом году и затронули не только продукты, но и вебмастеров. Устойчивость инфраструктуры и слаженные процессы по отслеживанию и реакции на блокировки со стороны конкретных локальных операторов будут конкурентным преимуществом в этом году.»

In English:

> "The key and very underrated trend in 2026, in my view, is not AI or core updates, but the increasing local blockings and regulatory pressure in Latin America and Asia. These began last year and have hit not just products but webmasters too. Infrastructure resilience and tight processes for tracking and reacting to local-operator blocks will be the competitive advantage of this year." — **Stanislav, SEO Product Manager, 01.tech**, *Global iGaming Report 2026*

This case study is the operational implementation of what that report identifies. Each of the 10 blockers above corresponds to a real enforcement precedent or a mandatory clause in Brazilian law as of Q2 2026. Preflight makes jurisdictional compliance a 12-second CI check rather than a 10–30 person-hour manual review cycle.\* The risk Stanislav describes is addressable — it requires tooling that runs in your pipeline, not a consultant engaged retroactively after a campaign is live.

\*Illustrative industry estimate; no public operator metrics are published.

## What this took

| | Manual review (no Preflight) | With Preflight |
|---|---|---|
| Initial compliance check | ~8 hours, 4 people | 12 seconds, 0 manual triage steps |
| Iteration to v2 after fixes | ~4 hours (re-review) | 8 seconds |
| Ownership trail | Slack thread + Google Doc | Structured JSON audit log, queryable |
| Total to launch-ready | 10–30 person-hours* | < 30 minutes |

\*Illustrative industry estimate; no public operator metrics are published.

---

[Live demo](https://promo-preflight-production.up.railway.app/) · 01.tech × G GATE MEDIA Global iGaming Report 2026
