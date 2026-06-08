"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, FolderOpen, PlayCircle } from "lucide-react";
import { OwnerOverridePanel } from "@/components/owner-override-panel";
import {
  PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT,
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT
} from "@/lib/demo-storage";
import { useI18n } from "@/lib/i18n";
import { loadDecisionDemoState } from "@/lib/tour/sample";
import {
  getCampaign,
  getLatestVersionSummary,
  listCampaigns,
  listVersions
} from "@/lib/versioning";
import { cn } from "@/lib/utils";
import type { OwnerOverrides } from "@/schemas/owners";
import type { CampaignRecord, CampaignVersion } from "@/schemas/versioning";

type CampaignSummary = {
  campaign: CampaignRecord;
  versionCount: number;
  latestReadinessState: CampaignVersion["readinessState"] | null;
  latestCreatedAt: string | null;
};

type CampaignVersionListState = {
  campaign: CampaignRecord | null;
  versions: CampaignVersion[];
};

function readinessLabel(
  state: CampaignVersion["readinessState"] | null,
  language: string
) {
  if (!state) return null;
  const ru = language === "ru";

  if (state === "READY") return ru ? "Готово" : "Ready";
  if (state === "READY_WITH_WARNINGS") return ru ? "С предупреждениями" : "Ready w/ warnings";
  if (state === "BLOCKED") return ru ? "Заблокировано" : "Blocked";
  return ru ? "Нужен review" : "Needs review";
}

function readinessBadgeClass(state: CampaignVersion["readinessState"] | null) {
  if (state === "READY") return "border-pass/30 bg-pass/10 text-pass";
  if (state === "READY_WITH_WARNINGS") return "border-warn/30 bg-warn/10 text-warn";
  if (state === "BLOCKED") return "border-fail/30 bg-fail/10 text-fail";
  return "border-white/[0.07] bg-surface text-subtle";
}

