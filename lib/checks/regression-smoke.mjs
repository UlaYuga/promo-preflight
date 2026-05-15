import {
  CampaignBundleSchema,
  CheckResultSchema,
  RiskReportSchema
} from "../../schemas/index.ts";
import { workedExamples } from "../../schemas/worked-examples.ts";
import { CHECK_IDS } from "./definitions.ts";
import { runChecks } from "./runner.ts";

delete process.env.ANTHROPIC_API_KEY;

// Spec section 18: EX01-EX08 baseline plus T18 domain samples.
const exampleCases = [
  {
    name: "EX01 – Welcome Bonus Audit bundle mismatch",
    bundle: workedExamples.EX01.bundle,
    expected: {
      channel_consistency: "FAIL",
      offer_math_sanity: "WARN"
    }
  },
  {
    name: "EX02 – Welcome Bonus Terms Sweep missing max bet",
    bundle: workedExamples.EX02.bundle,
    expected: { terms_robustness: "FAIL" }
  },
  {
    name: "EX03 – Cashback Reconciliation math contradiction",
    bundle: workedExamples.EX03.bundle,
    expected: { offer_math_sanity: "FAIL" }
  },
  {
    name: "EX04 – UK Freebet Copy Review jurisdiction copy risk",
    bundle: workedExamples.EX04.bundle,
    expected: { jurisdictional_risk_signals: "FAIL" }
  },
  {
    name: "EX05 – Brazil Reactivation localization mismatch",
    bundle: workedExamples.EX05.bundle,
    expected: { localization_qa: "FAIL" }
  },
  {
    name: "EX06 – VIP Reload Approval Gate missing owners",
    bundle: workedExamples.EX06.bundle,
    expected: { launch_ownership: "FAIL" }
  },
  {
    name: "EX07 – Weekend Tournament QA link tracking issue",
    bundle: workedExamples.EX07.bundle,
    expected: { link_qa: "FAIL" }
  },
  {
    name: "EX08 – Weekend Free Spins Push format overflow",
    bundle: workedExamples.EX08.bundle,
    expected: { format_qa: "FAIL" }
  },
  {
    name: "EX09 – Brazil Welcome Audit domain rules",
    bundle: workedExamples.EX09.bundle,
    expected: {
      jurisdictional_risk_signals: "FAIL",
      terms_robustness: "FAIL",
      offer_math_sanity: "WARN"
    }
  },
  {
    name: "EX10 – EU Free Spins Audit domain rules",
    bundle: workedExamples.EX10.bundle,
    expected: {
      jurisdictional_risk_signals: "FAIL",
      terms_robustness: "FAIL"
    }
  },
  {
    name: "EX11 – VIP Cashback Audit domain rules",
    bundle: workedExamples.EX11.bundle,
    expected: {
      channel_consistency: "FAIL",
      terms_robustness: "FAIL"
    }
  }
];

const cases = [
  {
    name: "base-pass",
    bundle: makeBaseBundle(),
    expected: {
      channel_consistency: "PASS",
      terms_robustness: "PASS",
      offer_math_sanity: "PASS",
      jurisdictional_risk_signals: "PASS",
      localization_qa: "PASS",
      launch_ownership: "PASS",
      link_qa: "PASS",
      format_qa: "PASS"
    }
  },
  {
    name: "channel-conflict",
    bundle: {
      ...makeBaseBundle(),
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "May reload: 100% up to 500 EUR"
        }
      ]
    },
    expected: { channel_consistency: "FAIL" }
  },
  {
    name: "terms-missing-critical",
    bundle: {
      ...makeBaseBundle(),
      offer: {
        minDeposit: 50,
        bonusPercentage: 50,
        maxBonus: 300,
        wageringRequirement: "35x bonus",
        maxCashout: 1000
      },
      termsText: "Short synthetic terms. Eligible users only."
    },
    expected: { terms_robustness: "FAIL" }
  },
  {
    name: "offer-math-conflict",
    bundle: {
      ...makeBaseBundle(),
      offer: {
        ...makeBaseBundle().offer,
        maxBonus: 300,
        maxCashout: 100
      }
    },
    expected: { offer_math_sanity: "FAIL" }
  },
  {
    name: "jurisdiction-risk",
    bundle: {
      ...makeBaseBundle(),
      metadata: {
        ...makeBaseBundle().metadata,
        geo: "UKGC-like"
      },
      termsText:
        "Synthetic terms: eligible users, 35x wagering on bonus, max bet 5 EUR, max cashout 1000 EUR, eligible games listed, contribution rules listed, one per household/IP/payment, valid until 10 June 2026.",
      assets: [
        {
          channel: "landing",
          fieldName: "hero",
          text: "Guaranteed outcome for this campaign"
        }
      ]
    },
    expected: { jurisdictional_risk_signals: "FAIL" }
  },
  {
    name: "localization-mismatch",
    bundle: {
      ...makeBaseBundle(),
      metadata: {
        ...makeBaseBundle().metadata,
        geo: "Brazil",
        locale: "pt-BR",
        currency: "EUR"
      },
      assets: [
        {
          channel: "push",
          fieldName: "body",
          text: "Claim today, valid until 05/06"
        }
      ]
    },
    expected: { localization_qa: "FAIL" }
  },
  {
    name: "ownership-missing",
    bundle: {
      ...makeBaseBundle(),
      owners: [
        {
          role: "product",
          name: "Product owner",
          status: "approved"
        },
        {
          role: "crm",
          name: "CRM owner",
          status: "approved"
        }
      ]
    },
    expected: { launch_ownership: "FAIL" }
  },
  {
    name: "link-invalid",
    bundle: {
      ...makeBaseBundle(),
      links: [
        {
          label: "CTA",
          url: "promo path without scheme",
          requiresUtm: true
        }
      ]
    },
    expected: { link_qa: "FAIL" }
  },
  {
    name: "format-overflow",
    bundle: {
      ...makeBaseBundle(),
      assets: [
        {
          channel: "push",
          fieldName: "title",
          text: "This push title is intentionally much longer than the configured hard limit"
        }
      ]
    },
    expected: { format_qa: "FAIL" }
  }
];

