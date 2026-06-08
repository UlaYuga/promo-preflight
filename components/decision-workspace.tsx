"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  ListChecks,
  PlayCircle,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { CampaignList } from "@/components/campaign-list";
import { SaveCampaignPanel } from "@/components/save-campaign-panel";
import { runChecks } from "@/lib/checks/runner";
import {
  PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT,
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
  PROMO_PREFLIGHT_REPORT_KEY
} from "@/lib/demo-storage";
import {
  generateLaunchReadiness,
  type ReadinessInputOwner
} from "@/lib/readiness";
import {
  loadDecisionDemoState,
  type DecisionDemoState
} from "@/lib/tour/sample";
import { CHECK_STATUS_LABELS, OWNER_ROLE_DISPLAY, SEVERITY_LABELS, labelFor } from "@/lib/ui-labels";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  CampaignBundleSchema,
  LaunchReadinessSchema,
  OwnerSchema,
  RiskReportSchema,
  type CheckIssue,
  type CheckResult,
  type CheckSeverity,
  type LaunchReadiness,
  type OwnerRole,
  type ReadinessState,
  type RiskReport
} from "@/schemas/index";
import { sampleCampaignBundle } from "@/schemas/fixtures";

type ReportSource = "saved" | "offline";

type WorkspaceSnapshot = {
  report: RiskReport;
  readiness: LaunchReadiness;
  source: ReportSource;
  error: string | null;
};

type IssueAction = {
  check: CheckResult;
  issue: CheckIssue;
};

const severityOrder: Record<CheckSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

function createFallbackSnapshot(language: string): WorkspaceSnapshot {
  const bundle = CampaignBundleSchema.parse(sampleCampaignBundle);
  const report = runChecks({ bundle, mode: "offline", language });
  const readiness = LaunchReadinessSchema.parse(
    generateLaunchReadiness({ report, owners: bundle.owners })
  );

  return {
    report,
    readiness,
    source: "offline",
    error: null
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseOwnersFromStoredValue(value: unknown): ReadinessInputOwner[] {
  if (!isRecord(value) || !Array.isArray(value.owners)) {
    return [];
  }

  return value.owners.flatMap((owner) => {
    const parsed = OwnerSchema.safeParse(owner);
    return parsed.success ? [parsed.data] : [];
  });
}

function getReportStoreSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(PROMO_PREFLIGHT_REPORT_KEY) ?? "";
}

function getServerReportStoreSnapshot() {
  return "";
}

function subscribeToReportStore(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT, callback);
  window.addEventListener(PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PROMO_PREFLIGHT_DEMO_DATA_CHANGED_EVENT, callback);
    window.removeEventListener(PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT, callback);
  };
}

function loadSnapshot(language: string, savedValue: string): WorkspaceSnapshot {
  const fallback = createFallbackSnapshot(language);

  if (!savedValue) {
    return fallback;
  }

  try {
    const parsedValue = JSON.parse(savedValue) as unknown;
    const reportCandidate =
      isRecord(parsedValue) && "report" in parsedValue
        ? parsedValue.report
        : parsedValue;
    const report = RiskReportSchema.parse(reportCandidate);
    const owners = parseOwnersFromStoredValue(parsedValue);
    const readiness = LaunchReadinessSchema.parse(
      generateLaunchReadiness({ report, owners })
    );

    return {
      report,
      readiness,
      source: "saved",
      error: null
    };
  } catch {
    return {
      ...fallback,
      error:
        language === "ru"
          ? "Сохранённый отчёт не прошёл валидацию. Показан тестовый пример."
          : "Saved report failed validation. Showing the offline sample."
    };
  }
}

