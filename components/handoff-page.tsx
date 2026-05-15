"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  ExternalLink,
  FileDown,
  Send,
  Shield
} from "lucide-react";
import { RiskReportSchema, type RiskReport as RiskReportData } from "@/schemas/index";
import {
  PROMO_PREFLIGHT_DRAFT_KEY,
  PROMO_PREFLIGHT_REPORT_KEY
} from "@/lib/demo-storage";
import { formatMarkdownExport } from "@/lib/export";
import { generateLaunchReadiness } from "@/lib/readiness";
import { useI18n } from "@/lib/i18n";
import { listCampaigns, listVersions } from "@/lib/versioning";
import { cn } from "@/lib/utils";

type MentionLevel = "owners" | "leads" | "full";
type Tone = "neutral" | "urgent" | "friendly";

const ownerFallbackByCheckId: Record<string, string> = {
  channel_consistency: "crm",
  terms_robustness: "legal",
  offer_math_sanity: "product",
  jurisdictional_risk_signals: "risk",
  localization_qa: "localization",
  launch_ownership: "product",
  link_qa: "analytics"
};

function formatOwnerRole(role: string): string {
  if (role === "crm") {
    return "CRM";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSavedReport(fallbackReport: RiskReportData): RiskReportData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedReport = window.localStorage.getItem(PROMO_PREFLIGHT_REPORT_KEY);

  if (!savedReport) {
    return fallbackReport;
  }

  try {
    const parsed = JSON.parse(savedReport) as unknown;
    const reportCandidate =
      isRecord(parsed) && "report" in parsed ? parsed.report : parsed;

    return RiskReportSchema.parse(reportCandidate);
  } catch {
    return fallbackReport;
  }
}

function getLaunchDate(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const savedDraft = window.localStorage.getItem(PROMO_PREFLIGHT_DRAFT_KEY);

  if (!savedDraft) {
    return "";
  }

  try {
    const parsed = JSON.parse(savedDraft) as unknown;

    if (
      isRecord(parsed) &&
      "metadata" in parsed &&
      isRecord(parsed.metadata)
    ) {
      const date = parsed.metadata.launchDate;

      if (typeof date === "string") {
        return date;
      }
    }
  } catch {
    // ignore
  }

  return "";
}

function getCompareUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const campaigns = listCampaigns();

  if (campaigns.length === 0) {
    return null;
  }

  const latestCampaign = campaigns[0];
  const versions = listVersions(latestCampaign.id);

  if (versions.length === 0) {
    return null;
  }

  const latestVersion = versions[versions.length - 1];

  if (latestVersion.n <= 1) {
    return null;
  }

  return `/app/campaigns/${latestCampaign.id}/versions/${latestVersion.n}`;
}

