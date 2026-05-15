import type { CampaignBundleInput, CheckResult } from "./index";

export const sampleCampaignBundle = {
  metadata: {
    campaignName: "CRM QA - Welcome bonus audit",
    operatorLabel: "Northstar Sandbox",
    promoType: "welcome",
    geo: "MGA generic",
    locale: "en-GB",
    currency: "EUR",
    launchDate: "2026-05-10",
    channelsIncluded: ["email", "push", "onsite", "landing"]
  },
  offer: {
    minDeposit: 50,
    bonusPercentage: 50,
    maxBonus: 300,
    wageringRequirement: "35x bonus",
    maxCashout: 1000,
    maxBet: 5
  },
  termsText: "Synthetic T&C excerpt for portfolio demo.",
  assets: [
    {
      channel: "email",
      fieldName: "subject",
      text: "Welcome bonus: 100% up to 500 EUR"
    },
    {
      channel: "push",
      fieldName: "body",
      text: "Welcome bonus QA copy"
    }
  ],
  links: [
    {
      label: "CTA",
      url: "https://example.com/promo?utm_source=email",
      requiresUtm: true
    }
  ],
  owners: [
    {
      role: "product",
      name: "Product owner",
      status: "pending"
    }
  ]
} satisfies CampaignBundleInput;

export const sampleCheckResult = {
  checkId: "channel_consistency",
  publicName: "Channel consistency",
  status: "FAIL",
  severity: "HIGH",
  summary: "Email copy conflicts with T&C on bonus percentage and maximum bonus.",
  issues: [
    {
      issueId: "CH-001",
      checkId: "channel_consistency",
      severity: "HIGH",
      blocker: true,
      detectedIssue:
        "Email says 100% up to 500 EUR, while offer basics show 50% up to 300 EUR.",
      evidence: [
        { field: "email.subject", snippet: "100% up to 500 EUR" },
        { field: "offer.maxBonus", snippet: "300 EUR" }
      ],
      suggestedFix:
        "Align email subject to 50% up to 300 EUR or update T&C and offer basics.",
      ownerSuggestion: "crm",
      confidence: 0.91
    }
  ],
  suggestedFixCount: 1,
  confidence: 0.91
} satisfies CheckResult;

export const invalidCampaignBundleCases = {
  invalidPromoType: {
    ...sampleCampaignBundle,
    metadata: {
      ...sampleCampaignBundle.metadata,
      promoType: "seasonal_bonus"
    }
  },
  missingRequiredTerms: {
    metadata: sampleCampaignBundle.metadata,
    offer: sampleCampaignBundle.offer
  }
} as const;

export const invalidCheckResultCases = {
  confidenceOutOfRange: {
    ...sampleCheckResult,
    confidence: 1.2
  }
} as const;
