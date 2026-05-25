# Case study: synthetic Brazilian welcome-offer preflight scenario

> **Disclaimer:** This is a synthetic portfolio scenario, not legal advice. Rule artifacts and their labels require review and approval by qualified compliance and legal owners before any production use.

## The setup

Acme Casino is a fictional operator in a demo scenario. Its CRM team prepares a PT-BR welcome offer with email, SMS, landing-page, terms, owner, and payment-method inputs, including Pix, Visa, Mastercard, and USDT-TRC20.

For the walkthrough, versioned rule artifacts carry illustrative jurisdiction and policy labels so the product can demonstrate deterministic matching and ownership routing. Those artifact labels are not presented as verified legal requirements, enforcement precedent, or a substitute for professional review.

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
    "usdt_trc20"                       // ← WARN: policy artifact routes crypto payment text for review
  ],
  "channels": {
    "email": {
      "subject": "Acme Casino — ganhe R$500 em bônus",
      "body": "Bem-vindo ao Acme Casino! Deposite R$50 e ganhe R$500 sem riscos."
              // ← BLOCK: phrase matches the synthetic risk-language artifact
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
    // ← BLOCK: demo artifact expects "Jogue com responsabilidade"
    // ← BLOCK: demo artifact expects a license-number field
    // ← BLOCK: demo artifact expects maximum-bet text during bonus play
    // ← BLOCK: demo artifact expects age text in the T&C body
    "cryptoMentioned": true,
    "cryptoDisclaimer": null           // ← BLOCK: demo artifact expects volatility text when crypto is mentioned
  },
  "owner": {
    "crm": "ana.silva@acme.casino",
    "marketing": "pedro.costa@acme.casino",
    "compliance": null                 // ← BLOCK: configured internal RACI expects an approving owner
  }
}
```

</details>

## Step 2 — Running Preflight

This walkthrough describes the interactive browser demo over synthetic data. The expanded bundle above is narrative input for that demo, not a runnable `/api/v1/*` request payload or an API response example. Browser-demo drafts and review state remain in `localStorage`.

For the separate authenticated integration contract, including the current `CampaignBundle` request shape, bearer authentication, required UUID `Idempotency-Key`, and persisted response schema, use [`docs/API.md`](./API.md).

Demo verdict: **BLOCK**. The synthetic scenario illustrates 8 hard blockers, 2 warnings, and 3 passes.

## Step 3 — What Preflight caught

| # | Check | Artifact label | Severity | Illustrative finding | Illustrative remediation |
|---|---|---|---|---|---|
| 1 | JurisdictionalRiskCheck | SPA/MF #3 (demo label) | **block** | `"sem riscos"` matches the artifact's risk-language phrase list | Replace with `"ganhe até R$500 em bônus"` |
| 2 | JurisdictionalRiskCheck | Lei 14.790/2023 (demo label) | **block** | Configured age text is absent from landing and terms fields | Add the age text configured by the artifact owner |
| 3 | JurisdictionalRiskCheck | SPA/MF #3 (demo label) | **block** | Configured responsible-play text is absent from relevant fields | Add the text configured by the artifact owner |
| 4 | PaymentCompatibilityCheck | BR crypto policy (demo label) | **warn** | USDT-TRC20 is routed for owner review by the payment artifact | Resolve with the policy owner before launch |
| 5 | CryptoDisclosureCheck | BR crypto policy (demo label) | **block** | Crypto is mentioned while the configured disclosure field is empty | Add the artifact-owner-approved disclosure text |
| 6 | FormatQaCheck | SMS provider 160-char limit | **block** | SMS body is 178 characters | Trim copy or split into two messages |
| 7 | LinkQaCheck | UTM attribution standard | **warn** | Landing CTA missing `utm_source` parameter | Set `utm_source=email_welcome` |
| 8 | LaunchOwnershipCheck | Internal RACI policy | **block** | `owner.compliance` is null; configured owner is absent | Assign an approving owner before launch |
| 9 | TermsRobustnessCheck | Bonus terms (demo label) | **block** | Configured maximum-bet text is absent from terms | Add artifact-owner-approved terms text |
| 10 | TermsRobustnessCheck | License field (demo label) | **block** | Configured license-number text is absent from terms | Add reviewed identifier text if applicable |

## Step 4 — What the deterministic run changes

Without a Preflight run, this synthetic v1 bundle reaches human review with a risk-language match, missing configured terms fields, an unresolved payment-method warning, an incomplete UTM parameter, an over-limit SMS, and no assigned approving owner scattered across its inputs.

With a deterministic run, the same artifact version and same bundle return the same set of findings for an owner to review. The verdict is a workflow signal against the configured artifacts, not a legal conclusion about the campaign.

## Step 5 — Fix and diff

After applying illustrative remediations, the fictional team submitted v2:

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

In the browser demo narrative, the local version comparison illustrates the fixed outcome: all 10 findings resolved, no new findings, and a **GO** verdict. This is not a legal approval or a protected API response example. Authenticated clients can inspect persisted API-run versions and diffs only through the protected endpoints documented in [`docs/API.md`](./API.md).

## Step 6 — What this demonstrates

This portfolio case study demonstrates a deterministic preflight workflow: structured campaign input, versioned policy/rule artifacts, explainable findings, an ownership handoff, and a version comparison after remediation. It deliberately does not claim that the rule labels reproduce current law, that the tool performs legal review, or that it reduces review time by a measured amount.

## Workflow comparison

| Workflow question | Without a deterministic run | With the demo workflow |
|---|---|---|
| Findings | Reviewers locate issues across individual fields | `GO` / `WARN` / `BLOCK` findings reference configured artifacts |
| Iteration | Reviewers manually compare revisions | Demo compares v1 and v2 finding sets |
| Ownership record | Assignment depends on the surrounding process | Finding output includes an owner hint; approval remains human |
| Decision | Responsible owners decide whether to proceed | Responsible owners decide whether to proceed after artifact-based review |

---

[Live demo](https://promo-preflight-production.up.railway.app/)
