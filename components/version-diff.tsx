"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT
} from "@/lib/demo-storage";
import { useI18n } from "@/lib/i18n";
import { formatOwnerRoleLabel, resolveOwner } from "@/lib/owners/resolver";
import { getCampaign, getVersion, listVersions, diffVersions } from "@/lib/versioning";
import { cn } from "@/lib/utils";
import type { OwnerRole } from "@/schemas/index";
import type { OwnerOverrides } from "@/schemas/owners";
import type { CampaignRecord, CampaignVersion, VersionDiffEntry } from "@/schemas/versioning";

type VersionDetailState = {
  campaign: CampaignRecord | null;
  version: CampaignVersion | null;
  prevVersion: CampaignVersion | null;
  diff: VersionDiffEntry[];
};

function diffStatusClass(status: VersionDiffEntry["diffStatus"]) {
  if (status === "new") return "border-warn/30 bg-warn/10 text-warn";
  if (status === "resolved") return "border-pass/30 bg-pass/10 text-pass";
  if (status === "still_open") return "border-fail/30 bg-fail/10 text-fail";
  return "border-accent/40 bg-accent/10 text-accent";
}

function severityClass(severity: VersionDiffEntry["severity"]) {
  if (severity === "CRITICAL") return "border-fail/30 bg-fail/10 text-fail";
  if (severity === "HIGH") return "border-fail/30 bg-fail/10 text-fail";
  if (severity === "MEDIUM") return "border-warn/30 bg-warn/10 text-warn";
  return "border-white/[0.07] bg-surface text-subtle";
}