function stateCopy(state: ReadinessState, language: string) {
  const ru = language === "ru";

  if (state === "READY") {
    return {
      title: ru ? "Можно запускать" : "Ready to launch",
      body: ru
        ? "Критичных блокеров нет. Остаётся зафиксировать финальный пакет и сохранить версию."
        : "No critical blockers remain. Prepare the final package and save the review run."
    };
  }

  if (state === "READY_WITH_WARNINGS") {
    return {
      title: ru ? "Можно запускать с предупреждениями" : "Ready with warnings",
      body: ru
        ? "Запуск возможен, но часть рисков нужно явно принять или передать владельцам."
        : "Launch is possible, but some risks need explicit acceptance or owner follow-up."
    };
  }

  if (state === "BLOCKED") {
    return {
      title: ru ? "Запуск заблокирован" : "Launch blocked",
      body: ru
        ? "Сначала нужно закрыть блокеры. Начните с карточек ниже."
        : "Blockers must be resolved first. Start with the action card below."
    };
  }

  return {
    title: ru ? "Нужен review" : "Needs review",
    body: ru
      ? "Решение пока неочевидно. Проверьте владельцев и доказательства перед передачей."
      : "The decision is not clear yet. Check owners and evidence before the final package."
  };
}

function getIssueActions(report: RiskReport): IssueAction[] {
  return report.checkResults
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
    });
}

function formatOwner(ownerRole: OwnerRole | undefined, language: string) {
  if (!ownerRole) {
    return language === "ru" ? "Без владельца" : "Unassigned";
  }

  return labelFor(OWNER_ROLE_DISPLAY, ownerRole, language);
}

function formatOwnerStatus(
  status: LaunchReadiness["owners"][number]["status"],
  language: string
) {
  const ru = language === "ru";

  if (status === "approved") {
    return ru ? "Готово" : "Approved";
  }

  if (status === "pending") {
    return ru ? "Ждет" : "Pending";
  }

  if (status === "blocked") {
    return ru ? "Блокер" : "Blocked";
  }

  return ru ? "Не нужно" : "Not required";
}