for (const testCase of [...exampleCases, ...cases]) {
  const bundle = CampaignBundleSchema.parse(testCase.bundle);
  const report = RiskReportSchema.parse(
    runChecks({ bundle, mode: "offline", generatedAt: "2026-05-03T00:00:00.000Z" })
  );

  assertCompleteReport(testCase.name, report);

  for (const [checkId, expectedStatus] of Object.entries(testCase.expected)) {
    const actual = report.checkResults.find((result) => result.checkId === checkId);
    if (!actual) {
      throw new Error(`${testCase.name}: missing ${checkId}.`);
    }

    if (actual.status !== expectedStatus) {
      throw new Error(
        `${testCase.name}: expected ${checkId} ${expectedStatus}, got ${actual.status}.`
      );
    }
  }
}

console.log(
  `Checks regression passed: ${exampleCases.length} worked examples (EX01-EX11) + ${cases.length} offline cases, 8 checks each.`
);

function assertCompleteReport(name, report) {
  if (report.checkResults.length !== CHECK_IDS.length) {
    throw new Error(`${name}: expected ${CHECK_IDS.length} results.`);
  }

  const resultIds = new Set(report.checkResults.map((result) => result.checkId));
  for (const checkId of CHECK_IDS) {
    if (!resultIds.has(checkId)) {
      throw new Error(`${name}: missing ${checkId}.`);
    }
  }

  for (const result of report.checkResults) {
    CheckResultSchema.parse(result);

    if (result.modelUsed !== "offline-deterministic:v1") {
      throw new Error(`${name}: non-offline model marker for ${result.checkId}.`);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    throw new Error("Regression smoke must not require ANTHROPIC_API_KEY.");
  }
}

function makeBaseBundle() {
  return {
    metadata: {
      campaignName: "Synthetic Reload QA",
      operatorLabel: "Northstar Sandbox",
      promoType: "reload",
      geo: "MGA generic",
      locale: "en-GB",
      currency: "EUR",
      launchDate: "2026-05-10",
      channelsIncluded: ["email", "push", "landing"]
    },
    offer: {
      minDeposit: 50,
      bonusPercentage: 50,
      maxBonus: 300,
      wageringRequirement: "35x bonus",
      maxCashout: 1000,
      maxBet: 5,
      eligibleGames: "Eligible games listed in campaign terms.",
      contribution: "Contribution rules listed in campaign terms.",
      cooldown: "Once per week.",
      eligibilityRules: "Existing eligible users only."
    },
    termsText:
      "Synthetic terms: 50% up to 300 EUR, eligible users only, 35x wagering on bonus only, max bet 5 EUR, max cashout 1000 EUR, eligible games listed, contribution rules listed, one per household/IP/payment, once per week, valid until 10 June 2026. 18+. Responsible use wording included.",
    assets: [
      {
        channel: "email",
        fieldName: "subject",
        text: "May reload: 50% up to 300 EUR"
      },
      {
        channel: "push",
        fieldName: "title",
        text: "May reload"
      }
    ],
    links: [
      {
        label: "CTA",
        url: "https://example.com/promo?utm_source=email&utm_medium=crm&utm_campaign=may_reload",
        expectedDomain: "example.com",
        requiresUtm: true
      }
    ],
    owners: [
      { role: "product", name: "Product owner", status: "approved" },
      { role: "crm", name: "CRM owner", status: "approved" },
      { role: "legal", name: "Legal owner", status: "approved" },
      { role: "risk", name: "Risk owner", status: "approved" },
      {
        role: "localization",
        name: "Localization owner",
        status: "approved"
      },
      { role: "analytics", name: "Analytics owner", status: "approved" }
    ]
  };
}
