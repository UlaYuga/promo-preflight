"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileWarning,
  GitBranch,
  ListChecks,
  ShieldAlert,
  Users,
  XCircle
} from "lucide-react";
import { EmptyState } from "@/components/ui-states";
import {
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
  PROMO_PREFLIGHT_REPORT_KEY
} from "@/lib/demo-storage";
import {
  formatOwnerRoleLabel,
  ownerResolutionsToReadinessOwners,
  resolveAllOwners,
  resolveOwner
} from "@/lib/owners/resolver";
import {
  generateLaunchReadiness,
  getRequiredChecklistItems,
  type ReadinessInputOwner
} from "@/lib/readiness";
import { cn } from "@/lib/utils";
import {
  LaunchReadinessSchema,
  RiskReportSchema,
  type Blocker,
  type CheckSeverity,
  type Dependency,
  type LaunchReadiness as LaunchReadinessData,
  type OwnerStatus,
  type ReadinessOwner,
  type ReadinessState,
  type RiskReport as RiskReportData
} from "@/schemas/index";
import type { OwnerOverrides } from "@/schemas/owners";
import { useI18n } from "@/lib/i18n";
import { SEVERITY_LABELS, OWNER_ROLE_DISPLAY, labelFor } from "@/lib/ui-labels";
import { runChecks } from "@/lib/checks/runner";
import { sampleCampaignBundle } from "@/schemas/fixtures";
import { CampaignBundleSchema } from "@/schemas/index";

type ReportSource = "saved" | "offline";