function formatGeneratedAt(value: string, language: string) {
  try {
    return new Intl.DateTimeFormat(language === "ru" ? "ru" : "en", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function stateClass(state: ReadinessState) {
  if (state === "READY") {
    return "border-pass/25 bg-pass/[0.08] text-pass";
  }

  if (state === "READY_WITH_WARNINGS") {
    return "border-warn/25 bg-warn/[0.08] text-warn";
  }

  if (state === "BLOCKED") {
    return "border-fail/25 bg-fail/[0.08] text-fail";
  }

  return "border-info/25 bg-info/[0.08] text-info";
}

function severityClass(severity: CheckSeverity) {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return "border-fail/30 bg-fail/10 text-fail";
  }

  if (severity === "MEDIUM") {
    return "border-warn/30 bg-warn/10 text-warn";
  }

  return "hairline border bg-background text-muted";
}

export function DecisionWorkspace() {
  const { language } = useI18n();
  const [demoVersionPath, setDemoVersionPath] = useState<string | null>(null);
  const savedReportValue = useSyncExternalStore(
    subscribeToReportStore,
    getReportStoreSnapshot,
    getServerReportStoreSnapshot
  );
  const snapshot = useMemo(
    () => loadSnapshot(language, savedReportValue),
    [language, savedReportValue]
  );

  const actionRows = useMemo(
    () => getIssueActions(snapshot.report),
    [snapshot.report]
  );
  const primaryAction = actionRows[0] ?? null;
  const remainingActions = actionRows.slice(1);
  const hasOpenIssues = actionRows.length > 0;
  const nextStepHref = hasOpenIssues ? "/app/risk-report" : "/app/handoff";
  const copy = language === "ru"
    ? {
        eyebrow: "01 / Рабочее решение",
        title: "Что делать с запуском",
        subtitle:
          "Один экран для решения: можно ли запускать, что блокирует, кто владелец и куда идти дальше.",
        sourceSaved: "Сохранённый отчёт",
        sourceOffline: "Тестовый пример",
        generated: "Сгенерировано",
        details: "Детали",
        saveVersion: "Сохранить версию",
        context: "Контекст",
        blockers: "Блок.",
        warnings: "WARN",
        ownerRisk: "Роли",
        primaryAction: "Разобрать отчёт",
        reviewWarnings: "Разобрать предупреждения",
        intakeAction: "Импортировать бриф",
        handoffAction: "Собрать финальный пакет",
        demoLabel: "Демо-сценарий",
        demoTitle: "Проверить состояние",
        demoBody:
          "Один клик переключает текущий отчёт и создаёт историю v1 / v2 / v3.",
        demoBlocked: "Blocked v1",
        demoWarnings: "Warnings v2",
        demoReady: "Ready v3",
        demoOpenVersion: "Открыть сохранённый прогон",
        flow: "Следующий шаг",
        firstFocus: "Первое",
        nextActions: "Открытые действия",
        remainingActions: (count: number) => `Ещё ${count} замечаний`,
        noActions: "Открытых блокеров и предупреждений нет.",
        owners: "Роли с действиями",
        noRiskyOwners: "По ролям действий нет.",
        history: "История кампаний",
        historyBody:
          "Сохранённые версии остаются ниже как вторичный контекст, а не как главный экран принятия решения.",
        evidence: "Основания",
        fix: "Исправить",
        source: "Источник"
      }
    : {
        eyebrow: "01 / Decision workspace",
        title: "What happens to this launch",
        subtitle:
          "A single decision surface: launch state, blockers, roles, and the next action.",
        sourceSaved: "Saved report",
        sourceOffline: "Offline sample",
        generated: "Generated",
        details: "Details",
        saveVersion: "Save version",
        context: "Context",
        blockers: "Blocks",
        warnings: "Warn",
        ownerRisk: "Roles",
        primaryAction: "Review report",
        reviewWarnings: "Review warnings",
        intakeAction: "Import brief",
        handoffAction: "Prepare final package",
        demoLabel: "Demo script",
        demoTitle: "Check a state",
        demoBody:
          "One click switches the current report and creates v1 / v2 / v3 history.",
        demoBlocked: "Blocked v1",
        demoWarnings: "Warnings v2",
        demoReady: "Ready v3",
        demoOpenVersion: "Open saved run",
        flow: "Next step",
        firstFocus: "First",
        nextActions: "Open actions",
        remainingActions: (count: number) => `${count} more issues`,
        noActions: "No open blocker or warning actions.",
        owners: "Roles needing action",
        noRiskyOwners: "No role actions.",
        history: "Campaign history",
        historyBody:
          "Saved review runs stay below as secondary context, not the primary decision surface.",
        evidence: "Evidence",
        fix: "Fix",
        source: "Source"
      };
  const state = stateCopy(snapshot.readiness.state, language);
  const riskyOwners = snapshot.readiness.owners.filter(
    (owner) => owner.status === "blocked" || owner.linkedIssueIds.length > 0
  );
  const nextStepLabel =
    snapshot.report.counts.fail === 0 && snapshot.report.counts.warn > 0
      ? copy.reviewWarnings
      : hasOpenIssues
        ? copy.primaryAction
        : copy.handoffAction;
  const loadDemoState = useCallback(
    (demoState: DecisionDemoState) => {
      const result = loadDecisionDemoState({ language, state: demoState });
      setDemoVersionPath(result.versionPath);
    },
    [language]
  );

  return (
    <div className="px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
      <header className="mb-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-[64ch] text-base leading-7 text-subtle">
            {copy.subtitle}
          </p>
        </div>
      </header>

      {snapshot.error ? (
        <div className="mb-4 rounded border border-warn/25 bg-warn/10 px-4 py-3 text-sm leading-6 text-warn">
          {snapshot.error}
        </div>
      ) : null}

      <section className="mb-4 rounded border border-white/[0.07] bg-surface/70 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              {copy.demoLabel}
            </p>
            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
              <h2 className="text-base font-semibold text-foreground">
                {copy.demoTitle}
              </h2>
              <p className="text-sm leading-6 text-subtle">
                {copy.demoBody}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DemoStateButton
              label={copy.demoBlocked}
              state="blocked"
              currentState={snapshot.readiness.state === "BLOCKED"}
              onSelect={loadDemoState}
            />
            <DemoStateButton
              label={copy.demoWarnings}
              state="warnings"
              currentState={snapshot.readiness.state === "READY_WITH_WARNINGS"}
              onSelect={loadDemoState}
            />
            <DemoStateButton
              label={copy.demoReady}
              state="ready"
              currentState={snapshot.readiness.state === "READY"}
              onSelect={loadDemoState}
            />
            {demoVersionPath ? (
              <Link
                href={demoVersionPath}
                className="inline-flex min-h-10 items-center justify-center rounded border border-white/[0.08] bg-background px-3 py-2 text-xs font-medium text-subtle transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {copy.demoOpenVersion}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className={cn("rounded-lg border p-5 sm:p-6", stateClass(snapshot.readiness.state))}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {snapshot.readiness.state === "BLOCKED" ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-white/[0.08] bg-background/75">
                <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              </div>
            ) : snapshot.readiness.state === "READY" ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-white/[0.08] bg-background/75">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-white/[0.08] bg-background/75">
                <CircleAlert className="h-6 w-6" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium leading-6 opacity-75">
                {snapshot.report.campaignName}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
                {state.title}
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/75">
                {state.body}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:min-w-[520px]">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <DecisionMetric
                  label={copy.blockers}
                  value={String(snapshot.readiness.blockers.length)}
                  tone="fail"
                />
                <DecisionMetric label={copy.warnings} value={String(snapshot.report.counts.warn)} tone="warn" />
                <DecisionMetric label={copy.ownerRisk} value={String(riskyOwners.length)} tone="info" />
              </div>
              {primaryAction ? (
                <p className="rounded border border-white/[0.08] bg-background/60 px-3 py-2 text-xs font-medium leading-5 text-subtle">
                  {copy.firstFocus}:{" "}
                  <span className="text-foreground/80">{primaryAction.check.publicName}</span>
                </p>
              ) : null}
            </div>
            <Link
              href={nextStepHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-accent/50 bg-accent px-4 py-3 text-sm font-semibold text-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
            >
              {nextStepLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-3">
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-foreground">
                {copy.nextActions}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                {snapshot.readiness.blockers.length > 0
                  ? state.body
                  : copy.noActions}
              </p>
            </div>
          </div>

          {primaryAction ? (
            <div className="grid gap-3">
              <ActionCard
                action={primaryAction}
                language={language}
                ownerLabel={language === "ru" ? "Владелец" : "Owner"}
                primary
              />
              {remainingActions.length > 0 ? (
                <details className="rounded border border-white/[0.07] bg-surface/80">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
                    <span>{copy.remainingActions(remainingActions.length)}</span>
                    <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
                  </summary>
                  <div className="grid gap-3 border-t border-white/[0.06] p-3">
                    {remainingActions.map((action) => (
                      <ActionCard
                        key={action.issue.issueId}
                        action={action}
                        language={language}
                        ownerLabel={language === "ru" ? "Владелец" : "Owner"}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : (
            <div className="rounded border border-white/[0.07] bg-surface/90 px-4 py-10 text-center">
              <ListChecks className="mx-auto h-5 w-5 text-pass" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-foreground">{copy.noActions}</p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded border border-white/[0.07] bg-surface/90 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCheck className="h-4 w-4 text-info" aria-hidden="true" />
              {copy.owners}
            </h2>
            <div className="mt-4 space-y-3">
              {riskyOwners.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {riskyOwners.map((owner) => (
                    <div
                      key={owner.role}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded border bg-background/80 px-3 py-2",
                        owner.status === "blocked" && "border-fail/25",
                        owner.status === "pending" && "border-warn/25",
                        owner.status !== "blocked" && owner.status !== "pending" && "border-white/[0.07]"
                      )}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {labelFor(OWNER_ROLE_DISPLAY, owner.role, language)}
                      </span>
                      <span
                        className={cn(
                          "rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]",
                          owner.status === "blocked" && "border-fail/30 bg-fail/10 text-fail",
                          owner.status === "pending" && "border-warn/30 bg-warn/10 text-warn",
                          owner.status !== "blocked" && owner.status !== "pending" && "hairline border bg-surface text-muted"
                        )}
                      >
                        {formatOwnerStatus(owner.status, language)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded border border-white/[0.06] bg-background/80 px-3 py-3 text-sm text-subtle">
                  {copy.noRiskyOwners}
                </p>
              )}
            </div>
          </div>

          <div className="rounded border border-white/[0.07] bg-surface/90 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock3 className="h-4 w-4 text-accent" aria-hidden="true" />
              {copy.flow}
            </h2>
            <div className="mt-4">
              <Link
                href={nextStepHref}
                className="flex min-h-11 items-center justify-between gap-3 rounded border border-accent/35 bg-background px-3 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {nextStepLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <details className="rounded border border-white/[0.07] bg-surface/90 p-4">
            <summary className="-mx-2 flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-sm px-2 text-sm font-semibold text-foreground transition hover:bg-background/45 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted" aria-hidden="true" />
                {copy.details}
              </span>
              <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
            </summary>
            <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
              <dl className="grid gap-2 text-sm">
                <div className="rounded border border-white/[0.06] bg-background/80 px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-muted">
                    {copy.context}
                  </dt>
                  <dd className="mt-1 text-foreground/80">
                    {snapshot.source === "saved" ? copy.sourceSaved : copy.sourceOffline}
                  </dd>
                </div>
                <div className="rounded border border-white/[0.06] bg-background/80 px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-muted">
                    {copy.generated}
                  </dt>
                  <dd className="mt-1 text-foreground/80">
                    {formatGeneratedAt(snapshot.report.generatedAt, language)}
                  </dd>
                </div>
              </dl>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-muted">
                  {copy.saveVersion}
                </p>
                <SaveCampaignPanel report={snapshot.report} />
              </div>
            </div>
          </details>
        </aside>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 text-muted" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {copy.history}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {copy.historyBody}
            </p>
          </div>
        </div>
        <CampaignList />
      </section>
    </div>
  );
}

function DemoStateButton({
  label,
  state,
  currentState,
  onSelect
}: Readonly<{
  label: string;
  state: DecisionDemoState;
  currentState: boolean;
  onSelect: (state: DecisionDemoState) => void;
}>) {
  return (
    <button
      type="button"
      aria-pressed={currentState}
      onClick={() => onSelect(state)}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        currentState
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-white/[0.08] bg-background text-subtle hover:text-foreground"
      )}
    >
      <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function ActionCard({
  action,
  language,
  ownerLabel,
  primary = false
}: Readonly<{
  action: IssueAction;
  language: string;
  ownerLabel: string;
  primary?: boolean;
}>) {
  const { check, issue } = action;

  return (
    <article
      className={cn(
        "rounded border p-4",
        primary
          ? "border-fail/25 bg-surface/95"
          : "border-white/[0.07] bg-background/70"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]", severityClass(issue.severity))}>
              {labelFor(SEVERITY_LABELS, issue.severity, language)}
            </span>
            {issue.blocker ? (
              <span className="rounded-sm border border-fail/30 bg-fail/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-fail">
                {labelFor(CHECK_STATUS_LABELS, "FAIL", language)}
              </span>
            ) : null}
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted">
              {check.publicName}
            </span>
          </div>
          <h3
            className={cn(
              "font-semibold leading-6 text-foreground",
              primary ? "text-lg" : "text-[15px]"
            )}
          >
            {issue.detectedIssue}
          </h3>
          <p className="mt-2 text-sm leading-6 text-subtle">
            {issue.suggestedFix}
          </p>
        </div>
        <div className="shrink-0 rounded border border-white/[0.07] bg-background px-3 py-2 text-sm text-subtle lg:w-44">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-muted">
            {ownerLabel}
          </p>
          <p className="mt-1 font-medium text-foreground/80">
            {formatOwner(issue.ownerSuggestion, language)}
          </p>
        </div>
      </div>
    </article>
  );
}

function DecisionMetric({
  label,
  value,
  tone
}: Readonly<{
  label: string;
  value: string;
  tone: "fail" | "warn" | "info";
}>) {
  return (
    <div className="min-w-0 rounded border border-white/[0.08] bg-background/80 px-3 py-3">
      <p className="whitespace-nowrap text-[11px] font-semibold uppercase leading-4 tracking-normal text-muted sm:text-xs sm:tracking-[0.03em]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold",
          tone === "fail" && "text-fail",
          tone === "warn" && "text-warn",
          tone === "info" && "text-info"
        )}
      >
        {value}
      </p>
    </div>
  );
}
