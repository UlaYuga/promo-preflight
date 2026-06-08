"use client";

import {
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
  PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT,
  PROMO_PREFLIGHT_DEMO_STORAGE_KEYS,
  PROMO_PREFLIGHT_DRAFT_KEY,
  PROMO_PREFLIGHT_REPORT_KEY
} from "@/lib/demo-storage";
import { runChecks } from "@/lib/checks/runner";
import {
  createCampaign,
  getCampaign,
  getVersion,
  listCampaigns,
  listVersions,
  saveVersion
} from "@/lib/versioning";
import {
  CampaignBundleSchema,
  type CampaignBundleInput
} from "@/schemas/index";
import { workedExamples } from "@/schemas/worked-examples";

const tourBundle = CampaignBundleSchema.parse(workedExamples.EX09.bundle);
const decisionDemoCampaignName = "BR welcome sample review";

export type DecisionDemoState = "blocked" | "warnings" | "ready";

export function clearTourSampleData() {
  PROMO_PREFLIGHT_DEMO_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
  window.dispatchEvent(new Event(PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT));
  window.dispatchEvent(new Event(PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT));
}

export function loadTourSample({
  clearDemoData = false,
  language
}: {
  clearDemoData?: boolean;
  language?: string;
} = {}) {
  if (clearDemoData) {
    clearTourSampleData();
  }

  const report = runChecks({
    bundle: tourBundle,
    mode: "offline",
    generatedAt: new Date().toISOString(),
    language
  });

  window.localStorage.setItem(
    PROMO_PREFLIGHT_DRAFT_KEY,
    JSON.stringify({
      ...bundleToDraft(tourBundle),
      updatedAt: new Date().toISOString()
    })
  );
  window.localStorage.setItem(
    PROMO_PREFLIGHT_REPORT_KEY,
    JSON.stringify({ report, owners: tourBundle.owners })
  );
  window.dispatchEvent(new Event(PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT));

  return { report };
}

export function seedTourVersionHistory(existingCampaignId?: string): string {
  if (
    existingCampaignId &&
    getCampaign(existingCampaignId) &&
    getVersion(existingCampaignId, 2)
  ) {
    return existingCampaignId;
  }

  const campaign =
    (existingCampaignId ? getCampaign(existingCampaignId) : null) ??
    listCampaigns().find(
      (item) => item.name === decisionDemoCampaignName
    ) ??
    createCampaign(decisionDemoCampaignName, "BR");

  seedDecisionVersions(campaign.id);
  return campaign.id;
}

export function loadDecisionDemoState({
  clearDemoData = false,
  language,
  state = "blocked"
}: {
  clearDemoData?: boolean;
  language?: string;
  state?: DecisionDemoState;
} = {}) {
  if (clearDemoData) {
    clearTourSampleData();
  }

  const campaignId = seedDecisionDemoReviewRuns();
  const bundle = bundleForDecisionState(state);
  const report = runChecks({
    bundle,
    mode: "offline",
    generatedAt: new Date().toISOString(),
    language
  });

  window.localStorage.setItem(
    PROMO_PREFLIGHT_DRAFT_KEY,
    JSON.stringify({
      ...bundleToDraft(bundle),
      updatedAt: new Date().toISOString()
    })
  );
  window.localStorage.setItem(
    PROMO_PREFLIGHT_REPORT_KEY,
    JSON.stringify({ report, owners: bundle.owners })
  );
  window.dispatchEvent(new Event(PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT));

  return {
    campaignId,
    report,
    versionPath: `/app/campaigns/${campaignId}/versions/${versionNumberForState(state)}`
  };
}

export function seedDecisionDemoReviewRuns(): string {
  const existing = listCampaigns().find(
    (campaign) => campaign.name === decisionDemoCampaignName
  );
  const campaign = existing ?? createCampaign(decisionDemoCampaignName, "BR");

  seedDecisionVersions(campaign.id);
  return campaign.id;
}

function seedDecisionVersions(campaignId: string): void {
  const existingVersions = listVersions(campaignId);
  const versionBundles = [
    tourBundle,
    createDecisionWarningsBundle(),
    createDecisionReadyBundle()
  ];

  for (const bundle of versionBundles.slice(existingVersions.length)) {
    const report = runChecks({
      bundle,
      mode: "offline",
      generatedAt: new Date().toISOString()
    });
    saveVersion(campaignId, report);
  }
}

