"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, FolderOpen } from "lucide-react";
import { OwnerOverridePanel } from "@/components/owner-override-panel";
import {
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT
} from "@/lib/demo-storage";
import { useI18n } from "@/lib/i18n";
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

function readinessLabel(state: CampaignVersion["readinessState"] | null) {
  if (!state) return null;
  if (state === "READY") return "Ready";
  if (state === "READY_WITH_WARNINGS") return "Ready w/ warnings";
  if (state === "BLOCKED") return "Blocked";
  return "Needs review";
}

function readinessBadgeClass(state: CampaignVersion["readinessState"] | null) {
  if (state === "READY") return "border-pass/30 bg-pass/10 text-pass";
  if (state === "READY_WITH_WARNINGS") return "border-warn/30 bg-warn/10 text-warn";
  if (state === "BLOCKED") return "border-fail/30 bg-fail/10 text-fail";
  return "border-white/[0.07] bg-surface text-subtle";
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function CampaignList() {
  const { t } = useI18n();
  const [summaries, setSummaries] = useState<CampaignSummary[] | null>(null);

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
      PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
      refreshCampaigns
    );

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", refreshCampaigns);
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
        refreshCampaigns
      );
    };
  }, []);

  if (summaries === null) {
    return (
      <div className="rounded-sm hairline border bg-surface/60 p-8 text-center text-sm text-subtle">
        {t("common.loading")}
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-white/[0.07] bg-surface/50 px-6 py-12 text-center">
        <FolderOpen className="mx-auto h-6 w-6 text-muted/60" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-foreground/80">
          {t("campaigns.emptyTitle")}
        </p>
        <p className="mt-2 max-w-sm mx-auto text-sm text-subtle">
          {t("campaigns.emptyDescription")}
        </p>
        <Link
          href="/app/intake?examples=1"
          className="mt-5 inline-flex items-center gap-2 rounded-sm hairline border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/20"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {t("intake.workedExamples")}
        </Link>
      </div>
    );
  }

  return (
    <div
      data-tour="campaign-versioning"
      className="overflow-hidden rounded-sm hairline border bg-surface/60"
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-background">
          <tr>
            <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("campaigns.columns.campaign")}</th>
            <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("campaigns.columns.versions")}</th>
            <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("campaigns.columns.latestState")}</th>
            <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("campaigns.columns.lastRun")}</th>
            <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {summaries.map(({ campaign, versionCount, latestReadinessState, latestCreatedAt }) => (
            <tr key={campaign.id} className="hairline-b hover:bg-surface/40 transition-colors">
              <td className="px-5 py-4">
                <p className="text-[14px] font-medium text-foreground tracking-tighter2">{campaign.name}</p>
                {campaign.jurisdiction ? (
                  <p className="mt-0.5 text-[11px] text-muted font-mono">{campaign.jurisdiction}</p>
                ) : null}
              </td>
              <td className="px-5 py-4 font-mono text-[12px] text-subtle">{versionCount}</td>
              <td className="px-5 py-4">
                {latestReadinessState ? (
                  <span
                    className={cn(
                      "inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                      readinessBadgeClass(latestReadinessState)
                    )}
                  >
                    {readinessLabel(latestReadinessState)}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="px-5 py-4 text-[12px] text-subtle">
                {latestCreatedAt ? formatDate(latestCreatedAt) : "—"}
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/app/campaigns/${campaign.id}`}
                  className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 transition-colors"
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
  const { t } = useI18n();
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
      PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
      refreshIfActive
    );

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", refreshIfActive);
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
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {t("campaigns.detailEyebrow")}
        </p>
        <h2 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">{state.campaign.name}</h2>
        {state.campaign.jurisdiction ? (
          <p className="mt-1 text-[13px] text-subtle">{state.campaign.jurisdiction}</p>
        ) : null}
        <p className="mt-1 font-mono text-[10px] text-muted">
          {t("campaigns.created", {
            date: formatDate(state.campaign.createdAt),
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
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-background">
            <tr>
              <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("campaigns.version")}</th>
              <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("campaigns.readinessState")}</th>
              <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("campaigns.blockers")}</th>
              <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("campaigns.createdColumn")}</th>
              <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {[...state.versions].reverse().map((version) => (
              <tr key={version.id} className="hairline-b hover:bg-surface/40 transition-colors">
                <td className="px-5 py-4 font-mono text-[12px] text-subtle">v{version.n}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                      readinessBadgeClass(version.readinessState)
                    )}
                  >
                    {readinessLabel(version.readinessState)}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-[12px] text-subtle">
                  {version.blockers.length}
                </td>
                <td className="px-5 py-4 text-[12px] text-subtle">
                  {formatDate(version.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/app/campaigns/${campaignId}/versions/${version.n}`}
                    className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 transition-colors"
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
