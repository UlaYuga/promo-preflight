"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Copy,
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
type ReportSource = "saved" | "fallback";
type LoadedHandoffReport = {
  report: RiskReportData;
  source: ReportSource;
  notice: "saved" | "missing" | "invalid";
};

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

function pluralRu(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }

  return many;
}

function formatBlockerCount(count: number, language: string) {
  if (language === "ru") {
    return `${count} ${pluralRu(count, "блокер", "блокера", "блокеров")}`;
  }

  return `${count} ${count === 1 ? "Blocker" : "Blockers"}`;
}

function formatWarningCount(count: number, language: string) {
  if (language === "ru") {
    return `${count} ${pluralRu(count, "предупреждение", "предупреждения", "предупреждений")}`;
  }

  return `${count} ${count === 1 ? "Warning" : "Warnings"}`;
}

function formatMoreBlockers(count: number, language: string) {
  if (language === "ru") {
    return `+${count} ${pluralRu(count, "ещё блокер", "ещё блокера", "ещё блокеров")}`;
  }

  return `+${count} ${count === 1 ? "more blocker" : "more blockers"}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function loadHandoffReport(
  fallbackReport: RiskReportData
): LoadedHandoffReport | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedReport = window.localStorage.getItem(PROMO_PREFLIGHT_REPORT_KEY);

  if (!savedReport) {
    return { report: fallbackReport, source: "fallback", notice: "missing" };
  }

  try {
    const parsed = JSON.parse(savedReport) as unknown;
    const reportCandidate =
      isRecord(parsed) && "report" in parsed ? parsed.report : parsed;

    return {
      report: RiskReportSchema.parse(reportCandidate),
      source: "saved",
      notice: "saved"
    };
  } catch {
    return { report: fallbackReport, source: "fallback", notice: "invalid" };
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
  const { language, t } = useI18n();
  const [report, setReport] = useState<RiskReportData | null>(fallbackReport);
  const [source, setSource] = useState<ReportSource>("fallback");
  const [sourceNotice, setSourceNotice] =
    useState<LoadedHandoffReport["notice"]>("missing");
  const [launchDate, setLaunchDate] = useState<string>("");
  const [channel, setChannel] = useState("#promo-launches");
  const [mentionLevel, setMentionLevel] = useState<MentionLevel>("owners");
  const [includePassed, setIncludePassed] = useState(false);
  const [tone, setTone] = useState<Tone>("neutral");
  const [copied, setCopied] = useState(false);
  const [compareUrl, setCompareUrl] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const loaded = loadHandoffReport(fallbackReport);
    setReport(loaded?.report ?? null);
    setSource(loaded?.source ?? "fallback");
    setSourceNotice(loaded?.notice ?? "missing");
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

  const statusPanelClass = useMemo(() => {
    if (!readiness) {
      return "border-warn/25 bg-warn/10";
    }

    if (readiness.state === "BLOCKED") {
      return "border-fail/25 bg-fail/10";
    }

    if (readiness.state === "NEEDS_REVIEW") {
      return "border-warn/25 bg-warn/10";
    }

    return "border-pass/25 bg-pass/10";
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
    const copyLabels =
      language === "ru"
        ? {
            status: "Решение",
            blockers: "Блокеры",
            warnings: "Предупреждения",
            passed: "Пройденные проверки"
          }
        : {
            status: "Status",
            blockers: t("handoff.blockers"),
            warnings: t("handoff.warnings"),
            passed: "Passed checks"
          };

    if (mentionLevel === "full") {
      lines.push("@channel");
      lines.push("");
    } else if (mentionLevel === "leads") {
      lines.push("cc: @Product @Legal @Risk");
      lines.push("");
    }

    lines.push(`*${report.campaignName}*`);
    lines.push("");
    lines.push(`${copyLabels.status}: ${statusLabel}`);

    if (blockers.length > 0) {
      lines.push("");
      lines.push(`${copyLabels.blockers}:`);

      for (const blocker of blockers) {
        const ownerLabel = formatOwnerRole(blocker.owner);
        lines.push(
          `• ${blocker.issue.detectedIssue} — @${ownerLabel}`
        );
      }
    }

    if (warningsCount > 0) {
      lines.push("");
      lines.push(`${copyLabels.warnings}: ${warningsCount}`);
    }

    if (includePassed && passedCount > 0) {
      lines.push("");
      lines.push(`${copyLabels.passed}: ${passedCount}`);
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
    language,
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
    a.download = `${report?.campaignName ?? "final-package"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const ui = language === "ru"
    ? {
        mainAction: "Копировать сообщение",
        copied: "Сообщение скопировано",
        secondaryAction: "Скачать Markdown",
        reviewAction: "Открыть отчёт",
        nextAction: "Открыть готовность",
        finalPackage: "Финальный пакет",
        previewTitle: "Сообщение для Slack",
        blockerActions: "Что закрыть",
        passedChecks: "Пройденные проверки",
        settingsTitle: "Параметры сообщения",
        settingsBody: "Эти параметры меняют текст передачи. Главное действие — скопировать сообщение.",
        detailsTitle: "Детали и экспорт",
        moreBlockers: "ещё блокеров",
        nonBlocking: "Не блокирует",
        noBlockers: "Блокеров нет",
        statusLabel: "Решение",
        channelLabel: "Куда отправить",
        mentionLabel: "Кого позвать",
        toneLabel: "Как звучит",
        sampleNotice: "Показан тестовый пример. Сохранённый отчёт появится здесь после проверки.",
        invalidNotice: "Сохранённый отчёт не прочитан, поэтому показан тестовый пример.",
        savedNotice: "Используется сохранённый отчёт из текущего демо.",
        compareDisabled: "Сравнение появится после 2 сохранённых версий."
      }
    : {
        mainAction: "Copy Slack Update",
        copied: "Slack Update Copied",
        secondaryAction: "Download Markdown",
        reviewAction: "Open Risk Report",
        nextAction: "Open Readiness",
        finalPackage: "Final package",
        previewTitle: "What Goes to Slack",
        blockerActions: "Actions to Close",
        passedChecks: "Passed checks",
        settingsTitle: "Delivery Settings",
        settingsBody: "These options change the final package text. The primary action is copying the Slack update.",
        detailsTitle: "Details & Export",
        moreBlockers: "more blockers",
        nonBlocking: "Non-blocking",
        noBlockers: "No blockers",
        statusLabel: "Decision",
        channelLabel: "Where to Send",
        mentionLabel: "Who to Mention",
        toneLabel: "Tone",
        sampleNotice: "Showing the sample final package. A saved report appears here after a check.",
        invalidNotice: "The saved report could not be read, so the sample final package is shown.",
        savedNotice: "Using the saved report from this browser demo.",
        compareDisabled: "Comparison unlocks after 2 saved versions."
      };

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <Send className="h-7 w-7 text-subtle" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-foreground">
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

  const visibleBlockers = blockers.slice(0, 3);
  const remainingBlockerCount = Math.max(0, blockers.length - visibleBlockers.length);
  const sourceMessage =
    sourceNotice === "saved"
      ? ui.savedNotice
      : sourceNotice === "invalid"
        ? ui.invalidNotice
        : ui.sampleNotice;

  return (
    <div className="space-y-6 px-5 py-6 sm:px-8 lg:px-10 lg:py-8" data-tour="handoff-summary">
      <header>
        <div>
          <p className="text-sm font-medium text-muted">
            {t("handoff.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
            {t("handoff.title")}
          </h1>
          <p className="mt-3 max-w-[62ch] text-base leading-7 text-subtle">
            {t("handoff.subtitle")}
          </p>
        </div>
      </header>

      <section className={cn("rounded-lg border p-5 sm:p-6", statusPanelClass)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground/70">
              {ui.finalPackage}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className={cn("text-2xl font-semibold tracking-normal", statusColor)}>
                {statusLabel}
              </h2>
              <span className="rounded border border-white/[0.08] bg-background/70 px-3 py-1.5 text-sm font-medium text-subtle">
                {blockers.length > 0
                  ? formatBlockerCount(blockers.length, language)
                  : ui.noBlockers}
              </span>
              {warningsCount > 0 ? (
                <span className="rounded border border-warn/30 bg-warn/10 px-3 py-1.5 text-sm font-medium text-warn">
                  {formatWarningCount(warningsCount, language)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? ui.copied : ui.mainAction}
            </button>
            <Link
              href="/app/readiness"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/[0.09] bg-background/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              {ui.nextAction}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <p className="mt-5 rounded border border-white/[0.07] bg-background/60 px-4 py-3 text-sm leading-6 text-subtle">
          {sourceMessage}
        </p>

        <div
          className={cn(
            "mt-5 rounded-lg border bg-background p-4 transition-colors sm:p-5",
            previewBorderClass
          )}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {ui.previewTitle}
            </h2>
            <span className="rounded border border-white/[0.07] bg-page px-3 py-1.5 text-sm font-medium text-subtle">
              {channel}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-accent-muted">
              <Shield className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-base font-semibold text-foreground">
                  {t("handoff.botName")}
                </span>
                <span className="text-sm text-muted" suppressHydrationWarning>
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="mt-5 space-y-4 text-base leading-7 text-foreground/85">
                <p className="text-lg font-semibold text-foreground">
                  {report.campaignName}
                </p>

                <p className={cn("text-base font-semibold", statusColor)}>
                  {statusLabel}
                </p>

                {blockers.length > 0 ? (
                  <div>
                    <p className="font-semibold text-foreground">
                      {t("handoff.blockers")}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {visibleBlockers.map((blocker, index) => {
                        const ownerLabel = formatOwnerRole(blocker.owner);
                        return (
                          <li
                            key={index}
                            className="rounded border border-white/[0.06] bg-surface/70 px-3 py-2 text-sm leading-6 text-subtle"
                          >
                            {blocker.issue.detectedIssue}{" "}
                            <span className="font-medium text-info">
                              @{ownerLabel}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {remainingBlockerCount > 0 ? (
                      <p className="mt-3 text-sm text-muted">
                        {formatMoreBlockers(remainingBlockerCount, language)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {warningsCount > 0 ? (
                  <p className="text-sm font-medium text-warn">
                    {formatWarningCount(warningsCount, language)}
                  </p>
                ) : null}

                {includePassed && passedCount > 0 ? (
                  <p className="text-sm font-medium text-pass">
                    {passedCount} {ui.passedChecks}
                  </p>
                ) : null}

                {launchDate ? (
                  <p className="text-sm text-subtle">
                    {t("handoff.targetLaunch")}:{" "}
                    <span className="font-medium text-foreground/80">{launchDate}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-white/[0.07] bg-surface/60 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {ui.blockerActions}
              </h2>
              <span className="rounded border border-white/[0.07] bg-background px-3 py-1.5 text-sm font-medium text-subtle">
                {blockers.length}
              </span>
            </div>
            {visibleBlockers.length > 0 ? (
              <div className="grid gap-3">
                {visibleBlockers.map((blocker, index) => (
                  <Link
                    key={`${blocker.checkId}-${index}`}
                    href="/app/risk-report"
                    className="group rounded border border-white/[0.07] bg-background p-4 transition hover:border-accent/40 hover:bg-overlay/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-base font-semibold leading-6 text-foreground">
                          {blocker.issue.detectedIssue}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-subtle">
                          {blocker.issue.suggestedFix}
                        </p>
                      </div>
                      <span className="shrink-0 rounded border border-fail/30 bg-fail/10 px-3 py-1.5 text-sm font-semibold text-fail">
                        @{formatOwnerRole(blocker.owner)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded border border-white/[0.07] bg-background px-4 py-5 text-base text-subtle">
                {ui.noBlockers}
              </p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <details className="group rounded-lg border border-white/[0.07] bg-surface p-5">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-lg font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 [&::-webkit-details-marker]:hidden">
              <span>{ui.detailsTitle}</span>
              <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={handleExportMd}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded border border-white/[0.09] bg-background/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <FileDown className="h-4 w-4" aria-hidden="true" />
                {ui.secondaryAction}
              </button>
              <Link
                href="/app/risk-report"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded border border-white/[0.09] bg-background/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {ui.reviewAction}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span
                data-qa="handoff-source-badge"
                className="block rounded border border-white/[0.07] bg-background px-3 py-3 text-sm font-medium text-subtle"
              >
                {source === "saved"
                  ? t("handoff.savedReport")
                  : t("handoff.offlineSample")}
              </span>
              {compareUrl ? (
                <Link
                  href={compareUrl}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded border border-white/[0.09] bg-background/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  {t("handoff.compareBtn")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <p className="rounded border border-white/[0.07] bg-background px-3 py-3 text-sm leading-6 text-muted">
                  {ui.compareDisabled}
                </p>
              )}
            </div>
          </details>

          <details className="group rounded-lg border border-white/[0.07] bg-surface p-5">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-lg font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 [&::-webkit-details-marker]:hidden">
              <span>{ui.settingsTitle}</span>
              <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-5 space-y-5">
              <p className="text-sm leading-6 text-subtle">
                {ui.settingsBody}
              </p>

              <div>
                <label className="block text-sm font-semibold text-foreground/80">
                  {ui.channelLabel}
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="mt-2 w-full rounded border border-white/[0.07] bg-page px-3 py-3 text-base text-foreground outline-none focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/20"
                >
                  <option value="#promo-launches">#promo-launches</option>
                  <option value="#general">#general</option>
                  <option value="#releases">#releases</option>
                </select>
              </div>

              <div>
                <p className="block text-sm font-semibold text-foreground/80">
                  {ui.mentionLabel}
                </p>
                <div className="mt-2 grid gap-2">
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
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm font-medium transition",
                        mentionLevel === opt.value
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-white/[0.07] bg-background text-subtle hover:text-foreground"
                      )}
                    >
                      <input
                        type="radio"
                        name="mentionLevel"
                        value={opt.value}
                        checked={mentionLevel === opt.value}
                        onChange={() => setMentionLevel(opt.value)}
                        className="h-4 w-4 accent-accent"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded border border-white/[0.07] bg-background px-3 py-2 text-sm font-medium text-subtle transition hover:text-foreground">
                <input
                  type="checkbox"
                  checked={includePassed}
                  onChange={(e) => setIncludePassed(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent"
                />
                <span>
                  {t("handoff.includePassed")}
                </span>
              </label>

              <div>
                <label className="block text-sm font-semibold text-foreground/80">
                  {ui.toneLabel}
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="mt-2 w-full rounded border border-white/[0.07] bg-page px-3 py-3 text-base text-foreground outline-none focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/20"
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
          </details>
        </div>
      </div>
    </div>
  );
}