export function HandoffPage({
  fallbackReport
}: Readonly<{
  fallbackReport: RiskReportData;
}>) {
  const { t } = useI18n();
  const [report, setReport] = useState<RiskReportData | null>(null);
  const [launchDate, setLaunchDate] = useState<string>("");
  const [channel, setChannel] = useState("#promo-launches");
  const [mentionLevel, setMentionLevel] = useState<MentionLevel>("owners");
  const [includePassed, setIncludePassed] = useState(false);
  const [tone, setTone] = useState<Tone>("neutral");
  const [copied, setCopied] = useState(false);
  const [compareUrl, setCompareUrl] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setReport(getSavedReport(fallbackReport));
    setLaunchDate(getLaunchDate());
    setCompareUrl(getCompareUrl());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [fallbackReport]);

  const readiness = useMemo(() => {
    if (!report) {
      return null;
    }

    return generateLaunchReadiness({ report, owners: [] });
  }, [report]);

  const statusLabel = useMemo(() => {
    if (!readiness) {
      return t("handoff.statusNeedsReview");
    }

    if (readiness.state === "BLOCKED") {
      return t("handoff.statusNoGo");
    }

    if (readiness.state === "NEEDS_REVIEW") {
      return t("handoff.statusNeedsReview");
    }

    return t("handoff.statusGo");
  }, [readiness, t]);

  const statusColor = useMemo(() => {
    if (!readiness) {
      return "text-warn";
    }

    if (readiness.state === "BLOCKED") {
      return "text-fail";
    }

    if (readiness.state === "NEEDS_REVIEW") {
      return "text-warn";
    }

    return "text-pass";
  }, [readiness]);

  const blockers = useMemo(() => {
    if (!report) {
      return [];
    }

    return report.checkResults.flatMap((check) =>
      check.issues
        .filter((issue) => issue.blocker)
        .map((issue) => ({
          checkId: check.checkId,
          checkName: check.publicName,
          issue,
          owner:
            issue.ownerSuggestion ??
            ownerFallbackByCheckId[check.checkId] ??
            "product"
        }))
    );
  }, [report]);

  const warningsCount = useMemo(() => {
    if (!report) {
      return 0;
    }

    return report.counts.warn;
  }, [report]);

  const passedCount = useMemo(() => {
    if (!report) {
      return 0;
    }

    return report.counts.pass;
  }, [report]);

  const previewBorderClass = useMemo(() => {
    if (tone === "urgent") {
      return "border-warn/30";
    }

    if (tone === "friendly") {
      return "border-pass/30";
    }

    return "border-white/[0.07]";
  }, [tone]);

  const previewText = useMemo(() => {
    if (!report) {
      return "";
    }

    const lines: string[] = [];

    if (mentionLevel === "full") {
      lines.push("@channel");
      lines.push("");
    } else if (mentionLevel === "leads") {
      lines.push("cc: @Product @Legal @Risk");
      lines.push("");
    }

    lines.push(`*${report.campaignName}*`);
    lines.push("");
    lines.push(`Status: ${statusLabel}`);

    if (blockers.length > 0) {
      lines.push("");
      lines.push(`${t("handoff.blockers")}:`);

      for (const blocker of blockers) {
        const ownerLabel = formatOwnerRole(blocker.owner);
        lines.push(
          `• ${blocker.issue.detectedIssue} — @${ownerLabel}`
        );
      }
    }

    if (warningsCount > 0) {
      lines.push("");
      lines.push(`${t("handoff.warnings")}: ${warningsCount}`);
    }

    if (includePassed && passedCount > 0) {
      lines.push("");
      lines.push(`Passed checks: ${passedCount}`);
    }

    if (launchDate) {
      lines.push("");
      lines.push(`${t("handoff.targetLaunch")}: ${launchDate}`);
    }

    return lines.join("\n");
  }, [
    report,
    statusLabel,
    blockers,
    warningsCount,
    passedCount,
    launchDate,
    t,
    includePassed,
    mentionLevel
  ]);

  const markdownContent = useMemo(() => {
    if (!report) {
      return "";
    }

    return formatMarkdownExport({
      report,
      readiness: readiness ?? undefined,
      format: "markdown",
      includeSourceExcerpts: false
    });
  }, [report, readiness]);

  async function handleCopy() {
    if (!previewText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleExportMd() {
    if (!markdownContent) {
      return;
    }

    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report?.campaignName ?? "handoff"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <Send className="h-7 w-7 text-subtle" />
        </div>
        <h2 className="display mt-6 text-xl text-foreground">
          {t("handoff.emptyTitle")}
        </h2>
        <p className="mt-2 max-w-[36ch] text-sm text-subtle">
          {t("handoff.emptySubtitle")}
        </p>
        <Link
          href="/app/intake"
          className="mt-6 inline-flex items-center gap-2 rounded border border-white/[0.07] bg-surface px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-accent/40 hover:text-accent"
        >
          {t("handoff.goToIntake")}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-10 py-10 space-y-6" data-tour="handoff-summary">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            {t("handoff.eyebrow")}
          </p>
          <h2 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">
            {t("handoff.title")}
          </h2>
          <p className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.55] text-subtle">
            {t("handoff.subtitle")}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {t("handoff.preview")}
          </h3>
          <div
            className={cn(
              "rounded border p-5 transition-colors",
              previewBorderClass,
              "bg-surface"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted">
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {t("handoff.botName")}
                  </span>
                  <span className="text-xs text-muted" suppressHydrationWarning>
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-subtle">{channel}</div>

                <div className="mt-3 space-y-3 text-sm text-foreground/80">
                  <p className="font-semibold text-foreground">
                    {report.campaignName}
                  </p>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        statusColor
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {blockers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted">
                        {t("handoff.blockers")}
                      </p>
                      <ul className="mt-1 space-y-1">
                        {blockers.map((blocker, index) => {
                          const ownerLabel = formatOwnerRole(blocker.owner);
                          return (
                            <li
                              key={index}
                              className="text-xs text-subtle"
                            >
                              • {blocker.issue.detectedIssue} —{" "}
                              <span className="text-info">
                                @{ownerLabel}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {warningsCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-warn">
                        {warningsCount} {t("handoff.warnings")}
                      </span>
                    </div>
                  )}

                  {includePassed && passedCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-pass">
                        {passedCount} passed
                      </span>
                    </div>
                  )}

                  {launchDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">
                        {t("handoff.targetLaunch")}:
                      </span>
                      <span className="text-xs text-subtle">
                        {launchDate}
                      </span>
                    </div>
                  )}

                  <Link
                    href="/app/risk-report"
                    className="inline-flex items-center gap-1.5 text-xs text-accent transition hover:underline"
                  >
                    {t("handoff.openReport")}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-white/[0.07] bg-surface p-5 space-y-5">
            <div>
              <label className="block text-xs font-medium text-subtle">
                {t("handoff.channel")}
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-2 w-full rounded border border-white/[0.07] bg-page px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              >
                <option value="#promo-launches">#promo-launches</option>
                <option value="#general">#general</option>
                <option value="#releases">#releases</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-subtle">
                {t("handoff.mentionLevel")}
              </label>
              <div className="mt-2 space-y-2">
                {(
                  [
                    {
                      value: "owners" as const,
                      label: t("handoff.mentionOwners")
                    },
                    {
                      value: "leads" as const,
                      label: t("handoff.mentionLeads")
                    },
                    {
                      value: "full" as const,
                      label: t("handoff.mentionFull")
                    }
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="mentionLevel"
                      value={opt.value}
                      checked={mentionLevel === opt.value}
                      onChange={() => setMentionLevel(opt.value)}
                      className="h-3.5 w-3.5 accent-accent"
                    />
                    <span className="text-sm text-subtle">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePassed}
                onChange={(e) => setIncludePassed(e.target.checked)}
                className="h-3.5 w-3.5 accent-accent rounded"
              />
              <span className="text-sm text-subtle">
                {t("handoff.includePassed")}
              </span>
            </label>

            <div>
              <label className="block text-xs font-medium text-subtle">
                {t("handoff.tone")}
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="mt-2 w-full rounded border border-white/[0.07] bg-page px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              >
                <option value="neutral">
                  {t("handoff.toneNeutral")}
                </option>
                <option value="urgent">
                  {t("handoff.toneUrgent")}
                </option>
                <option value="friendly">
                  {t("handoff.toneFriendly")}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 hairline-t">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded border border-white/[0.07] bg-surface px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-accent/40 hover:text-accent"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? t("handoff.copied") : t("handoff.copyBtn")}
        </button>
        <button
          type="button"
          onClick={handleExportMd}
          className="inline-flex items-center gap-2 rounded border border-white/[0.07] bg-surface px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-accent/40 hover:text-accent"
        >
          <FileDown className="h-3.5 w-3.5" />
          {t("handoff.exportBtn")}
        </button>
        {compareUrl ? (
          <Link
            href={compareUrl}
            className="ml-auto inline-flex items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-semibold text-ink transition hover:bg-accent/90"
          >
            {t("handoff.compareBtn")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <div className="ml-auto text-right">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded bg-accent/40 px-4 py-2 text-sm font-semibold text-ink/40 cursor-not-allowed"
            >
              {t("handoff.compareBtn")}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <p className="mt-2 text-xs text-muted">
              {t("handoff.compareHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
