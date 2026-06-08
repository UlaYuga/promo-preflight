"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Copy,
  FileText,
  MessageSquareText
} from "lucide-react";
import { SaveCampaignPanel } from "@/components/save-campaign-panel";
import { LoadingState } from "@/components/ui-states";
import {
  LaunchReadinessSchema,
  OwnerSchema,
  RiskReportSchema,
  type CheckIssue,
  type CheckResult,
  type CheckSeverity,
  type CheckStatus,
  type ExportFormat,
  type LaunchReadiness,
  type Owner,
  type OwnerRole,
  type RiskReport as RiskReportData
} from "@/schemas/index";
import {
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
  PROMO_PREFLIGHT_DRAFT_KEY,
  PROMO_PREFLIGHT_REPORT_KEY
} from "@/lib/demo-storage";
import { formatExportPayload } from "@/lib/export";
import {
  generateLaunchReadiness,
  type ReadinessInputOwner
} from "@/lib/readiness";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { CHECK_DEFINITION_BY_ID } from "@/lib/checks/definitions";
import { SEVERITY_LABELS, CHECK_STATUS_LABELS, labelFor } from "@/lib/ui-labels";
import { runChecks } from "@/lib/checks/runner";
import { sampleCampaignBundle } from "@/schemas/fixtures";
import { CampaignBundleSchema } from "@/schemas/index";

type ReportSource = "saved" | "offline";

type IssueRow = {
  issue: CheckIssue;
  check: CheckResult;
};

const statusOrder: Record<CheckStatus, number> = {
  FAIL: 0,
  WARN: 1,
  PASS: 2,
  NOT_APPLICABLE: 3
};

const severityOrder: Record<CheckSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

