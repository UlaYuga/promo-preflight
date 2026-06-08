"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Save,
  ShieldCheck,
  X
} from "lucide-react";
import { BriefImportPanel } from "@/components/brief-import-panel";
import { runChecks } from "@/lib/checks/runner";
import {
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
  PROMO_PREFLIGHT_DRAFT_KEY,
  PROMO_PREFLIGHT_REPORT_KEY
} from "@/lib/demo-storage";
import { cn } from "@/lib/utils";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { workedExamples } from "@/schemas/worked-examples";
import type {
  CampaignBundleInput,
  Channel,
  OwnerRole,
  OwnerStatus,
  PromoType,
  TargetJurisdiction
} from "@/schemas";
import { CampaignBundleSchema } from "@/schemas";
import type { CampaignExtractionCandidate } from "@/schemas/brief-extraction";

type DraftMetadata = Omit<
  CampaignBundleInput["metadata"],
  "channelsIncluded" | "promoType"
> & {
  campaignName: string;
  operatorLabel: string;
  promoType: PromoType | "";
  geo: string;
  locale: string;
  currency: string;
  launchDate: string;
  channelsIncluded: Channel[];
};

type DraftOffer = {
  minDeposit?: number;
  bonusAmount?: number;
  bonusPercentage?: number;
  maxBonus?: number;
  wageringRequirement: string;
  maxCashout?: number;
  maxBet?: number;
  eligibleGames: string;
  contribution: string;
  cooldown: string;
  eligibilityRules: string;
};

type IntakeDraft = {
  version: 1;
  linkQaEnabled: boolean;
  metadata: DraftMetadata;
  offer: DraftOffer;
  assets: NonNullable<CampaignBundleInput["assets"]>;
  links: NonNullable<CampaignBundleInput["links"]>;
  owners: NonNullable<CampaignBundleInput["owners"]>;
  termsText: string;
  notes: string;
  targetJurisdiction: TargetJurisdiction[];
  paymentMethods: string[];
  updatedAt?: string;
};

type MissingRequirement = {
  key: string;
  label: string;
  ready: boolean;
};

const promoTypes: Array<{ value: PromoType; label: string }> = [
  { value: "welcome", label: "Welcome" },
  { value: "reload", label: "Reload" },
  { value: "freebet", label: "Freebet" },
  { value: "cashback", label: "Cashback" },
  { value: "tournament", label: "Tournament" },
  { value: "loyalty", label: "Loyalty" },
  { value: "reactivation", label: "Reactivation" }
];

const channelOptions: Array<{ value: Channel; label: string }> = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "onsite", label: "Onsite" },
  { value: "landing", label: "Landing" },
  { value: "sms", label: "SMS" },
  { value: "in_app", label: "In-app" }
];

const jurisdictionOptions = ["BR", "EU", "CIS", "Curacao", "Other"] as const;

const targetJurisdictionOptions: TargetJurisdiction[] = [
  "BR", "MX", "CO", "AR", "IN", "RU", "TR", "UK", "DE", "ES", "IT",
  "NG", "ZA", "KR", "MY", "AL", "SE", "PL", "CA-ON",
];

const operatorOptions = [
  "BetVault",
  "UniStar",
  "LeoMax",
  "DraftStar",
  "FanZone",
  "Triple8",
  "StarDeck",
  "FairPlay",
  "EntaPlay",
  "KindrX",
  "Casomo",
  "GreenMax",
  "PlayParty",
  "BetSun",
  "Other"
] as const;

const localeOptions = [
  "en-GB",
  "en-US",
  "ru-RU",
  "pt-BR",
  "de-DE",
  "es-ES",
  "fr-FR",
  "it-IT",
  "ja-JP",
  "zh-CN",
  "tr-TR",
  "pl-PL",
  "sv-SE",
  "nb-NO",
  "fi-FI",
  "da-DK",
  "nl-NL",
  "hi-IN"
] as const;

const currencyOptions = [
  "EUR",
  "USD",
  "GBP",
  "BRL",
  "RUB",
  "CAD",
  "AUD",
  "NOK",
  "SEK",
  "DKK",
  "PLN",
  "INR",
  "JPY",
  "CNY",
  "CHF",
  "NZD"
] as const;

const ownerRoles: Array<{ value: OwnerRole; label: string }> = [
  { value: "product", label: "Product owner" },
  { value: "crm", label: "CRM owner" },
  { value: "legal", label: "Legal owner" },
  { value: "risk", label: "Risk owner" },
  { value: "localization", label: "Localization owner" },
  { value: "analytics", label: "Analytics owner" }
];

const ownerStatuses: Array<{ value: OwnerStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "blocked", label: "Blocked" },
  { value: "not_required", label: "Not required" }
];

const assetFields = {
  emailSubject: { channel: "email", fieldName: "Email subject", limit: 120 },
  emailBody: { channel: "email", fieldName: "Email body", limit: 4000 },
  pushTitle: { channel: "push", fieldName: "Push title", limit: 80 },
  pushBody: { channel: "push", fieldName: "Push body", limit: 240 },
  onsiteBanner: {
    channel: "onsite",
    fieldName: "Onsite banner copy",
    limit: 500
  },
  landingHeroCta: {
    channel: "landing",
    fieldName: "Landing page hero / CTA",
    limit: 1000
  },
  smsCopy: { channel: "sms", fieldName: "SMS copy", limit: 320 },
  inAppCopy: { channel: "in_app", fieldName: "In-app copy", limit: 1000 }
} as const satisfies Record<
  string,
  { channel: Channel; fieldName: string; limit: number }