function readinessBadgeClass(state: CampaignVersion["readinessState"]) {
  if (state === "READY") return "border-pass/30 bg-pass/10 text-pass";
  if (state === "READY_WITH_WARNINGS") return "border-warn/30 bg-warn/10 text-warn";
  if (state === "BLOCKED") return "border-fail/30 bg-fail/10 text-fail";
  return "border-white/[0.07] bg-surface text-subtle";
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export function VersionDetail({
  campaignId,
  n,
  workspaceOwners
}: {
  campaignId: string;
  n: number;
  workspaceOwners: OwnerOverrides;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<VersionDetailState | null>(null);

  useEffect(() => {
    let active = true;

    function refreshVersion() {
      if (!active) return;

      const campaign = getCampaign(campaignId);
      const version = getVersion(campaignId, n);
      const prevVersion = n > 1 ? getVersion(campaignId, n - 1) : null;
      const earlierVersions = listVersions(campaignId).filter(
        (item) => item.n < n - 1
      );

      setState({
        campaign,
        version,
        prevVersion,
        diff: version && prevVersion
          ? diffVersions(prevVersion, version, earlierVersions)
          : []
      });
    }

    const timeoutId = window.setTimeout(refreshVersion, 0);
    window.addEventListener("storage", refreshVersion);
    window.addEventListener(
      PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
      refreshVersion
    );

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", refreshVersion);
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
        refreshVersion
      );
    };
  }, [campaignId, n]);

  if (state === null) return null;

  if (!state.campaign || !state.version) {
    return (
      <div className="rounded-sm hairline border bg-surface/60 p-8 text-center text-sm text-subtle">
        {t("common.versionNotFound")}
      </div>
    );
  }

  const { campaign, version, prevVersion, diff } = state;
  const resolvedCount = diff.filter((d) => d.diffStatus === "resolved").length;
  const newCount = diff.filter((d) => d.diffStatus === "new").length;
  const reopenedCount = diff.filter((d) => d.diffStatus === "reopened").length;
  const stillOpenCount = diff.filter((d) => d.diffStatus === "still_open").length;

  return (
    <div className="space-y-8">
      <header>
        <Link
          href={`/app/campaigns/${campaignId}`}
          className="inline-flex items-center gap-1.5 text-[11px] text-subtle hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("versionDiff.backToCampaign", { campaignName: campaign.name })}
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {t("versionDiff.eyebrow")}
            </p>
            <h2 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">
              {campaign.name} · v{version.n}
            </h2>
            <p className="mt-1 text-[13px] text-subtle">
              {formatDate(version.createdAt)}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex rounded-sm border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
              readinessBadgeClass(version.readinessState)
            )}
          >
            {version.readinessState.replace(/_/g, " ")}
          </span>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: t("versionDiff.overall"), value: version.extractedFacts.overallStatus },
          { label: "PASS", value: String(version.extractedFacts.counts.pass) },
          { label: "WARN", value: String(version.extractedFacts.counts.warn) },
          { label: "FAIL", value: String(version.extractedFacts.counts.fail) }
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-sm hairline border bg-surface/60 px-5 py-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p>
            <p className="display mt-2 text-[28px] tracking-tighter2 text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {prevVersion ? (
        <section data-tour="version-diff">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                {t("versionDiff.diffTitle", {
                  prev: prevVersion.n,
                  current: version.n
                })}
              </h3>
              <p className="mt-1 font-mono text-[10px] text-muted">
                {t("versionDiff.diffSummary", {
                  resolved: resolvedCount,
                  newCount,
                  reopened: reopenedCount,
                  stillOpen: stillOpenCount
                })}
              </p>
            </div>
          </div>

          {diff.length === 0 ? (
            <div className="rounded-sm border border-dashed border-white/[0.07] bg-surface/50 px-4 py-8 text-center text-sm text-subtle">
              {t("versionDiff.noBlockers")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-sm hairline border bg-surface/60">
              <table className="min-w-[680px] w-full border-collapse text-left text-sm">
                <thead className="bg-background">
                  <tr>
                    <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("versionDiff.columns.status")}</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("versionDiff.columns.check")}</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("versionDiff.columns.blocker")}</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("versionDiff.columns.severity")}</th>
                    <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("versionDiff.columns.owner")}</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.map((entry) => (
                    <tr
                      key={entry.stableKey}
                      className={cn(
                        "hairline-b align-top hover:bg-surface/40 transition-colors",
                        entry.diffStatus === "resolved" && "opacity-60"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            diffStatusClass(entry.diffStatus)
                          )}
                        >
                          {t(`versionDiff.statuses.${entry.diffStatus === "still_open" ? "stillOpen" : entry.diffStatus}` as never)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                        {entry.checkId}
                      </td>
                      <td className="max-w-[300px] px-5 py-3.5 text-[13px] text-subtle">
                        {entry.title}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            severityClass(entry.severity)
                          )}
                        >
                          {entry.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-subtle">
                        <ResolvedOwnerLabel
                          campaign={campaign}
                          ownerRole={entry.ownerRole}
                          workspaceOwners={workspaceOwners}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-sm hairline border bg-surface/60 px-5 py-5">
          <h3 className="text-[14px] font-semibold text-foreground">
            {t("versionDiff.baselineTitle")}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-muted">
            {t("versionDiff.diffSummary", {
              resolved: 0,
              newCount: 0,
              reopened: 0,
              stillOpen: version.blockers.length
            })}
          </p>
          {version.blockers.length === 0 ? (
            <p className="mt-3 text-sm text-subtle">{t("versionDiff.noBlockers")}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {version.blockers.map((blocker) => (
                <div
                  key={blocker.stableKey}
                  className="flex items-start justify-between gap-3 rounded-sm hairline border bg-background px-4 py-3.5"
                >
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      {blocker.checkId}
                    </p>
                    <p className="mt-1 text-[13px] text-subtle">{blocker.title}</p>
                    <div className="mt-2">
                      <ResolvedOwnerLabel
                        campaign={campaign}
                        ownerRole={blocker.ownerRole}
                        workspaceOwners={workspaceOwners}
                      />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                      severityClass(blocker.severity)
                    )}
                  >
                    {blocker.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ResolvedOwnerLabel({
  campaign,
  ownerRole,
  workspaceOwners
}: Readonly<{
  campaign: CampaignRecord;
  ownerRole: OwnerRole | undefined;
  workspaceOwners: OwnerOverrides;
}>) {
  if (!ownerRole) {
    return <span className="text-muted">Unassigned</span>;
  }

  const owner = resolveOwner({
    ownerRole,
    ownerOverrides: campaign.ownerOverrides,
    workspaceOwners
  });

  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold",
        owner.assigned
          ? "border-white/[0.07] bg-surface text-subtle"
          : "border-warn/30 bg-warn/10 text-warn"
      )}
    >
      {formatOwnerRoleLabel(owner.ownerRole)}: {owner.ownerName}
    </span>
  );
}