function formatDate(iso: string, language: string) {
  try {
    return new Intl.DateTimeFormat(language === "ru" ? "ru" : "en", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function CampaignList() {
  const { language, t } = useI18n();
  const [summaries, setSummaries] = useState<CampaignSummary[] | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  useEffect(() => {
    let active = true;

    function refreshCampaigns() {
      if (!active) return;

      const campaigns = listCampaigns();
      setSummaries(
        campaigns.map((campaign) => ({
          campaign,
          ...getLatestVersionSummary(campaign.id)
        }))
      );
    }

    const timeoutId = window.setTimeout(refreshCampaigns, 0);
    window.addEventListener("storage", refreshCampaigns);
    window.addEventListener(
      PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT,
      refreshCampaigns
    );
    window.addEventListener(
      PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
      refreshCampaigns
    );

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", refreshCampaigns);
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT,
        refreshCampaigns
      );
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
        refreshCampaigns
      );
    };
  }, []);

  const loadDemoRun = useCallback(() => {
    setIsLoadingDemo(true);
    try {
      loadDecisionDemoState({ language, state: "ready" });
    } finally {
      setIsLoadingDemo(false);
    }
  }, [language]);

  if (summaries === null) {
    return (
      <div className="rounded-sm hairline border bg-surface/60 p-8 text-center text-sm text-subtle">
        {t("common.loading")}
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="rounded-sm border border-white/[0.07] bg-surface/50 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-muted/70" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground/80">
                {t("campaigns.emptyTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-subtle">
                {t("campaigns.emptyDescription")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={loadDemoRun}
              disabled={isLoadingDemo}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-accent/50 bg-accent px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-wait disabled:opacity-70"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              {isLoadingDemo
                ? t("campaigns.emptyActionLoading")
                : t("campaigns.emptyAction")}
            </button>
            <Link
              href="/app/intake?examples=1"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-sm border border-white/[0.07] bg-background px-3 py-2 text-xs font-medium text-subtle transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {t("campaigns.emptySecondaryAction")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-tour="campaign-versioning"
      className="overflow-hidden rounded-sm hairline border bg-surface/60"
    >
      <div className="sm:hidden">
        <ul className="divide-y divide-white/[0.06]">
          {summaries.map(({ campaign, versionCount, latestReadinessState, latestCreatedAt }) => (
            <li key={campaign.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6 text-foreground">
                    {campaign.name}
                  </p>
                  {campaign.jurisdiction ? (
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {campaign.jurisdiction}
                    </p>
                  ) : null}
                </div>
                {latestReadinessState ? (
                  <span
                    className={cn(
                      "inline-flex min-h-8 shrink-0 rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                      readinessBadgeClass(latestReadinessState)
                    )}
                  >
                    {readinessLabel(latestReadinessState, language)}
                  </span>
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                    {t("campaigns.columns.versions")}
                  </dt>
                  <dd className="mt-1 font-mono text-subtle">{versionCount}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                    {t("campaigns.columns.lastRun")}
                  </dt>
                  <dd className="mt-1 text-subtle">
                    {latestCreatedAt ? formatDate(latestCreatedAt, language) : "—"}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/app/campaigns/${campaign.id}`}
                className="mt-4 inline-flex min-h-9 items-center gap-1 rounded-sm border border-accent/25 bg-background px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/45 hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {t("common.view")}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <table className="hidden w-full border-collapse text-left text-sm sm:table">
        <thead className="bg-background">
          <tr>
            <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("campaigns.columns.campaign")}</th>
            <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("campaigns.columns.versions")}</th>
            <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("campaigns.columns.latestState")}</th>
            <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("campaigns.columns.lastRun")}</th>
            <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {summaries.map(({ campaign, versionCount, latestReadinessState, latestCreatedAt }) => (
            <tr key={campaign.id} className="hairline-b hover:bg-surface/40 transition-colors">
              <td className="px-5 py-4">
                <p className="text-[14px] font-medium text-foreground tracking-tighter2">{campaign.name}</p>
                {campaign.jurisdiction ? (
                  <p className="mt-0.5 text-xs text-muted font-mono">{campaign.jurisdiction}</p>
                ) : null}
              </td>
              <td className="px-5 py-4 font-mono text-[12px] text-subtle">{versionCount}</td>
              <td className="px-5 py-4">
                {latestReadinessState ? (
                  <span
                    className={cn(
                      "inline-flex rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                      readinessBadgeClass(latestReadinessState)
                    )}
                  >
                    {readinessLabel(latestReadinessState, language)}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="px-5 py-4 text-[12px] text-subtle">
                {latestCreatedAt ? formatDate(latestCreatedAt, language) : "—"}
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/app/campaigns/${campaign.id}`}
                  className="inline-flex min-h-8 items-center gap-1 rounded-sm px-1 text-xs text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  {t("common.view")}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CampaignVersionList({
  campaignId,
  workspaceOwners
}: {
  campaignId: string;
  workspaceOwners: OwnerOverrides;
}) {
  const { language, t } = useI18n();
  const [state, setState] = useState<CampaignVersionListState | null>(null);

  const refreshCampaign = useCallback(() => {
    setState({
      campaign: getCampaign(campaignId),
      versions: listVersions(campaignId)
    });
  }, [campaignId]);

  useEffect(() => {
    let active = true;

    function refreshIfActive() {
      if (!active) return;
      refreshCampaign();
    }

    const timeoutId = window.setTimeout(refreshIfActive, 0);
    window.addEventListener("storage", refreshIfActive);
    window.addEventListener(
      PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT,
      refreshIfActive
    );
    window.addEventListener(
      PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
      refreshIfActive
    );

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", refreshIfActive);
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT,
        refreshIfActive
      );
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
        refreshIfActive
      );
    };
  }, [refreshCampaign]);

  if (state === null) return null;

  if (!state.campaign) {
    return (
      <div className="rounded-sm hairline border bg-surface/60 p-8 text-center text-sm text-subtle">
        {t("common.campaignNotFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {t("campaigns.detailEyebrow")}
        </p>
        <h2 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">{state.campaign.name}</h2>
        {state.campaign.jurisdiction ? (
          <p className="mt-1 text-[13px] text-subtle">{state.campaign.jurisdiction}</p>
        ) : null}
        <p className="mt-1 font-mono text-xs text-muted">
          {t("campaigns.created", {
            date: formatDate(state.campaign.createdAt, language),
            count: state.versions.length,
            versionWord:
              state.versions.length === 1
                ? t("campaigns.versionSingular")
                : t("campaigns.versionPlural")
          })}
        </p>
      </header>

      <OwnerOverridePanel
        campaign={state.campaign}
        onSaved={refreshCampaign}
        workspaceOwners={workspaceOwners}
      />

      <div className="overflow-hidden rounded-sm hairline border bg-surface/60">
        <div className="hairline-b px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-foreground">
            {t("campaigns.versionsTitle")}
          </h3>
          <p className="mt-1 text-xs leading-5 text-subtle">
            {t("campaigns.versionsSubtitle")}
          </p>
        </div>
        <div className="sm:hidden">
          <ul className="divide-y divide-white/[0.06]">
            {[...state.versions].reverse().map((version) => (
              <li key={version.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      v{version.n}
                    </p>
                    <p className="mt-1 text-sm text-subtle">
                      {formatDate(version.createdAt, language)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex min-h-8 shrink-0 rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                      readinessBadgeClass(version.readinessState)
                    )}
                  >
                    {readinessLabel(version.readinessState, language)}
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs text-subtle">
                  {t("campaigns.blockers")}: {version.blockers.length}
                </p>
                <Link
                  href={`/app/campaigns/${campaignId}/versions/${version.n}`}
                  className="mt-4 inline-flex min-h-9 items-center gap-1 rounded-sm border border-accent/25 bg-background px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/45 hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  {version.n > 1 ? t("common.viewDiff") : t("common.view")}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <table className="hidden w-full border-collapse text-left text-sm sm:table">
          <thead className="bg-background">
            <tr>
              <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("campaigns.version")}</th>
              <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("campaigns.readinessState")}</th>
              <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("campaigns.blockers")}</th>
              <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("campaigns.createdColumn")}</th>
              <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {[...state.versions].reverse().map((version) => (
              <tr key={version.id} className="hairline-b hover:bg-surface/40 transition-colors">
                <td className="px-5 py-4 font-mono text-[12px] text-subtle">v{version.n}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                      readinessBadgeClass(version.readinessState)
                    )}
                  >
                    {readinessLabel(version.readinessState, language)}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-[12px] text-subtle">
                  {version.blockers.length}
                </td>
                <td className="px-5 py-4 text-[12px] text-subtle">
                  {formatDate(version.createdAt, language)}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/app/campaigns/${campaignId}/versions/${version.n}`}
                    className="inline-flex min-h-8 items-center gap-1 rounded-sm px-1 text-xs text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  >
                    {version.n > 1 ? t("common.viewDiff") : t("common.view")}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