>;

const linkLabels = {
  cta: "CTA URL",
  landing: "Landing URL",
  deepLink: "Deep link",
  utm: "UTM parameters"
} as const;

const ASSET_FIELD_NAME_MAP: Partial<Record<Channel, Record<string, string>>> = {
  email: {
    subject: assetFields.emailSubject.fieldName,
    body: assetFields.emailBody.fieldName
  },
  push: {
    title: assetFields.pushTitle.fieldName,
    body: assetFields.pushBody.fieldName
  },
  landing: {
    hero: assetFields.landingHeroCta.fieldName,
    cta: assetFields.landingHeroCta.fieldName
  },
  onsite: { banner: assetFields.onsiteBanner.fieldName },
  sms: { body: assetFields.smsCopy.fieldName },
  in_app: { copy: assetFields.inAppCopy.fieldName }
};

const LINK_LABEL_MAP: Record<string, string> = {
  CTA: linkLabels.cta,
  "CTA URL": linkLabels.cta,
  "Landing URL": linkLabels.landing,
  "Deep link": linkLabels.deepLink
};

function createDefaultDraft(): IntakeDraft {
  return {
    version: 1,
    linkQaEnabled: true,
    metadata: {
      campaignName: "",
      operatorLabel: "",
      promoType: "",
      geo: "",
      locale: "",
      currency: "",
      launchDate: "",
      channelsIncluded: []
    },
    offer: {
      wageringRequirement: "",
      eligibleGames: "",
      contribution: "",
      cooldown: "",
      eligibilityRules: ""
    },
    assets: [],
    links: [],
    owners: ownerRoles.map(({ value }) => ({
      role: value,
      name: "",
      status: "pending"
    })),
    termsText: "",
    notes: "",
    targetJurisdiction: [],
    paymentMethods: []
  };
}

function parseStoredDraft(raw: string): IntakeDraft | null {
  try {
    const parsed = JSON.parse(raw) as Partial<IntakeDraft> | null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const fallback = createDefaultDraft();
    const metadata = parsed.metadata ?? fallback.metadata;
    const offer = parsed.offer ?? fallback.offer;

    return {
      ...fallback,
      ...parsed,
      version: 1,
      linkQaEnabled:
        typeof parsed.linkQaEnabled === "boolean"
          ? parsed.linkQaEnabled
          : fallback.linkQaEnabled,
      metadata: {
        ...fallback.metadata,
        ...metadata,
        channelsIncluded: Array.isArray(metadata.channelsIncluded)
          ? metadata.channelsIncluded
          : fallback.metadata.channelsIncluded
      },
      offer: {
        ...fallback.offer,
        ...offer
      },
      assets: Array.isArray(parsed.assets) ? parsed.assets : fallback.assets,
      links: Array.isArray(parsed.links) ? parsed.links : fallback.links,
      owners: normalizeOwners(parsed.owners),
      termsText: typeof parsed.termsText === "string" ? parsed.termsText : "",
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      targetJurisdiction: Array.isArray(parsed.targetJurisdiction)
        ? (parsed.targetJurisdiction.filter((j) =>
            targetJurisdictionOptions.includes(j as TargetJurisdiction)
          ) as TargetJurisdiction[])
        : fallback.targetJurisdiction,
      paymentMethods: Array.isArray(parsed.paymentMethods)
        ? parsed.paymentMethods.filter((item): item is string => typeof item === "string")
        : fallback.paymentMethods
    };
  } catch {
    return null;
  }
}

