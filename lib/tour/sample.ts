"use client";

import {
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
  PROMO_PREFLIGHT_DEMO_STORAGE_KEYS,
  PROMO_PREFLIGHT_DRAFT_KEY,
  PROMO_PREFLIGHT_REPORT_KEY
} from "@/lib/demo-storage";
import { runChecks } from "@/lib/checks/runner";
import {
  createCampaign,
  getCampaign,
  getVersion,
  saveVersion
} from "@/lib/versioning";
import {
  CampaignBundleSchema,
  type CampaignBundleInput
} from "@/schemas/index";
import { workedExamples } from "@/schemas/worked-examples";

const tourBundle = CampaignBundleSchema.parse(workedExamples.EX09.bundle);

export function clearTourSampleData() {
  PROMO_PREFLIGHT_DEMO_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
  window.dispatchEvent(new Event(PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT));
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

  const campaign = createCampaign("BR welcome sample review", "BR");
  const firstReport = runChecks({
    bundle: tourBundle,
    mode: "offline",
    generatedAt: new Date().toISOString()
  });
  const secondReport = runChecks({
    bundle: createTourFollowUpBundle(),
    mode: "offline",
    generatedAt: new Date().toISOString()
  });

  saveVersion(campaign.id, firstReport);
  saveVersion(campaign.id, secondReport);

  return campaign.id;
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

function createTourFollowUpBundle(): CampaignBundleInput {
  return CampaignBundleSchema.parse({
    ...tourBundle,
    offer: {
      ...tourBundle.offer,
      maxBet: 5,
      eligibleGames: "Eligible categories and contribution are listed.",
      eligibilityRules: "Available to eligible BR accounts only."
    },
    termsText:
      `${tourBundle.termsText} Max bet 5 BRL per round. Available in BR only. Responsible use information is included. Eligible categories and contribution are listed.`,
    assets: [
      {
        channel: "email",
        fieldName: "subject",
        text: "BR welcome sample: 100% up to 300 BRL"
      },
      {
        channel: "landing",
        fieldName: "hero",
        text: "BR welcome sample with terms, max bet, and responsible-use note"
      }
    ]
  });
}