export function RiskReport() {
  const { t, language } = useI18n();
  const localizedFallback = useMemo(() => {
    const offlineBundle = CampaignBundleSchema.parse(sampleCampaignBundle);
    return runChecks({ bundle: offlineBundle, mode: "offline", language });
  }, [language]);
  const localizedFallbackOwners = useMemo(
    () => parseOwners(sampleCampaignBundle.owners) ?? [],
    []
  );
  const [report, setReport] = useState<RiskReportData>(localizedFallback);
  const [owners, setOwners] = useState<ReadinessInputOwner[]>(
    localizedFallbackOwners
  );
  const [source, setSource] = useState<ReportSource>("offline");
  const [savedReportError, setSavedReportError] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadSavedReport = () => {
      const savedValue = window.localStorage.getItem(PROMO_PREFLIGHT_REPORT_KEY);

      if (!savedValue) {
        setReport(localizedFallback);
        setOwners(getStoredDraftOwners() ?? localizedFallbackOwners);
        setSource("offline");
        setSavedReportError(null);
        setHydrated(true);
        return;
      }

      try {
        const parsedValue = JSON.parse(savedValue) as unknown;
        const reportCandidate =
          isRecord(parsedValue) && "report" in parsedValue
            ? parsedValue.report
            : parsedValue;
        const validatedReport = RiskReportSchema.parse(reportCandidate);
        setReport(validatedReport);
        setOwners(
          getStoredDraftOwners() ??
            getOwnersFromUnknown(parsedValue) ??
            localizedFallbackOwners
        );
        setSource("saved");
        setSavedReportError(null);
      } catch {
        setReport(localizedFallback);
        setOwners(localizedFallbackOwners);
        setSource("offline");
        setSavedReportError(
          t("riskReport.savedReportInvalid")
        );
      }

      setHydrated(true);
    };

    loadSavedReport();
    window.addEventListener(
      PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
      loadSavedReport
    );

    return () => {
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
        loadSavedReport
      );
    };
  }, [t, localizedFallback, localizedFallbackOwners]);

  const sortedChecks = useMemo(
    () =>
      [...report.checkResults].sort((a, b) => {
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];

        if (statusDiff !== 0) {
          return statusDiff;
        }

        return a.publicName.localeCompare(b.publicName);
      }),
    [report.checkResults]
  );

  const issueRows = useMemo(
    () =>
      sortedChecks
        .flatMap((check) => check.issues.map((issue) => ({ check, issue })))
        .sort((a, b) => {
          const blockerDiff = Number(b.issue.blocker) - Number(a.issue.blocker);

          if (blockerDiff !== 0) {
            return blockerDiff;
          }

          const severityDiff =
            severityOrder[a.issue.severity] - severityOrder[b.issue.severity];

          if (severityDiff !== 0) {
            return severityDiff;
          }

          return a.check.publicName.localeCompare(b.check.publicName);
        }),
    [sortedChecks]
  );

  const selectedIssue =
    issueRows.find((row) => row.issue.issueId === selectedIssueId) ??
    issueRows[0] ??
    null;
  const effectiveSelectedIssueId = selectedIssue?.issue.issueId ?? null;
  const readiness = useMemo(
    () =>
      LaunchReadinessSchema.parse(
        generateLaunchReadiness({
          report,
          owners
        })
      ),
    [owners, report]
  );

  function useFallbackReport() {
    window.localStorage.removeItem(PROMO_PREFLIGHT_REPORT_KEY);
    setReport(localizedFallback);
    setOwners(localizedFallbackOwners);
    setSource("offline");
    setSavedReportError(null);
  }

  if (!hydrated) {
    return (
      <div className="px-10 py-10">
        <LoadingState label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="px-10 py-10 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            {t("riskReport.eyebrow")}
          </p>
          <h2 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">
            {t("riskReport.title")}
          </h2>
          <p className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.55] text-subtle">
            {t("riskReport.subtitle", { campaignName: report.campaignName })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm hairline border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
            {source === "saved" ? t("riskReport.savedReport") : t("riskReport.offlineSample")}
          </span>
          <SaveCampaignPanel report={report} />
        </div>
      </header>

      {savedReportError ? (
        <InvalidSavedReportNotice
          message={savedReportError}
          onUseFallback={useFallbackReport}
        />
      ) : null}

      <RiskSummaryBar readiness={readiness} report={report} />
      <RiskNextSteps />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <IssueTable
          rows={issueRows}
          selectedIssueId={effectiveSelectedIssueId}
          onSelectIssue={setSelectedIssueId}
        />
        <IssueDetailPanel row={selectedIssue} />
      </section>
    </div>
  );
}