function normalizeOwners(owners: IntakeDraft["owners"] | undefined) {
  return ownerRoles.map(({ value }) => {
    const existing = owners?.find((owner) => owner.role === value);
    return {
      role: value,
      name: existing?.name ?? "",
      status: existing?.status ?? "pending",
      dueDate: existing?.dueDate,
      notes: existing?.notes
    };
  });
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function normalizeAssetFieldName(channel: string, fieldName: string): string {
  const map = ASSET_FIELD_NAME_MAP[channel as Channel];
  return map?.[fieldName] ?? fieldName;
}

function bundleToIntakeDraft(bundle: CampaignBundleInput): IntakeDraft {
  return {
    version: 1,
    linkQaEnabled: (bundle.links ?? []).length > 0,
    metadata: {
      campaignName: bundle.metadata.campaignName,
      operatorLabel: bundle.metadata.operatorLabel ?? "",
      promoType: bundle.metadata.promoType,
      geo: bundle.metadata.geo,
      locale: bundle.metadata.locale,
      currency: bundle.metadata.currency ?? "EUR",
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
    assets: (bundle.assets ?? []).map((a) => ({
      channel: a.channel,
      fieldName: normalizeAssetFieldName(a.channel, a.fieldName),
      text: a.text
    })),
    links: (bundle.links ?? []).map((l) => ({
      label: LINK_LABEL_MAP[l.label] ?? l.label,
      url: l.url,
      requiresUtm: l.requiresUtm ?? false,
      expectedDomain: l.expectedDomain
    })),
    owners: normalizeOwners(bundle.owners),
    termsText: bundle.termsText ?? "",
    notes: "",
    targetJurisdiction: (bundle.targetJurisdiction ?? []) as TargetJurisdiction[],
    paymentMethods: bundle.paymentMethods ?? []
  };
}

function buildBundle(draft: IntakeDraft): CampaignBundleInput {
  const channelsIncluded =
    draft.metadata.channelsIncluded.length > 0
      ? draft.metadata.channelsIncluded
      : (Array.from(new Set(draft.assets.map((a) => a.channel))) as Channel[]);

  return {
    metadata: {
      campaignName: draft.metadata.campaignName.trim(),
      operatorLabel: draft.metadata.operatorLabel.trim() || undefined,
      promoType: draft.metadata.promoType as PromoType,
      geo: draft.metadata.geo.trim(),
      locale: draft.metadata.locale.trim() || "en",
      currency: draft.metadata.currency.trim() || "EUR",
      launchDate: draft.metadata.launchDate || undefined,
      channelsIncluded: channelsIncluded.length > 0 ? channelsIncluded : ["email"]
    },
    offer: {
      minDeposit: draft.offer.minDeposit,
      bonusAmount: draft.offer.bonusAmount,
      bonusPercentage: draft.offer.bonusPercentage,
      maxBonus: draft.offer.maxBonus,
      wageringRequirement: draft.offer.wageringRequirement || undefined,
      maxCashout: draft.offer.maxCashout,
      maxBet: draft.offer.maxBet,
      eligibleGames: draft.offer.eligibleGames || undefined,
      contribution: draft.offer.contribution || undefined,
      cooldown: draft.offer.cooldown || undefined,
      eligibilityRules: draft.offer.eligibilityRules || undefined
    },
    termsText: draft.termsText,
    assets: draft.assets.filter((a) => a.text.trim()),
    links: draft.links.filter((l) => l.url.trim()),
    owners: draft.owners.filter((o) => o.name?.trim() || o.status !== "pending"),
    notes: draft.notes || undefined,
    targetJurisdiction: draft.targetJurisdiction.length > 0 ? draft.targetJurisdiction : undefined,
    paymentMethods: draft.paymentMethods.length > 0 ? draft.paymentMethods : undefined
  };
}

function mergeExtractionIntoDraft(
  current: IntakeDraft,
  candidate: CampaignExtractionCandidate
): IntakeDraft {
  return {
    ...current,
    metadata: { ...current.metadata, ...candidate.metadata },
    offer: { ...current.offer, ...candidate.offer },
    assets:
      candidate.assets.length > 0
        ? candidate.assets.map((asset) => ({
            ...asset,
            fieldName: normalizeAssetFieldName(asset.channel, asset.fieldName)
          }))
        : current.assets,
    links:
      candidate.links.length > 0
        ? candidate.links.map((link) => ({
            ...link,
            label: LINK_LABEL_MAP[link.label] ?? link.label
          }))
        : current.links,
    owners:
      candidate.owners.length > 0 ? normalizeOwners(candidate.owners) : current.owners,
    termsText: candidate.termsText ?? current.termsText,
    notes: candidate.notes ?? current.notes,
    targetJurisdiction:
      candidate.targetJurisdiction ?? current.targetJurisdiction,
    paymentMethods: candidate.paymentMethods ?? current.paymentMethods
  };
}

function getAssetText(
  draft: IntakeDraft,
  channel: Channel,
  fieldName: string
) {
  return (
    draft.assets.find(
      (asset) => asset.channel === channel && asset.fieldName === fieldName
    )?.text ?? ""
  );
}

function getLinkUrl(draft: IntakeDraft, label: string) {
  return draft.links.find((link) => link.label === label)?.url ?? "";
}

function getMinimumRequirements(draft: IntakeDraft): MissingRequirement[] {
  const hasMarketingAsset = [
    assetFields.emailSubject,
    assetFields.emailBody,
    assetFields.pushTitle,
    assetFields.pushBody,
    assetFields.onsiteBanner
  ].some((asset) => hasText(getAssetText(draft, asset.channel, asset.fieldName)));

  return [
    {
      key: "campaignName",
      label: "Campaign name",
      ready: hasText(draft.metadata.campaignName)
    },
    {
      key: "promoType",
      label: "Promo type",
      ready: hasText(draft.metadata.promoType)
    },
    { key: "geo", label: "GEO / jurisdiction", ready: hasText(draft.metadata.geo) },
    {
      key: "locale",
      label: "Language / locale",
      ready: hasText(draft.metadata.locale)
    },
    { key: "termsText", label: "T&C text", ready: hasText(draft.termsText) },
    {
      key: "marketingAsset",
      label: "At least one email, push, or onsite asset",
      ready: hasMarketingAsset
    },
    {
      key: "ctaUrl",
      label: "CTA URL for Link QA",
      ready: !draft.linkQaEnabled || hasText(getLinkUrl(draft, linkLabels.cta))
    }
  ];
}

export function IntakeForm() {
  const { t, language } = useI18n();
  const [draft, setDraft] = useState<IntakeDraft>(() => createDefaultDraft());
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const [entryMode, setEntryMode] = useState<"manual" | "brief">("manual");

  useEffect(() => {
    if (window.location.search.includes("examples=1")) {
      requestAnimationFrame(() => setShowExamples(true));
    }
  }, []);

  useEffect(() => {
    let active = true;

    window.setTimeout(() => {
      if (!active) {
        return;
      }

      const stored = window.localStorage.getItem(PROMO_PREFLIGHT_DRAFT_KEY);
      const parsed = stored ? parseStoredDraft(stored) : null;

      if (parsed) {
        setDraft(parsed);
        setHasSavedDraft(true);
      }

      setHydrated(true);
    }, 0);

    return () => {
      active = false;
    };
    }, []);

  useEffect(() => {
    function handleClearDemoData() {
      setDraft(createDefaultDraft());
      setDirty(false);
      setHasSavedDraft(false);
      setStatusMessage(t("intake.draftCleared"));
    }

    window.addEventListener(
      PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
      handleClearDemoData
    );

    return () => {
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
        handleClearDemoData
      );
    };
  }, [t]);

  useEffect(() => {
    if (!hydrated || !dirty) {
      return;
    }

    window.localStorage.setItem(
      PROMO_PREFLIGHT_DRAFT_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
    );
  }, [dirty, draft, hydrated]);

  const requirements = useMemo(
    () =>
      getMinimumRequirements(draft).map((requirement) => ({
        ...requirement,
        label: t(
          `intake.requirements.${
            requirement.key === "marketingAsset"
              ? "asset"
              : requirement.key === "ctaUrl"
                ? "cta"
                : requirement.key
          }` as TranslationKey
        )
      })),
    [draft, t]
  );
  const missingRequirements = requirements.filter((requirement) => !requirement.ready);
  const readyToRun = missingRequirements.length === 0;
  const readyCount = requirements.length - missingRequirements.length;

  function updateDraft(updater: (current: IntakeDraft) => IntakeDraft) {
    setDirty(true);
    setHasSavedDraft(true);
    setStatusMessage("");
    setDraft(updater);
  }

  function updateMetadata<Key extends keyof DraftMetadata>(
    key: Key,
    value: DraftMetadata[Key]
  ) {
    updateDraft((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        [key]: value
      }
    }));
  }

  function updateOffer<Key extends keyof DraftOffer>(
    key: Key,
    value: DraftOffer[Key]
  ) {
    updateDraft((current) => ({
      ...current,
      offer: {
        ...current.offer,
        [key]: value
      }
    }));
  }

  function updateAsset(channel: Channel, fieldName: string, text: string) {
    updateDraft((current) => {
      const existingIndex = current.assets.findIndex(
        (asset) => asset.channel === channel && asset.fieldName === fieldName
      );
      const nextAssets = [...current.assets];

      if (!text.trim()) {
        if (existingIndex >= 0) {
          nextAssets.splice(existingIndex, 1);
        }
        return { ...current, assets: nextAssets };
      }

      const nextAsset = {
        channel,
        fieldName,
        text
      };

      if (existingIndex >= 0) {
        nextAssets[existingIndex] = {
          ...nextAssets[existingIndex],
          ...nextAsset
        };
      } else {
        nextAssets.push(nextAsset);
      }

      return { ...current, assets: nextAssets };
    });
  }

  function updateLink(label: string, url: string) {
    updateDraft((current) => {
      const existingIndex = current.links.findIndex((link) => link.label === label);
      const nextLinks = [...current.links];

      if (!url.trim()) {
        if (existingIndex >= 0) {
          nextLinks.splice(existingIndex, 1);
        }
        return { ...current, links: nextLinks };
      }

      const nextLink = {
        label,
        url,
        requiresUtm: label !== linkLabels.deepLink
      };

      if (existingIndex >= 0) {
        nextLinks[existingIndex] = {
          ...nextLinks[existingIndex],
          ...nextLink
        };
      } else {
        nextLinks.push(nextLink);
      }

      return { ...current, links: nextLinks };
    });
  }

  function updateOwner(
    role: OwnerRole,
    field: "name" | "status",
    value: string
  ) {
    updateDraft((current) => ({
      ...current,
      owners: normalizeOwners(current.owners).map((owner) =>
        owner.role === role ? { ...owner, [field]: value } : owner
      )
    }));
  }

  function toggleChannel(channel: Channel, checked: boolean) {
    updateDraft((current) => {
      const channelsIncluded = checked
        ? Array.from(new Set([...current.metadata.channelsIncluded, channel]))
        : current.metadata.channelsIncluded.filter((item) => item !== channel);

      return {
        ...current,
        metadata: {
          ...current.metadata,
          channelsIncluded
        }
      };
    });
  }

  function toggleJurisdiction(jurisdiction: TargetJurisdiction, checked: boolean) {
    updateDraft((current) => {
      const next = checked
        ? Array.from(new Set([...current.targetJurisdiction, jurisdiction])).slice(0, 3)
        : current.targetJurisdiction.filter((j) => j !== jurisdiction);
      return { ...current, targetJurisdiction: next };
    });
  }

  function executeChecks(nextDraft: IntakeDraft) {
    if (getMinimumRequirements(nextDraft).some((requirement) => !requirement.ready)) {
      return;
    }

    try {
      const rawBundle = buildBundle(nextDraft);
      const bundle = CampaignBundleSchema.parse(rawBundle);
      const report = runChecks({
        bundle,
        mode: "offline",
        generatedAt: new Date().toISOString(),
        language
      });
      window.localStorage.setItem(
        PROMO_PREFLIGHT_REPORT_KEY,
        JSON.stringify({ report, owners: nextDraft.owners })
      );
      window.location.href = "/app/risk-report";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("intake.unknownRunError");
      setStatusMessage(`Error: ${message}`);
    }
  }

  function handleRunPreflight() {
    executeChecks(draft);
  }

  function handleConfirmExtraction(candidate: CampaignExtractionCandidate) {
    const nextDraft = mergeExtractionIntoDraft(createDefaultDraft(), candidate);
    const hasMissingFields = getMinimumRequirements(nextDraft).some(
      (requirement) => !requirement.ready
    );

    setDraft(nextDraft);
    setDirty(true);
    setHasSavedDraft(true);
    window.localStorage.setItem(
      PROMO_PREFLIGHT_DRAFT_KEY,
      JSON.stringify({ ...nextDraft, updatedAt: new Date().toISOString() })
    );

    if (hasMissingFields) {
      setStatusMessage(t("intake.briefImport.fillMissing"));
      return;
    }

    executeChecks(nextDraft);
  }

  function handleLoadExample(exampleId: string) {
    const example = workedExamples[exampleId];
    if (!example) return;
    const nextDraft = bundleToIntakeDraft(example.bundle);
    setDraft(nextDraft);
    setDirty(true);
    setHasSavedDraft(true);
    setStatusMessage(`${t("intake.load")} ${exampleId}: ${example.publicLabel}`);
    setShowExamples(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <form
      data-testid="intake-form"
      className="px-10 py-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      onSubmit={(event) => event.preventDefault()}
    >
      <section className="min-w-0">
        <div className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                {t("intake.eyebrow")}
              </p>
              <h2 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">
                {t("intake.title")}
              </h2>
              <p className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.55] text-subtle">
                {t("intake.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExamples(true)}
              aria-expanded={showExamples}
              className="shrink-0 hairline border rounded px-4 py-2 text-[12px] font-medium text-subtle hover:text-accent hover:border-accent/40 transition-colors"
            >
              {t("welcome.testCases")}
            </button>
          </div>

          {showExamples ? (
            <div className="mt-4 rounded border border-white/[0.07] bg-surface/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted">
                    {t("intake.workedExamples")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {t("intake.workedExamplesSubtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExamples(false)}
                  className="rounded border border-white/[0.07] bg-background p-1.5 text-subtle transition hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">{t("intake.closeExamples")}</span>
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.values(workedExamples).map((example) => (
                  <div
                    key={example.id}
                    className="flex items-start justify-between gap-3 rounded border border-white/[0.07] bg-background p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase text-muted">
                        {example.id}
                      </p>
                      <p className="mt-0.5 text-sm font-medium leading-5 text-foreground/80">
                        {example.publicLabel}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {t(`intake.exampleDescriptions.${example.id}` as TranslationKey)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadExample(example.id)}
                      className="shrink-0 rounded border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/20"
                    >
                      {t("intake.load")}
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted/60">
                {t("intake.examplesNextStep")}
              </p>
            </div>
          ) : null}

          <div
            role="group"
            aria-label={t("intake.briefImport.startMode")}
            className="mt-4 inline-flex rounded border border-white/[0.07] bg-surface/60 p-1"
          >
            {(["manual", "brief"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={entryMode === mode}
                onClick={() => setEntryMode(mode)}
                className={cn(
                  "rounded px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  entryMode === mode
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                )}
              >
                {t(`intake.briefImport.mode.${mode}` as TranslationKey)}
              </button>
            ))}
          </div>
        </div>

        {entryMode === "brief" ? (
          <BriefImportPanel onConfirm={handleConfirmExtraction} />
        ) : null}

        <div className="space-y-4">
          <Section title={t("intake.sections.metadata")} tourId="intake-sample">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label={t("intake.fields.campaignName")}
                value={draft.metadata.campaignName}
                required
                missing={!hasText(draft.metadata.campaignName)}
                onChange={(value) => updateMetadata("campaignName", value)}
              />
              <SelectInput
                label={t("intake.fields.operatorLabel")}
                value={draft.metadata.operatorLabel}
                onChange={(value) => updateMetadata("operatorLabel", value)}
              >
                <option value="">{t("intake.placeholders.selectOperator")}</option>
                {operatorOptions.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
                {draft.metadata.operatorLabel &&
                !operatorOptions.includes(
                  draft.metadata.operatorLabel as (typeof operatorOptions)[number]
                ) ? (
                  <option value={draft.metadata.operatorLabel}>
                    {draft.metadata.operatorLabel}
                  </option>
                ) : null}
              </SelectInput>
              <SelectInput
                label={t("intake.fields.promoType")}
                value={draft.metadata.promoType}
                required
                missing={!hasText(draft.metadata.promoType)}
                onChange={(value) =>
                  updateMetadata("promoType", value as PromoType | "")
                }
              >
                <option value="">{t("intake.placeholders.selectType")}</option>
                {promoTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(`labels.promoTypes.${type.value}` as TranslationKey)}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label={t("intake.fields.geo")}
                value={draft.metadata.geo}
                required
                missing={!hasText(draft.metadata.geo)}
                onChange={(value) => updateMetadata("geo", value)}
              >
                <option value="">{t("intake.placeholders.selectJurisdiction")}</option>
                {jurisdictionOptions.map((jurisdiction) => (
                  <option key={jurisdiction} value={jurisdiction}>
                    {jurisdiction}
                  </option>
                ))}
                {draft.metadata.geo &&
                !jurisdictionOptions.includes(
                  draft.metadata.geo as (typeof jurisdictionOptions)[number]
                ) ? (
                  <option value={draft.metadata.geo}>{draft.metadata.geo}</option>
                ) : null}
              </SelectInput>
              <SelectInput
                label={t("intake.fields.locale")}
                value={draft.metadata.locale}
                required
                missing={!hasText(draft.metadata.locale)}
                onChange={(value) => updateMetadata("locale", value)}
              >
                <option value="">{t("intake.placeholders.selectLocale")}</option>
                {localeOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                {draft.metadata.locale &&
                !localeOptions.includes(
                  draft.metadata.locale as (typeof localeOptions)[number]
                ) ? (
                  <option value={draft.metadata.locale}>
                    {draft.metadata.locale}
                  </option>
                ) : null}
              </SelectInput>
              <SelectInput
                label={t("intake.fields.currency")}
                value={draft.metadata.currency}
                onChange={(value) => updateMetadata("currency", value)}
              >
                <option value="">{t("intake.placeholders.selectCurrency")}</option>
                {currencyOptions.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
                {draft.metadata.currency &&
                !currencyOptions.includes(
                  draft.metadata.currency as (typeof currencyOptions)[number]
                ) ? (
                  <option value={draft.metadata.currency}>
                    {draft.metadata.currency}
                  </option>
                ) : null}
              </SelectInput>
              <TextInput
                label={t("intake.fields.launchDate")}
                value={draft.metadata.launchDate}
                type="date"
                onChange={(value) => updateMetadata("launchDate", value)}
              />
              <div className="md:col-span-2">
                <FieldLabel label={t("intake.fields.channelsIncluded")} />
                <div className="mt-2 flex flex-wrap gap-2">
                  {channelOptions.map((channel) => (
                    <label
                      key={channel.value}
                      className="inline-flex items-center gap-2 rounded border border-white/[0.07] bg-background px-3 py-2 text-sm text-foreground/70"
                    >
                      <input
                        type="checkbox"
                        checked={draft.metadata.channelsIncluded.includes(
                          channel.value
                        )}
                        onChange={(event) =>
                          toggleChannel(channel.value, event.target.checked)
                        }
                        className="h-4 w-4 accent-accent"
                      />
                      {channel.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <FieldLabel label={t("intake.fields.targetJurisdiction")} />
                <div className="mt-2 flex flex-wrap gap-2">
                  {targetJurisdictionOptions.map((jur) => {
                    const checked = draft.targetJurisdiction.includes(jur);
                    const maxReached = draft.targetJurisdiction.length >= 3;
                    return (
                      <label
                        key={jur}
                        className={cn(
                          "inline-flex items-center gap-2 rounded border px-3 py-2 text-sm transition-colors",
                          checked
                            ? "border-accent/30 bg-accent/10 text-accent"
                            : maxReached
                              ? "cursor-not-allowed border-white/[0.07] bg-background text-foreground/30"
                              : "border-white/[0.07] bg-background text-foreground/70"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!checked && maxReached}
                          onChange={(event) =>
                            toggleJurisdiction(jur, event.target.checked)
                          }
                          className="h-4 w-4 accent-accent"
                        />
                        {jur}
                      </label>
                    );
                  })}
                </div>
                {draft.targetJurisdiction.length >= 3 ? (
                  <p className="mt-1.5 text-xs text-muted">
                    {t("intake.placeholders.maxJurisdictions")}
                  </p>
                ) : null}
              </div>
            </div>
          </Section>

          <Section title={t("intake.sections.offer")}>
            <div className="grid gap-4 md:grid-cols-2">
              <NumberInput
                label={t("intake.fields.minDeposit")}
                value={draft.offer.minDeposit}
                onChange={(value) => updateOffer("minDeposit", value)}
              />
              <NumberInput
                label={t("intake.fields.bonusAmount")}
                value={draft.offer.bonusAmount}
                onChange={(value) => updateOffer("bonusAmount", value)}
              />
              <NumberInput
                label={t("intake.fields.bonusPercentage")}
                value={draft.offer.bonusPercentage}
                onChange={(value) => updateOffer("bonusPercentage", value)}
              />
              <NumberInput
                label={t("intake.fields.maxBonus")}
                value={draft.offer.maxBonus}
                onChange={(value) => updateOffer("maxBonus", value)}
              />
              <TextInput
                label={t("intake.fields.wageringRequirement")}
                value={draft.offer.wageringRequirement}
                onChange={(value) => updateOffer("wageringRequirement", value)}
              />
              <NumberInput
                label={t("intake.fields.maxCashout")}
                value={draft.offer.maxCashout}
                onChange={(value) => updateOffer("maxCashout", value)}
              />
              <NumberInput
                label={t("intake.fields.maxBet")}
                value={draft.offer.maxBet}
                onChange={(value) => updateOffer("maxBet", value)}
              />
              <TextInput
                label={t("intake.fields.cooldown")}
                value={draft.offer.cooldown}
                onChange={(value) => updateOffer("cooldown", value)}
              />
              <TextInput
                label={t("intake.fields.paymentMethods")}
                value={draft.paymentMethods.join(", ")}
                placeholder={t("intake.placeholders.paymentMethods")}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    paymentMethods: value
                      .split(",")
                      .map((method) => method.trim())
                      .filter(Boolean)
                  }))
                }
              />
              <TextArea
                label={t("intake.fields.eligibleGames")}
                value={draft.offer.eligibleGames}
                onChange={(value) => updateOffer("eligibleGames", value)}
              />
              <TextArea
                label={t("intake.fields.contribution")}
                value={draft.offer.contribution}
                onChange={(value) => updateOffer("contribution", value)}
              />
              <div className="md:col-span-2">
                <TextArea
                  label={t("intake.fields.eligibilityRules")}
                  value={draft.offer.eligibilityRules}
                  onChange={(value) => updateOffer("eligibilityRules", value)}
                />
              </div>
            </div>
          </Section>

          <Section
            title={t("intake.sections.assets")}
            description={t("intake.assetHint")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <TextArea
                  label={t("intake.fields.termsText")}
                  value={draft.termsText}
                  required
                  missing={!hasText(draft.termsText)}
                  rows={8}
                  maxLength={50000}
                  showCounter
                  onChange={(value) =>
                    updateDraft((current) => ({ ...current, termsText: value }))
                  }
                />
              </div>
              <AssetInput
                label={assetFields.emailSubject.fieldName}
                value={getAssetText(
                  draft,
                  assetFields.emailSubject.channel,
                  assetFields.emailSubject.fieldName
                )}
                maxLength={assetFields.emailSubject.limit}
                onChange={(value) =>
                  updateAsset(
                    assetFields.emailSubject.channel,
                    assetFields.emailSubject.fieldName,
                    value
                  )
                }
              />
              <AssetTextArea
                label={assetFields.emailBody.fieldName}
                value={getAssetText(
                  draft,
                  assetFields.emailBody.channel,
                  assetFields.emailBody.fieldName
                )}
                maxLength={assetFields.emailBody.limit}
                onChange={(value) =>
                  updateAsset(
                    assetFields.emailBody.channel,
                    assetFields.emailBody.fieldName,
                    value
                  )
                }
              />
              <AssetInput
                label={assetFields.pushTitle.fieldName}
                value={getAssetText(
                  draft,
                  assetFields.pushTitle.channel,
                  assetFields.pushTitle.fieldName
                )}
                maxLength={assetFields.pushTitle.limit}
                onChange={(value) =>
                  updateAsset(
                    assetFields.pushTitle.channel,
                    assetFields.pushTitle.fieldName,
                    value
                  )
                }
              />
              <AssetTextArea
                label={assetFields.pushBody.fieldName}
                value={getAssetText(
                  draft,
                  assetFields.pushBody.channel,
                  assetFields.pushBody.fieldName
                )}
                maxLength={assetFields.pushBody.limit}
                onChange={(value) =>
                  updateAsset(
                    assetFields.pushBody.channel,
                    assetFields.pushBody.fieldName,
                    value
                  )
                }
              />
              <AssetTextArea
                label={assetFields.onsiteBanner.fieldName}
                value={getAssetText(
                  draft,
                  assetFields.onsiteBanner.channel,
                  assetFields.onsiteBanner.fieldName
                )}
                maxLength={assetFields.onsiteBanner.limit}
                onChange={(value) =>
                  updateAsset(
                    assetFields.onsiteBanner.channel,
                    assetFields.onsiteBanner.fieldName,
                    value
                  )
                }
              />
              <AssetTextArea
                label={assetFields.landingHeroCta.fieldName}
                value={getAssetText(
                  draft,
                  assetFields.landingHeroCta.channel,
                  assetFields.landingHeroCta.fieldName
                )}
                maxLength={assetFields.landingHeroCta.limit}
                onChange={(value) =>
                  updateAsset(
                    assetFields.landingHeroCta.channel,
                    assetFields.landingHeroCta.fieldName,
                    value
                  )
                }
              />
              <AssetTextArea
                label={assetFields.smsCopy.fieldName}
                value={getAssetText(
                  draft,
                  assetFields.smsCopy.channel,
                  assetFields.smsCopy.fieldName
                )}
                maxLength={assetFields.smsCopy.limit}
                onChange={(value) =>
                  updateAsset(
                    assetFields.smsCopy.channel,
                    assetFields.smsCopy.fieldName,
                    value
                  )
                }
              />
              <AssetTextArea
                label={assetFields.inAppCopy.fieldName}
                value={getAssetText(
                  draft,
                  assetFields.inAppCopy.channel,
                  assetFields.inAppCopy.fieldName
                )}
                maxLength={assetFields.inAppCopy.limit}
                onChange={(value) =>
                  updateAsset(
                    assetFields.inAppCopy.channel,
                    assetFields.inAppCopy.fieldName,
                    value
                  )
                }
              />
            </div>
          </Section>

          <Section title={t("intake.sections.links")}>
            <div className="mb-4 flex items-center justify-between gap-3 rounded border border-white/[0.07] bg-background px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  {t("intake.fields.linkQa")}
                </p>
                <p className="text-xs text-muted">
                  {t("intake.requirements.cta")}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={draft.linkQaEnabled}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      linkQaEnabled: event.target.checked
                    }))
                  }
                  className="h-4 w-4 accent-accent"
                />
                Enabled
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label={linkLabels.cta}
                value={getLinkUrl(draft, linkLabels.cta)}
                required={draft.linkQaEnabled}
                missing={
                  draft.linkQaEnabled && !hasText(getLinkUrl(draft, linkLabels.cta))
                }
                placeholder="https://example.internal/offer"
                onChange={(value) => updateLink(linkLabels.cta, value)}
              />
              <TextInput
                label={linkLabels.landing}
                value={getLinkUrl(draft, linkLabels.landing)}
                placeholder="https://example.internal/landing"
                onChange={(value) => updateLink(linkLabels.landing, value)}
              />
              <TextInput
                label={linkLabels.deepLink}
                value={getLinkUrl(draft, linkLabels.deepLink)}
                placeholder="app://promo/example"
                onChange={(value) => updateLink(linkLabels.deepLink, value)}
              />
              <TextInput
                label={linkLabels.utm}
                value={getLinkUrl(draft, linkLabels.utm)}
                placeholder="utm_source=crm&utm_campaign=..."
                onChange={(value) => updateLink(linkLabels.utm, value)}
              />
            </div>
          </Section>

          <Section title={t("intake.sections.owners")}>
            <div className="grid gap-4 md:grid-cols-2">
              {ownerRoles.map((ownerRole) => {
                const owner = normalizeOwners(draft.owners).find(
                  (item) => item.role === ownerRole.value
                );

                return (
                  <div key={ownerRole.value} className="grid gap-2">
                    <TextInput
                      label={ownerRole.label}
                      value={owner?.name ?? ""}
                      placeholder={t("intake.placeholders.ownerName")}
                      onChange={(value) =>
                        updateOwner(ownerRole.value, "name", value)
                      }
                    />
                    <SelectInput
                      label={`${ownerRole.label} status`}
                      value={owner?.status ?? "pending"}
                      onChange={(value) =>
                        updateOwner(ownerRole.value, "status", value)
                      }
                    >
                      {ownerStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {t(`labels.ownerStatuses.${status.value}` as TranslationKey)}
                        </option>
                      ))}
                    </SelectInput>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title={t("intake.sections.notes")}>
            <TextArea
              label={t("intake.fields.internalNotes")}
              value={draft.notes}
              rows={6}
              maxLength={5000}
              showCounter
              onChange={(value) =>
                updateDraft((current) => ({ ...current, notes: value }))
              }
            />
          </Section>
        </div>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="rounded border border-white/[0.07] bg-surface/60 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded border border-info/30 bg-info/10 text-info">
              <Save className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("common.save")}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                {hasSavedDraft
                  ? t("intake.draftSaved")
                  : t("intake.noSavedDraft")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded border border-white/[0.07] bg-surface/60 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("intake.runPreflightReady")}
            </h3>
            <span className="rounded border border-white/[0.07] bg-background px-2 py-1 text-xs font-medium text-foreground/70">
              {readyCount}/{requirements.length}
            </span>
          </div>
          <div className="space-y-2">
            {requirements.map((requirement) => (
              <div
                key={requirement.key}
                className="flex items-start gap-2 text-sm leading-5"
              >
                {requirement.ready ? (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-pass"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleAlert
                    className="mt-0.5 h-4 w-4 shrink-0 text-warn"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={requirement.ready ? "text-foreground/70" : "text-warn"}
                >
                  {requirement.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-white/[0.07] bg-surface/60 p-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t("intake.runPreflight")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            {readyToRun ? t("intake.runPreflightReady") : t("intake.runPreflightMissing")}
          </p>
          <button
            type="button"
            data-testid="run-preflight"
            data-tour="run-preflight"
            disabled={!readyToRun}
            onClick={handleRunPreflight}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded border px-4 py-3 text-sm font-medium transition",
              readyToRun
                ? "border-accent/60 bg-accent/15 text-accent hover:bg-accent/25"
                : "cursor-not-allowed border-white/[0.07] bg-background text-muted/60"
            )}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("intake.runPreflight")}
          </button>
          {statusMessage ? (
            <p
              data-testid="intake-status"
              aria-live="polite"
              className="mt-3 rounded border border-white/[0.07] bg-background px-3 py-2 text-sm leading-6 text-foreground/70"
            >
              {statusMessage}
            </p>
          ) : null}
        </div>
      </aside>
    </form>
  );
}

function Section({
  title,
  description,
  tourId,
  children
}: Readonly<{
  title: string;
  description?: string;
  tourId?: string;
  children: React.ReactNode;
}>) {
  return (
    <article
      data-tour={tourId}
      className="rounded border border-white/[0.07] bg-surface/60 p-4"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </article>
  );
}

function FieldLabel({
  label,
  required = false,
  missing = false
}: Readonly<{
  label: string;
  required?: boolean;
  missing?: boolean;
}>) {
  return (
    <span className="flex items-center justify-between gap-3 text-xs font-medium text-subtle">
      <span>{label}</span>
      {required ? (
        <span
          className={cn(
            "rounded border px-2 py-0.5 text-[11px]",
            missing
              ? "border-warn/30 bg-warn/10 text-warn"
              : "border-pass/30 bg-pass/10 text-pass"
          )}
        >
          *
        </span>
      ) : null}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  missing = false,
  type = "text"
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  missing?: boolean;
  type?: "date" | "text";
}>) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} missing={missing} />
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={missing}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName(missing)}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange
}: Readonly<{
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}>) {
  return (
    <label className="block">
      <FieldLabel label={label} />
      <input
        type="number"
        min="0"
        value={value ?? ""}
        onChange={(event) => onChange(parseOptionalNumber(event.target.value))}
        className={fieldClassName(false)}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  required = false,
  missing = false,
  children
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  missing?: boolean;
  children: React.ReactNode;
}>) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} missing={missing} />
      <select
        value={value}
        aria-invalid={missing}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName(missing)}
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  maxLength,
  showCounter = false,
  required = false,
  missing = false
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  showCounter?: boolean;
  required?: boolean;
  missing?: boolean;
}>) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} missing={missing} />
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={missing}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClassName(missing), "min-h-28 resize-y leading-6")}
      />
      {showCounter && maxLength ? (
        <CharacterCounter value={value} maxLength={maxLength} />
      ) : null}
    </label>
  );
}

function AssetInput({
  label,
  value,
  maxLength,
  onChange
}: Readonly<{
  label: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}>) {
  return (
    <label className="block">
      <FieldLabel label={label} />
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName(false)}
      />
      <CharacterCounter value={value} maxLength={maxLength} />
    </label>
  );
}

function AssetTextArea({
  label,
  value,
  maxLength,
  onChange
}: Readonly<{
  label: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}>) {
  return (
    <TextArea
      label={label}
      value={value}
      maxLength={maxLength}
      showCounter
      onChange={onChange}
    />
  );
}

function CharacterCounter({
  value,
  maxLength
}: Readonly<{
  value: string;
  maxLength: number;
}>) {
  return (
    <div className="mt-1 text-right text-xs text-muted">
      {value.length}/{maxLength}
    </div>
  );
}

function fieldClassName(missing: boolean) {
  return cn(
    "mt-1 w-full rounded border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted/60 focus:border-accent/60 focus:ring-2 focus:ring-accent/15",
    missing ? "border-warn/40" : "border-white/[0.07]"
  );
}