function bundleToDraft(bundle: CampaignBundleInput) {
  return {
    version: 1,
    linkQaEnabled: true,
    metadata: {
      campaignName: bundle.metadata.campaignName,
      operatorLabel: bundle.metadata.operatorLabel ?? "",
      promoType: bundle.metadata.promoType,
      geo: bundle.metadata.geo,
      locale: bundle.metadata.locale,
      currency: bundle.metadata.currency ?? "BRL",
      launchDate: bundle.metadata.launchDate ?? "",
      channelsIncluded: bundle.metadata.channelsIncluded ?? []
    },
    offer: {
      minDeposit: bundle.offer.minDeposit,
      bonusAmount: bundle.offer.bonusAmount,
      bonusPercentage: bundle.offer.bonusPercentage,
      maxBonus: bundle.offer.maxBonus,
      wageringRequirement: bundle.offer.wageringRequirement ?? "",
      maxCashout: bundle.offer.maxCashout,
      maxBet: bundle.offer.maxBet,
      eligibleGames: bundle.offer.eligibleGames ?? "",
      contribution: bundle.offer.contribution ?? "",
      cooldown: bundle.offer.cooldown ?? "",
      eligibilityRules: bundle.offer.eligibilityRules ?? ""
    },
    assets: [
      {
        channel: "email",
        fieldName: "Email subject",
        text:
          bundle.assets?.find((asset) => asset.channel === "email")?.text ?? ""
      },
      {
        channel: "landing",
        fieldName: "Landing page hero / CTA",
        text:
          bundle.assets?.find((asset) => asset.channel === "landing")?.text ??
          ""
      }
    ],
    links: [
      {
        label: "CTA URL",
        url: bundle.links?.[0]?.url ?? "",
        requiresUtm: true,
        expectedDomain: bundle.links?.[0]?.expectedDomain
      }
    ],
    owners: bundle.owners ?? [],
    termsText: bundle.termsText ?? "",
    notes: "Synthetic BR welcome sample for the desktop product tour."
  };
}

function bundleForDecisionState(state: DecisionDemoState): CampaignBundleInput {
  if (state === "ready") {
    return createDecisionReadyBundle();
  }

  if (state === "warnings") {
    return createDecisionWarningsBundle();
  }

  return tourBundle;
}

function versionNumberForState(state: DecisionDemoState) {
  if (state === "ready") {
    return 3;
  }

  if (state === "warnings") {
    return 2;
  }

  return 1;
}

function createDecisionReadyBundle(): CampaignBundleInput {
  return CampaignBundleSchema.parse({
    ...tourBundle,
    offer: {
      ...tourBundle.offer,
      maxBet: 5,
      eligibleGames: "Slots and live casino. Excluded games do not contribute.",
      contribution: "Slots contribute 100%; other games contribute 0%.",
      cooldown: "Once per user during the campaign period.",
      eligibilityRules: "Eligible new BR accounts only."
    },
    termsText:
      "Termos sinteticos BR: 100% ate 300 BRL. Deposito minimo 30 BRL. Wagering 35x bonus only. Max bet 5 BRL. Max cashout 900 BRL before withdrawal. Eligible new users only. Valid until 30 June 2026. Available in BR only. One per household and single account. Eligible games: slots only; contribution rules apply. Once per user during the campaign period. 18+. Play responsibly.",
    assets: [
      {
        channel: "email",
        fieldName: "subject",
        text: "Oferta de boas-vindas: 100% ate 300 BRL"
      },
      {
        channel: "landing",
        fieldName: "hero",
        text: "Oferta de boas-vindas com termos claros"
      }
    ]
  });
}

function createDecisionWarningsBundle(): CampaignBundleInput {
  const readyBundle = createDecisionReadyBundle();

  return CampaignBundleSchema.parse({
    ...readyBundle,
    owners: (readyBundle.owners ?? []).map((owner) =>
      owner.role === "analytics"
        ? { ...owner, status: "pending", dueDate: "2026-06-08" }
        : owner
    )
  });
}