export function LaunchReadiness({
  workspaceOwners
}: Readonly<{
  workspaceOwners: OwnerOverrides;
}>) {
  const { t, language } = useI18n();
  const localizedFallbackReport = useMemo(() => {
    const offlineBundle = CampaignBundleSchema.parse(sampleCampaignBundle);
    return runChecks({ bundle: offlineBundle, mode: "offline", language });
  }, [language]);
  const workspaceReadinessOwners = useMemo(
    () =>
      ownerResolutionsToReadinessOwners(
        resolveAllOwners({ workspaceOwners })
      ) as ReadinessInputOwner[],
    [workspaceOwners]
  );
  const fallbackReadiness = useMemo(
    () =>
      LaunchReadinessSchema.parse(
        generateLaunchReadiness({
          report: localizedFallbackReport,
          owners: workspaceReadinessOwners
        })
      ),
    [localizedFallbackReport, workspaceReadinessOwners]
  );
  const [report, setReport] = useState<RiskReportData>(localizedFallbackReport);
  const [readiness, setReadiness] =
    useState<LaunchReadinessData>(fallbackReadiness);
  const [source, setSource] = useState<ReportSource>("offline");
  const [savedReportError, setSavedReportError] = useState<string | null>(null);

  useEffect(() => {
    const loadReadiness = () => {
      const savedReportValue = window.localStorage.getItem(
        PROMO_PREFLIGHT_REPORT_KEY
      );
      let nextReport = localizedFallbackReport;
      let nextSource: ReportSource = "offline";
      let nextError: string | null = null;

      if (savedReportValue) {
        try {
          const parsedValue = JSON.parse(savedReportValue) as unknown;
          const reportCandidate =
            isRecord(parsedValue) && "report" in parsedValue
              ? parsedValue.report
              : parsedValue;
          nextReport = RiskReportSchema.parse(reportCandidate);
          nextSource = "saved";
        } catch {
          nextReport = localizedFallbackReport;
          nextSource = "offline";
          nextError =
            t("readiness.savedReportInvalid");
        }
      }

      try {
        const nextReadiness = LaunchReadinessSchema.parse(
          generateLaunchReadiness({
            report: nextReport,
            owners: workspaceReadinessOwners
          })
        );
        setReport(nextReport);
        setReadiness(nextReadiness);
        setSource(nextSource);
        setSavedReportError(nextError);
      } catch {
        setReport(localizedFallbackReport);
        setReadiness(fallbackReadiness);
        setSource("offline");
        setSavedReportError(
          t("readiness.schemaInvalid")
        );
      }
    };

    loadReadiness();
    window.addEventListener(
      PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
      loadReadiness
    );

    return () => {
      window.removeEventListener(
        PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
        loadReadiness
      );
    };
  }, [fallbackReadiness, t, localizedFallbackReport, workspaceReadinessOwners]);

  function useFallbackReport() {
    window.localStorage.removeItem(PROMO_PREFLIGHT_REPORT_KEY);
    setReport(localizedFallbackReport);
    setReadiness(fallbackReadiness);
    setSource("offline");
    setSavedReportError(null);
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            {t("readiness.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
            {t("readiness.title")}
          </h1>
          <p className="mt-3 max-w-[58ch] text-base leading-7 text-subtle">
            {t("readiness.subtitle", { campaignName: readiness.campaignName })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-white/[0.08] bg-surface px-3 py-2 text-sm font-medium text-subtle">
            {source === "saved" ? t("readiness.savedReport") : t("readiness.offlineSample")}
          </span>
        </div>
      </header>

      {savedReportError ? (
        <InvalidSavedReportNotice
          message={savedReportError}
          onUseFallback={useFallbackReport}
        />
      ) : null}

      <GoNoGoBanner readiness={readiness} report={report} />

      <OwnerMatrix owners={readiness.owners} workspaceOwners={workspaceOwners} report={report} />

      <div
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <BlockersPanel blockers={readiness.blockers} workspaceOwners={workspaceOwners} />
        <LaunchChecklist checklist={readiness.checklist} />
      </div>

      <DependenciesPanel
        dependencies={readiness.dependencies}
        workspaceOwners={workspaceOwners}
      />
    </div>
  );
}

function GoNoGoBanner({
  readiness,
  report
}: Readonly<{
  readiness: LaunchReadinessData;
  report: RiskReportData;
}>) {
  const { t } = useI18n();
  return (
    <section
      data-tour="readiness-board"
      className={cn(
        "rounded-lg border bg-surface p-5 sm:p-6",
        readiness.state === "READY" &&
          "border-pass/20 bg-pass/10",
        readiness.state === "READY_WITH_WARNINGS" &&
          "border-warn/20 bg-warn/10",
        readiness.state === "BLOCKED" && "border-fail/20 bg-fail/10",
        readiness.state === "NEEDS_REVIEW" &&
          "border-info/20 bg-info/10"
      )}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-white/[0.08] bg-background/70">
            <StateIcon state={readiness.state} />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              {t("readiness.goNoGo")}
            </p>
            <h2 className="mt-1.5 break-words text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              {formatReadinessState(readiness.state, t)}
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/75">
              {getStateDescription(readiness.state, t)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[340px]">
          <BannerMetric label={t("readiness.metrics.fail")} value={String(report.counts.fail)} />
          <BannerMetric label={t("readiness.metrics.warn")} value={String(report.counts.warn)} />
          <BannerMetric
            label={t("readiness.metrics.blockers")}
            value={String(readiness.blockers.length)}
          />
        </div>
      </div>
    </section>
  );
}

function BannerMetric({
  label,
  value
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded border border-white/[0.07] bg-background/70 px-3 py-3">
      <p className="whitespace-nowrap text-[11px] font-semibold uppercase leading-4 tracking-normal text-muted sm:text-xs sm:tracking-[0.03em]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

function OwnerMatrix({
  owners,
  workspaceOwners,
  report
}: Readonly<{
  owners: ReadinessOwner[];
  workspaceOwners: OwnerOverrides;
  report: RiskReportData;
}>) {
  const { t, language } = useI18n();
  const ownerNotesMap: Record<string, string> = {
    "Resolve linked blockers before go/no-go review.": t("readiness.ownerNotes.resolveBlockers"),
    "Review linked issues and confirm the final package path.": t("readiness.ownerNotes.reviewIssues"),
    "No linked readiness action.": t("readiness.ownerNotes.noAction"),
    "No action generated from the current Risk Report.": t("readiness.ownerNotes.noActionGenerated"),
    "Confirm owner status before the final package.": t("readiness.ownerNotes.confirmStatus"),
  };

  // Build a map from issueId → truncated detectedIssue for readable display
  const issueTextMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const check of report.checkResults) {
      for (const issue of check.issues) {
        const text = issue.detectedIssue.length > 70
          ? `${issue.detectedIssue.slice(0, 68)}…`
          : issue.detectedIssue;
        map.set(issue.issueId, text);
      }
    }
    return map;
  }, [report]);

  return (
    <section className="rounded-lg border border-white/[0.07] bg-surface/90 p-4 sm:p-5">
      <div className="flex items-start gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-white/[0.07] bg-background">
          <Users className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-normal text-foreground">
            {t("readiness.ownerMatrix.title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {t("owners.tableSubtitle")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {owners.map((owner) => {
          const resolvedOwner = resolveOwner({
            ownerRole: owner.role,
            workspaceOwners
          });
          const linkedIssues = owner.linkedIssueIds.map(
            (issueId) => issueTextMap.get(issueId) ?? issueId
          );
          const visibleIssues = linkedIssues.slice(0, 2);
          const hiddenIssueCount = Math.max(linkedIssues.length - visibleIssues.length, 0);

          return (
            <article
              key={owner.role}
              className="min-w-0 rounded border border-white/[0.07] bg-background/75 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t("readiness.ownerMatrix.role")}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold leading-6 text-foreground">
                    {labelFor(OWNER_ROLE_DISPLAY, owner.role, language)}
                  </h3>
                </div>
                <OwnerStatusBadge status={owner.status} />
              </div>

              <div className="mt-4 grid gap-3 text-sm">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t("readiness.ownerMatrix.owner")}
                  </p>
                  <p className="mt-1 leading-6">
                    <OwnerNameText
                      assigned={resolvedOwner.assigned}
                      ownerName={owner.name ?? `${owner.role} (${t("common.notAssigned").toLowerCase()})`}
                    />
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                      {t("readiness.ownerMatrix.dueDate")}
                    </p>
                    <p className="mt-1 leading-6 text-foreground/75">
                      {owner.dueDate ?? t("common.notRequired")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                      {t("readiness.ownerMatrix.linkedIssues")}
                    </p>
                    <p className="mt-1 leading-6 text-foreground/75">
                      {linkedIssues.length > 0
                        ? String(linkedIssues.length)
                        : t("readiness.ownerMatrix.none")}
                    </p>
                  </div>
                </div>

                {linkedIssues.length > 0 ? (
                  <ul className="space-y-2">
                    {visibleIssues.map((issueText, index) => (
                      <li
                        key={`${issueText}-${index}`}
                        className="rounded border border-white/[0.06] bg-surface/80 px-3 py-2 text-sm leading-6 text-subtle"
                      >
                        {issueText}
                      </li>
                    ))}
                    {hiddenIssueCount > 0 ? (
                      <li className="text-sm font-medium text-muted">
                        +{hiddenIssueCount}
                      </li>
                    ) : null}
                  </ul>
                ) : null}

                <p className="rounded border border-white/[0.06] bg-surface/80 px-3 py-2 text-sm leading-6 text-subtle">
                  {owner.notes
                    ? (ownerNotesMap[owner.notes] ?? owner.notes)
                    : t("readiness.ownerMatrix.noNote")}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BlockersPanel({
  blockers,
  workspaceOwners
}: Readonly<{
  blockers: Blocker[];
  workspaceOwners: OwnerOverrides;
}>) {
  const { t } = useI18n();
  return (
    <section className="rounded-lg border border-white/[0.07] bg-surface/90 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-white/[0.07] bg-background">
            <FileWarning className="h-4 w-4 text-fail" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-foreground">
              {t("readiness.blockers.title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {t("readiness.blockers.emptyDescription")}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-background px-2.5 py-1 text-sm font-semibold tabular-nums text-subtle">
          {blockers.length}
        </span>
      </div>

      {blockers.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={t("readiness.blockers.emptyTitle")}
            description={t("readiness.blockers.emptyDescription")}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {blockers.map((blocker) => (
            <article
              key={blocker.blockerId}
              className="rounded border border-white/[0.07] bg-background/75 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {blocker.sourceCheckId}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-6 text-foreground">
                    {blocker.title}
                  </h3>
                </div>
                <SeverityBadge severity={blocker.severity} />
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                <OwnerMetric
                  ownerRole={blocker.ownerRole}
                  workspaceOwners={workspaceOwners}
                />
                <BlockerMetric label={t("readiness.blockers.action")} value={blocker.requiredAction} />
                <BlockerMetric label={t("readiness.blockers.status")} value={blocker.status} />
                <BlockerMetric
                  label={t("readiness.blockers.due")}
                  value={blocker.dueDate ?? t("common.notAssigned")}
                />
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function BlockerMetric({
  label,
  value
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="border-b border-white/[0.05] py-2.5 last:border-b-0">
      <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-foreground/80">{value}</dd>
    </div>
  );
}

function OwnerMetric({
  ownerRole,
  workspaceOwners
}: Readonly<{
  ownerRole: Blocker["ownerRole"];
  workspaceOwners: OwnerOverrides;
}>) {
  const { t } = useI18n();
  const owner = ownerRole
    ? resolveOwner({ ownerRole, workspaceOwners })
    : null;

  return (
    <div
      className={cn(
        "rounded border px-3 py-2.5",
        owner?.assigned === false
          ? "border-warn/20 bg-warn/10"
          : "border-white/[0.07] bg-surface"
      )}
    >
      <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
        {t("readiness.ownerMatrix.owner")}
      </dt>
      <dd
        className={cn(
          "mt-1 leading-6",
          owner?.assigned === false ? "text-warn" : "text-foreground/70"
        )}
      >
        {owner
          ? `${formatOwnerRoleLabel(owner.ownerRole)}: ${owner.ownerName}`
          : t("common.unassigned")}
      </dd>
    </div>
  );
}

function DependenciesPanel({
  dependencies,
  workspaceOwners
}: Readonly<{
  dependencies: Dependency[];
  workspaceOwners: OwnerOverrides;
}>) {
  const { t } = useI18n();
  return (
    <section className="rounded-lg border border-white/[0.07] bg-surface/90 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-white/[0.07] bg-background">
            <GitBranch className="h-4 w-4 text-info" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-foreground">
              {t("readiness.dependencies.title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {t("readiness.dependencies.emptyDescription")}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-background px-2.5 py-1 text-sm font-semibold tabular-nums text-subtle">
          {dependencies.length}
        </span>
      </div>

      {dependencies.length === 0 ? (
        <div className="py-4">
          <EmptyState
            title={t("readiness.dependencies.emptyTitle")}
            description={t("readiness.dependencies.emptyDescription")}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {dependencies.map((dependency) => (
            <article
              key={dependency.dependencyId}
              className="rounded border border-white/[0.07] bg-background/75 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t("readiness.dependencies.dependency")}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-6 text-foreground">
                    {dependency.dependency}
                  </h3>
                </div>
                <span className="w-fit rounded-full border border-white/[0.07] bg-surface px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.04em] text-subtle">
                  {dependency.status}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t("readiness.dependencies.dependsOn")}
                  </dt>
                  <dd className="mt-1 leading-6 text-foreground/75">
                    {dependency.dependsOn ?? t("readiness.dependencies.riskReport")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t("readiness.dependencies.owner")}
                  </dt>
                  <dd className="mt-1">
                    <OwnerNameCell
                      ownerRole={dependency.ownerRole}
                      workspaceOwners={workspaceOwners}
                    />
                  </dd>
                </div>
              </dl>

              <p className="mt-4 rounded border border-white/[0.06] bg-surface/80 px-3 py-2 text-sm leading-6 text-subtle">
                {dependency.notes ?? t("readiness.dependencies.ownerReviewRequired")}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function OwnerNameCell({
  ownerRole,
  workspaceOwners
}: Readonly<{
  ownerRole: Dependency["ownerRole"];
  workspaceOwners: OwnerOverrides;
}>) {
  const { t } = useI18n();
  if (!ownerRole) {
    return <span className="text-muted">{t("common.unassigned")}</span>;
  }

  const owner = resolveOwner({ ownerRole, workspaceOwners });

  return (
    <span
      className={cn(
        "inline-flex rounded border px-2.5 py-1.5 text-xs font-semibold leading-5",
        owner.assigned
          ? "border-white/[0.07] bg-background text-foreground/70"
          : "border-warn/20 bg-warn/10 text-warn"
      )}
    >
      {formatOwnerRoleLabel(owner.ownerRole)}: {owner.ownerName}
    </span>
  );
}

function OwnerNameText({
  assigned,
  ownerName
}: Readonly<{
  assigned: boolean;
  ownerName: string;
}>) {
  return (
    <span className={assigned ? "text-foreground/70" : "text-warn"}>
      {ownerName}
    </span>
  );
}

const checklistItemLabels: Record<string, { en: string; ru: string }> = {
  "Legal reviewed": { en: "Legal reviewed", ru: "Юристы согласовали" },
  "Risk reviewed": { en: "Risk reviewed", ru: "Риски согласовали" },
  "Localization reviewed": { en: "Localization reviewed", ru: "Локализация согласовала" },
  "CRM assets aligned": { en: "CRM assets aligned", ru: "CRM-материалы готовы" },
  "Links tested": { en: "Links tested", ru: "Ссылки проверены" },
  "Analytics/UTM checked": { en: "Analytics/UTM checked", ru: "Аналитика/UTM проверены" },
  "Promo terms finalized": { en: "Promo terms finalized", ru: "Условия промо согласованы" },
};

function LaunchChecklist({
  checklist
}: Readonly<{ checklist: Record<string, boolean> }>) {
  const { t, language } = useI18n();

  return (
    <section className="rounded-lg border border-white/[0.07] bg-surface/90 p-4 sm:p-5">
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-white/[0.07] bg-background">
          <ListChecks className="h-4 w-4 text-pass" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold tracking-normal text-foreground">
          {t("readiness.checklist.title")}
        </h2>
      </div>
      <div className="mt-2 space-y-1">
        {getRequiredChecklistItems().map((item) => {
          const checked = Boolean(checklist[item]);
          const label = checklistItemLabels[item]?.[language] ?? item;

          return (
            <div
              key={item}
              className="flex min-h-11 items-center justify-between gap-3 rounded px-2 py-2 text-sm transition-colors hover:bg-white/[0.03]"
            >
              <span className={checked ? "text-foreground/80" : "text-subtle"}>
                {label}
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  checked
                    ? "border-pass/30 bg-pass/10 text-pass"
                    : "border-white/[0.07] bg-background text-muted"
                )}
              >
                {checked ? (
                  <CheckCircle2
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleDashed
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>
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
    <div className="rounded border border-warn/20 bg-warn/10 px-4 py-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 text-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">{t("readiness.notUsedTitle")}</p>
            <p className="mt-1 leading-6 text-warn/80">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onUseFallback}
          className="inline-flex items-center justify-center rounded border border-warn/20 bg-background px-3 py-2 text-xs font-medium text-warn transition hover:border-warn/40"
        >
          {t("readiness.offlineSample")}
        </button>
      </div>
    </div>
  );
}

function StateIcon({ state }: Readonly<{ state: ReadinessState }>) {
  const className = "h-7 w-7 shrink-0";

  if (state === "READY") {
    return <CheckCircle2 className={cn(className, "text-pass")} aria-hidden="true" />;
  }

  if (state === "READY_WITH_WARNINGS") {
    return <AlertTriangle className={cn(className, "text-warn")} aria-hidden="true" />;
  }

  if (state === "BLOCKED") {
    return <XCircle className={cn(className, "text-fail")} aria-hidden="true" />;
  }

  return <ShieldAlert className={cn(className, "text-info")} aria-hidden="true" />;
}

function OwnerStatusBadge({ status }: Readonly<{ status: OwnerStatus }>) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
        status === "approved" && "border-pass/30 bg-pass/10 text-pass",
        status === "pending" && "border-warn/30 bg-warn/10 text-warn",
        status === "blocked" && "border-fail/30 bg-fail/10 text-fail",
        status === "not_required" && "border-white/[0.08] bg-white/[0.04] text-muted"
      )}
    >
      {t(`labels.ownerStatuses.${status}`)}
    </span>
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
        "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
        severity === "CRITICAL" && "border-fail/40 bg-fail/15 text-fail font-bold",
        severity === "HIGH" && "border-fail/30 bg-fail/10 text-fail",
        severity === "MEDIUM" && "border-warn/30 bg-warn/10 text-warn",
        severity === "LOW" && "border-white/[0.08] bg-white/[0.04] text-muted"
      )}
    >
      {labelFor(SEVERITY_LABELS, severity, language)}
    </span>
  );
}

function formatReadinessState(
  state: ReadinessState,
  t: ReturnType<typeof useI18n>["t"]
) {
  if (state === "READY") {
    return t("readiness.states.ready");
  }

  if (state === "READY_WITH_WARNINGS") {
    return t("readiness.states.readyWithWarnings");
  }

  if (state === "NEEDS_REVIEW") {
    return t("readiness.states.needsReview");
  }

  return t("readiness.states.blocked");
}

function getStateDescription(
  state: ReadinessState,
  t: ReturnType<typeof useI18n>["t"]
) {
  if (state === "READY") {
    return t("readiness.stateDescriptions.ready");
  }

  if (state === "READY_WITH_WARNINGS") {
    return t("readiness.stateDescriptions.readyWithWarnings");
  }

  if (state === "BLOCKED") {
    return t("readiness.stateDescriptions.blocked");
  }

  return t("readiness.stateDescriptions.needsReview");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