function RiskNextSteps() {
  const { t } = useI18n();

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[64ch]">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {t("riskReport.nextStepsTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-subtle">
            {t("riskReport.nextStepsBody")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/readiness"
            className="inline-flex items-center gap-2 rounded border border-white/[0.07] bg-background px-3 py-2 text-xs font-medium text-foreground/80 transition hover:border-accent/40 hover:text-accent"
          >
            {t("riskReport.nextStepsReadiness")}
          </Link>
          <Link
            href="/app/handoff"
            className="inline-flex items-center gap-2 rounded border border-white/[0.07] bg-background px-3 py-2 text-xs font-medium text-foreground/80 transition hover:border-accent/40 hover:text-accent"
          >
            {t("riskReport.nextStepsHandoff")}
          </Link>
          <Link
            href="/app/campaigns"
            className="inline-flex items-center gap-2 rounded border border-white/[0.07] bg-background px-3 py-2 text-xs font-medium text-foreground/80 transition hover:border-accent/40 hover:text-accent"
          >
            {t("riskReport.nextStepsCampaigns")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function RiskSummaryBar({
  readiness,
  report
}: Readonly<{
  readiness: LaunchReadiness;
  report: RiskReportData;
}>) {
  const { t, language } = useI18n();
  const generatedAt = formatTimestamp(report.generatedAt, language);

  return (
    <section
      data-tour="risk-summary"
      className="hairline-b pb-4"
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        {/* Overall status */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t("riskReport.summary.overallStatus")}</p>
          <p className={cn(
            "mt-1 text-2xl font-bold tracking-tight",
            report.overallStatus === "PASS" && "text-pass",
            report.overallStatus === "WARN" && "text-warn",
            report.overallStatus === "FAIL" && "text-fail",
          )}>
            {labelFor(CHECK_STATUS_LABELS, report.overallStatus, language)}
          </p>
        </div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-overlay lg:block" />

        {/* Counts */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t("riskReport.summary.passWarnFail")}</p>
          <div className="mt-1.5 flex gap-2">
            <CountBadge label={labelFor(CHECK_STATUS_LABELS, "PASS", language)} count={report.counts.pass} status="PASS" />
            <CountBadge label={labelFor(CHECK_STATUS_LABELS, "WARN", language)} count={report.counts.warn} status="WARN" />
            <CountBadge label={labelFor(CHECK_STATUS_LABELS, "FAIL", language)} count={report.counts.fail} status="FAIL" />
            {report.counts.notApplicable > 0 ? (
              <CountBadge label={labelFor(CHECK_STATUS_LABELS, "NOT_APPLICABLE", language)} count={report.counts.notApplicable} status="NOT_APPLICABLE" />
            ) : null}
          </div>
        </div>

        <div className="hidden h-8 w-px bg-overlay lg:block" />

        {/* Blockers */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t("riskReport.summary.criticalBlockers")}</p>
          <p className={cn(
            "mt-1 text-2xl font-bold tracking-tight",
            report.counts.criticalBlockers > 0 ? "text-fail" : "text-pass"
          )}>
            {report.counts.criticalBlockers}
          </p>
        </div>

        <div className="hidden h-8 w-px bg-overlay lg:block" />

        {/* Generated */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t("riskReport.summary.generated")}</p>
          <p className="mt-1 text-[13px] font-medium text-subtle">{generatedAt}</p>
        </div>

        {/* Export pushed to the right */}
        <div className="ml-auto">
          <ExportControls readiness={readiness} report={report} />
        </div>
      </div>
    </section>
  );
}

function CountBadge({
  label,
  count,
  status
}: Readonly<{
  label: string;
  count: number;
  status: CheckStatus;
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold",
        statusBadgeClass(status)
      )}
    >
      {label}
      <span className="text-sm">{count}</span>
    </span>
  );
}

function ExportControls({
  readiness,
  report
}: Readonly<{
  readiness: LaunchReadiness;
  report: RiskReportData;
}>) {
  const { t } = useI18n();
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [showManualText, setShowManualText] = useState(false);
  const exportTextRef = useRef<HTMLTextAreaElement>(null);
  const exportText = useMemo(
    () =>
      formatExportPayload({
        format,
        includeSourceExcerpts: false,
        readiness,
        report
      }),
    [format, readiness, report]
  );
  const formatOptions: Array<{
    format: ExportFormat;
    label: string;
    icon: typeof FileText;
  }> = [
    { format: "markdown", label: "Markdown", icon: FileText },
    { format: "slack", label: "Slack", icon: MessageSquareText }
  ];

  async function handleCopy() {
    try {
      await copyTextToClipboard(exportText);
      setCopyStatus("success");
      setShowManualText(false);
    } catch {
      setCopyStatus("error");
      setShowManualText(true);
    }
  }

  function handleSelectExportText() {
    exportTextRef.current?.focus();
    exportTextRef.current?.select();
  }

  return (
    <div data-tour="export-controls">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {t("riskReport.export.title")}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        {formatOptions.map((option) => {
          const Icon = option.icon;
          const selected = format === option.format;

          return (
            <button
              key={option.format}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setFormat(option.format);
                setCopyStatus("idle");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[11px] font-medium transition",
                selected
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "hairline border bg-surface text-subtle hover:border-overlay hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-sm hairline border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-subtle transition hover:border-accent/40 hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {t("common.copy")}
        </button>
      </div>
      <p
        aria-live="polite"
        className={cn(
          "mt-2 min-h-5 text-xs",
          copyStatus === "success" && "text-pass",
          copyStatus === "error" && "text-fail",
          copyStatus === "idle" && "text-muted"
        )}
      >
        {copyStatus === "success"
          ? t("riskReport.export.copied", {
              format: format === "markdown" ? "Markdown" : "Slack"
            })
          : null}
        {copyStatus === "error"
          ? t("riskReport.export.failed")
          : null}
        {copyStatus === "idle" && showManualText
          ? t("riskReport.export.manualText")
          : null}
        {copyStatus === "idle" && !showManualText ? t("riskReport.export.copyReady") : null}
      </p>
      {showManualText ? (
        <div className="mt-3 rounded-sm hairline border bg-surface p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {t("riskReport.export.title")}
            </p>
            <button
              type="button"
              onClick={handleSelectExportText}
              className="inline-flex items-center justify-center rounded-sm hairline border bg-background px-2 py-1 text-[11px] font-medium text-subtle transition hover:border-accent/60 hover:text-foreground"
            >
              {t("common.view")}
            </button>
          </div>
          <textarea
            ref={exportTextRef}
            readOnly
            aria-label={t("riskReport.export.selectedTextAria")}
            value={exportText}
            className="h-40 w-full resize-y rounded-sm hairline border bg-background p-2 font-mono text-[11px] leading-5 text-subtle outline-none focus:border-accent/70"
          />
        </div>
      ) : null}
    </div>
  );
}

function IssueTable({
  rows,
  selectedIssueId,
  onSelectIssue
}: Readonly<{
  rows: IssueRow[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
}>) {
  const { t, language } = useI18n();
  return (
    <section data-tour="issue-detail">
      <div className="flex items-center justify-between gap-4 hairline-b pb-3 mb-0">
        <h3 className="text-[14px] font-semibold text-foreground">
          {t("riskReport.issueTable.title")}
        </h3>
        <span className="rounded-full bg-overlay px-2 py-0.5 font-mono text-[10px] text-subtle">
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2
            className="mx-auto h-5 w-5 text-pass"
            aria-hidden="true"
          />
          <p className="mt-3 text-[14px] font-semibold text-foreground">
            {t("riskReport.empty.noIssueSelected")}
          </p>
          <p className="mt-1 text-[12px] text-subtle">
            {t("riskReport.empty.description")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[620px] w-full border-collapse text-left text-sm">
            <thead className="bg-background">
              <tr>
                <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("riskReport.issueTable.check")}</th>
                <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("riskReport.issueTable.severity")}</th>
                <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("riskReport.issueTable.detectedIssue")}</th>
                <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("riskReport.issueTable.evidence")}</th>
                <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("riskReport.issueTable.suggestedFix")}</th>
                <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("riskReport.issueTable.owner")}</th>
                <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">{t("riskReport.issueTable.blocker")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const selected = selectedIssueId === row.issue.issueId;

                return (
                  <tr
                    key={row.issue.issueId}
                    className={cn(
                      "hairline-b align-top transition",
                      selected ? "bg-accent/10" : "hover:bg-surface/40"
                    )}
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => onSelectIssue(row.issue.issueId)}
                        className="text-left font-medium text-accent underline-offset-4 hover:underline"
                      >
                        {formatCheckName(row.check, language)}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <SeverityBadge severity={row.issue.severity} />
                    </td>
                    <td className="max-w-[260px] px-5 py-4 text-[13px] text-subtle">
                      {row.issue.detectedIssue}
                    </td>
                    <td className="max-w-[240px] px-5 py-4 text-[12px] text-muted">
                      {formatEvidence(row.issue)}
                    </td>
                    <td className="max-w-[260px] px-5 py-4 text-[13px] text-subtle">
                      {row.issue.suggestedFix}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-subtle">
                      {formatOwner(row.issue.ownerSuggestion, language)}
                    </td>
                    <td className="px-5 py-4">
                      {row.issue.blocker ? (
                        <span className="rounded-full bg-fail px-2.5 py-1 text-[10px] font-semibold text-white">
                          {labelFor(CHECK_STATUS_LABELS, "FAIL", language)}
                        </span>
                      ) : (
                        <span className="rounded-full hairline border bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted">
                          {labelFor(CHECK_STATUS_LABELS, "PASS", language)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function IssueDetailPanel({ row }: Readonly<{ row: IssueRow | null }>) {
  const { t, language } = useI18n();

    if (!row) {
    return (
      <aside className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
        <h3 className="hairline-b pb-3 text-[14px] font-semibold text-foreground">
          {t("riskReport.issueDetail.title")}
        </h3>
        <div className="mt-8 py-8 text-center">
          <CircleDashed
            className="mx-auto h-5 w-5 text-muted"
            aria-hidden="true"
          />
          <p className="mt-3 text-[14px] font-semibold text-foreground">
            {t("riskReport.empty.noIssueSelected")}
          </p>
          <p className="mt-1 text-[12px] leading-6 text-subtle">
            {t("riskReport.empty.description")}
          </p>
        </div>
      </aside>
    );
  }

  const { check, issue } = row;

  return (
    <aside
      data-tour="issue-detail"
      className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-3 hairline-b pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {formatCheckName(check, language)}
          </p>
          <h3 className="mt-1 text-[14px] font-semibold text-foreground">
            {t("riskReport.issueDetail.title")}
          </h3>
        </div>
        <SeverityBadge severity={issue.severity} />
      </div>

      <div className="mt-4 space-y-0">
        <DetailBlock title={t("riskReport.issueDetail.check")} body={formatCheckName(check, language)} />
        <DetailBlock title={t("riskReport.issueDetail.fullIssueExplanation")} body={issue.detectedIssue} />
        <DetailBlock
          title={t("riskReport.issueDetail.sourceFieldsAffected")}
          body={issue.evidence.map((item) => item.field).join(", ")}
        />
        <DetailBlock title={t("riskReport.issueDetail.evidence")} body={formatEvidence(issue, true)} />
        <DetailBlock title={t("riskReport.issueDetail.suggestedFix")} body={issue.suggestedFix} />
        <DetailBlock title={t("riskReport.issueDetail.whyItMatters")} body={whyItMatters(issue, t)} />
        <DetailBlock
          title={t("riskReport.issueDetail.ownerToAssign")}
          body={formatOwner(issue.ownerSuggestion, language)}
        />
      </div>

      <Link
        href="/app/readiness"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm hairline border bg-surface px-3 py-2 text-[13px] font-medium text-subtle transition hover:border-accent/40 hover:text-foreground"
      >
        {t("nav.readiness")}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <p className="mt-2 text-[11px] leading-5 text-muted">
        {t("readiness.stateDescriptions.readyWithWarnings")}
      </p>
    </aside>
  );
}

function DetailBlock({
  title,
  body
}: Readonly<{
  title: string;
  body: string;
}>) {
  const { t } = useI18n();

  return (
    <section className="hairline-b py-3">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{title}</h4>
      <p className="mt-1 text-[13px] leading-6 text-subtle">
        {body || t("riskReport.issueDetail.notSpecified")}
      </p>
    </section>
  );
}

function InvalidSavedReportNotice({
  message,
  onUseFallback
}: Readonly<{
  message: string;
  onUseFallback: () => void;
}>) {
  const { t } = useI18n();

  return (
    <div className="rounded-sm border border-warn/20 bg-warn/10 px-4 py-3 text-[13px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 text-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">{t("readiness.notUsedTitle")}</p>
            <p className="mt-1 leading-6 text-warn/80">
              {message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onUseFallback}
          className="inline-flex items-center justify-center rounded-sm border border-warn/20 bg-background px-3 py-2 text-[11px] font-medium text-warn transition hover:border-warn/40"
        >
          {t("riskReport.useFallback")}
        </button>
      </div>
    </div>
  );
}

function SeverityBadge({
  severity
}: Readonly<{
  severity: CheckSeverity;
}>) {
  const { language } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        severity === "CRITICAL" && "border-transparent bg-fail text-white",
        severity === "HIGH" && "border-transparent bg-fail/80 text-white",
        severity === "MEDIUM" && "border-warn/40 bg-warn/15 text-warn",
        severity === "LOW" && "hairline border bg-surface text-muted"
      )}
    >
      {labelFor(SEVERITY_LABELS, severity, language)}
    </span>
  );
}

function statusBadgeClass(status: CheckStatus) {
  // Linear-style: subtle border + colored text, no heavy fill
  if (status === "PASS") {
    return "border-pass/30 bg-pass/10 text-pass";
  }

  if (status === "WARN") {
    return "border-warn/30 bg-warn/10 text-warn";
  }

  if (status === "FAIL") {
    return "border-fail/30 bg-fail/10 text-fail";
  }

  return "hairline border bg-surface text-muted";
}

function formatEvidence(issue: CheckIssue, includeFields = false) {
  return issue.evidence
    .map((item) =>
      includeFields
        ? `${item.field}: "${truncate(item.snippet, 140)}"`
        : truncate(item.snippet, 120)
    )
    .join("; ");
}

const OWNER_LABELS: Record<OwnerRole, { en: string; ru: string }> = {
  product: { en: "Product", ru: "Продукт" },
  crm: { en: "CRM", ru: "CRM" },
  legal: { en: "Legal", ru: "Юридический" },
  risk: { en: "Risk", ru: "Risk" },
  localization: { en: "Localization", ru: "Локализация" },
  analytics: { en: "Analytics", ru: "Аналитика" }
};

function formatOwner(owner?: OwnerRole, language?: string) {
  if (!owner) {
    return language === "ru" ? "Не назначен" : "Unassigned";
  }

  const labels = OWNER_LABELS[owner];
  if (!labels) return owner;
  return language === "ru" ? labels.ru : labels.en;
}

function formatCheckName(check: CheckResult, language?: string) {
  const definition = CHECK_DEFINITION_BY_ID[check.checkId as keyof typeof CHECK_DEFINITION_BY_ID];
  if (!definition) return check.publicName;
  return language === "ru" ? definition.publicNameRu : definition.publicName;
}

function formatTimestamp(value: string, language?: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru" : "en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

async function copyTextToClipboard(value: string) {
  window.focus();

  if (copyTextWithSelection(value)) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  throw new Error("Clipboard copy failed");
}

function copyTextWithSelection(value: string) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.width = "1px";
  textArea.style.height = "1px";
  textArea.style.padding = "0";
  textArea.style.border = "0";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  return copied;
}

function whyItMatters(
  issue: CheckIssue,
  t: ReturnType<typeof useI18n>["t"]
) {
  if (issue.blocker) {
    return t("riskReport.issueDetail.whyBlocker");
  }

  if (issue.severity === "HIGH" || issue.severity === "CRITICAL") {
    return t("riskReport.issueDetail.whyHighSeverity");
  }

  return t("riskReport.issueDetail.whyDefault");
}

function getStoredDraftOwners() {
  const storedDraft = window.localStorage.getItem(PROMO_PREFLIGHT_DRAFT_KEY);

  if (!storedDraft) {
    return null;
  }

  try {
    return getOwnersFromUnknown(JSON.parse(storedDraft) as unknown);
  } catch {
    return null;
  }
}

function getOwnersFromUnknown(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if ("owners" in value) {
    return parseOwners(value.owners);
  }

  if ("bundle" in value && isRecord(value.bundle) && "owners" in value.bundle) {
    return parseOwners(value.bundle.owners);
  }

  return null;
}

function parseOwners(value: unknown): Owner[] | null {
  const parsed = OwnerSchema.array().safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
