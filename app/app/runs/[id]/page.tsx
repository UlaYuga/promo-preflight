import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { countBlockers } from "@/api/v1";
import type { Run, RunBlocker } from "@/domain/model/Run";
import { getDb } from "@/infrastructure/db/client";
import { RunRepository } from "@/infrastructure/persistence/RunRepository";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RunPageParams = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function RunDetailPage({ params }: RunPageParams) {
  const { id } = await params;
  const run = await loadRun(id);

  if (!run) {
    notFound();
  }

  const counts = countBlockers(run.blockers);
  const verdictTone = getVerdictTone(run.verdict);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/app/campaigns"
          className="inline-flex items-center gap-2 rounded-sm hairline border bg-surface/70 px-3 py-2 text-[12px] font-medium text-subtle transition-colors hover:border-accent/40 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Campaigns
        </Link>

        <header className="hairline-b pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                Run Detail
              </p>
              <h1 className="display mt-3 break-words text-[32px] leading-tight tracking-tighter2 text-foreground sm:text-[40px]">
                {run.id}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-subtle">
                <span className="font-mono">{formatDate(run.createdAt)}</span>
                {run.completedAt ? (
                  <>
                    <span className="text-muted">/</span>
                    <span className="font-mono">Completed {formatDate(run.completedAt)}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                "inline-flex w-fit items-center gap-2 rounded-sm border px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em]",
                verdictTone.badge
              )}
            >
              {run.verdict === "GO" ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              )}
              {run.verdict}
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Status" value={run.status} />
          <Metric label="Blockers" value={String(counts.block)} tone="fail" />
          <Metric label="Warnings" value={String(counts.warn)} tone="warn" />
          <Metric label="Info" value={String(counts.info)} tone="info" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-sm hairline border bg-surface/60">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-background px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">
                  Findings
                </h2>
                <p className="mt-1 text-[12px] text-subtle">
                  Blocking and warning-level issues emitted for this run.
                </p>
              </div>
            </div>
            {run.blockers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-background">
                    <tr>
                      <HeaderCell>Rule</HeaderCell>
                      <HeaderCell>Severity</HeaderCell>
                      <HeaderCell>Evidence</HeaderCell>
                      <HeaderCell>Suggestion</HeaderCell>
                      <HeaderCell>Owner</HeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {run.blockers.map((blocker, index) => (
                      <FindingRow
                        key={`${blocker.ruleId}-${index}`}
                        blocker={blocker}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
                <CheckCircle2 className="h-6 w-6 text-pass" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  No findings for this run
                </p>
                <p className="mt-1 max-w-sm text-sm text-subtle">
                  The run completed without blockers, warnings, or info findings.
                </p>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-sm hairline border bg-surface/60 p-5">
            <h2 className="text-[15px] font-semibold text-foreground">
              Linked Records
            </h2>
            <dl className="mt-4 space-y-4">
              <DetailItem label="Campaign ID" value={run.campaignId ?? "Not linked"} />
              <DetailItem
                label="Campaign Version"
                value={run.version ? `v${run.version}` : "Not linked"}
              />
            </dl>
            {run.campaignId ? (
              <Link
                href={`/app/campaigns/${run.campaignId}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm hairline border bg-background px-3 py-2 text-[13px] font-medium text-subtle transition-colors hover:border-accent/40 hover:text-foreground"
              >
                Open Campaign
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </aside>
        </section>

        {run.verdict !== "GO" ? (
          <div className={cn("rounded-sm border px-4 py-3 text-sm", verdictTone.callout)}>
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Resolve or accept every blocking finding before treating this run as
                launch-ready.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

async function loadRun(id: string): Promise<Run | null> {
  const db = getDb();
  const repository = new RunRepository(db);
  return repository.findById(id);
}

function FindingRow({ blocker }: Readonly<{ blocker: RunBlocker }>) {
  return (
    <tr className="hairline-b align-top transition-colors hover:bg-surface/40">
      <td className="max-w-[220px] break-words px-5 py-4 font-mono text-[11px] text-foreground">
        {blocker.ruleId}
      </td>
      <td className="px-5 py-4">
        <span
          className={cn(
            "inline-flex rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
            severityClass(blocker.severity)
          )}
        >
          {blocker.severity}
        </span>
      </td>
      <td className="max-w-[280px] break-words px-5 py-4 text-[13px] leading-6 text-subtle">
        {blocker.evidence}
      </td>
      <td className="max-w-[300px] break-words px-5 py-4 text-[13px] leading-6 text-subtle">
        {blocker.suggestion}
      </td>
      <td className="px-5 py-4 text-[12px] text-subtle">
        {blocker.ownerHint ?? "-"}
      </td>
    </tr>
  );
}

function HeaderCell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <th className="px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
      {children}
    </th>
  );
}

function Metric({
  label,
  value,
  tone = "default"
}: Readonly<{
  label: string;
  value: string;
  tone?: "default" | "fail" | "warn" | "info";
}>) {
  const toneClass = {
    default: "text-foreground",
    fail: "text-fail",
    warn: "text-warn",
    info: "text-info"
  }[tone];

  return (
    <div className="rounded-sm hairline border bg-surface/60 px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold", toneClass)}>{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[13px] leading-6 text-subtle">{value}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getVerdictTone(verdict: Run["verdict"]) {
  if (verdict === "GO") {
    return {
      badge: "border-pass/30 bg-pass/10 text-pass",
      callout: "border-pass/20 bg-pass/10 text-pass"
    };
  }

  if (verdict === "WARN") {
    return {
      badge: "border-warn/30 bg-warn/10 text-warn",
      callout: "border-warn/30 bg-warn/10 text-warn"
    };
  }

  return {
    badge: "border-fail/30 bg-fail/10 text-fail",
    callout: "border-fail/30 bg-fail/10 text-fail"
  };
}

function severityClass(severity: RunBlocker["severity"]): string {
  if (severity === "block") {
    return "border-fail/40 bg-fail/15 text-fail";
  }
  if (severity === "warn") {
    return "border-warn/40 bg-warn/15 text-warn";
  }
  return "border-info/40 bg-info/15 text-info";
}
