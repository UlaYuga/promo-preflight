"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  FileCode2,
  Workflow
} from "lucide-react";
import type { StatsResponse } from "@api/v1";
import { useI18n, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// External, stable URLs the system status surfaces. Hardcoded so the page works
// without env-var coupling — the repo URL is public, the GitHub Actions URL is
// derived from it, the audit JSON is a relative endpoint on the same origin.
const REPO_URL = "https://github.com/UlaYuga/promo-preflight";
const API_DOCS_URL = `${REPO_URL}/blob/main/docs/API.md`;
const CI_URL = `${REPO_URL}/actions/workflows/ci.yml`;
const AUDIT_JSON_URL = "/api/v1/audit?limit=50";

// Polling cadence is constrained by the server-side rate limiter (default
// 20 requests / 60s per IP). Audit at 5s + slow trio at 30s yields ≈18 req/min
// per visitor, leaving headroom for the rest of the workspace.
const POLL_FAST_MS = 5000;
const POLL_SLOW_MS = 30000;

type HealthState =
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "down" };

type ReadyState =
  | { kind: "checking" }
  | { kind: "ok"; checks: { env: string; db: string; migrations: string } }
  | { kind: "not-ready"; checks: { env: string; db: string; migrations: string } }
  | { kind: "error" };

interface AuditItem {
  id: string;
  eventType: string;
  actor: string;
  createdAt: string;
}

type StatsState =
  | { kind: "loading" }
  | { kind: "ok"; data: StatsResponse }
  | { kind: "error" };

type AuditState =
  | { kind: "loading" }
  | { kind: "ok"; items: AuditItem[] }
  | { kind: "error" };

export function SystemStatus() {
  const { t } = useI18n();
  const [health, setHealth] = useState<HealthState>({ kind: "checking" });
  const [ready, setReady] = useState<ReadyState>({ kind: "checking" });
  const [stats, setStats] = useState<StatsState>({ kind: "loading" });
  const [audit, setAudit] = useState<AuditState>({ kind: "loading" });

  // Pause polling when the tab is hidden; the React state is preserved so the
  // page resumes cleanly on focus without a flash of "checking…".
  const visibleRef = useRef(true);

  const fetchHealth = useCallback(async () => {
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      setHealth(r.ok ? { kind: "ok" } : { kind: "down" });
    } catch {
      setHealth({ kind: "down" });
    }
  }, []);

  const fetchReady = useCallback(async () => {
    try {
      const r = await fetch("/api/ready", { cache: "no-store" });
      // Non-2xx (rate limit, edge timeout, etc.) does not mean the database
      // is unhealthy — surface as a transient error so the page does not flash
      // a false "degraded" while a 503 from /ready would.
      if (!r.ok && r.status !== 503) {
        setReady({ kind: "error" });
        return;
      }
      const body = (await r.json()) as {
        status?: string;
        checks?: { env?: string; db?: string; migrations?: string };
      };
      const checks = {
        env: body.checks?.env ?? "?",
        db: body.checks?.db ?? "?",
        migrations: body.checks?.migrations ?? "?"
      };
      setReady(
        body.status === "ok"
          ? { kind: "ok", checks }
          : { kind: "not-ready", checks }
      );
    } catch {
      setReady({ kind: "error" });
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch("/api/v1/stats", { cache: "no-store" });
      if (!r.ok) {
        setStats({ kind: "error" });
        return;
      }
      const data = (await r.json()) as StatsResponse;
      setStats({ kind: "ok", data });
    } catch {
      setStats({ kind: "error" });
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const r = await fetch(AUDIT_JSON_URL, { cache: "no-store" });
      if (!r.ok) {
        setAudit({ kind: "error" });
        return;
      }
      const body = (await r.json()) as { items?: AuditItem[] };
      setAudit({ kind: "ok", items: body.items ?? [] });
    } catch {
      setAudit({ kind: "error" });
    }
  }, []);

  // Initial fetch on mount + visibility tracking. Each fetch sets its own
  // state slice via the useCallback above; the lint exception scopes the
  // intentional set-in-effect to this block (same pattern as handoff-page).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    void fetchHealth();
    void fetchReady();
    void fetchStats();
    void fetchAudit();

    function onVisibility() {
      visibleRef.current = !document.hidden;
      if (visibleRef.current) {
        void fetchAudit();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [fetchHealth, fetchReady, fetchStats, fetchAudit]);

  // Fast poll: audit feed
  useEffect(() => {
    const id = setInterval(() => {
      if (visibleRef.current) void fetchAudit();
    }, POLL_FAST_MS);
    return () => clearInterval(id);
  }, [fetchAudit]);

  // Slow poll: health + ready + stats
  useEffect(() => {
    const id = setInterval(() => {
      if (!visibleRef.current) return;
      void fetchHealth();
      void fetchReady();
      void fetchStats();
    }, POLL_SLOW_MS);
    return () => clearInterval(id);
  }, [fetchHealth, fetchReady, fetchStats]);

  const overallOk = health.kind === "ok" && ready.kind === "ok";

  return (
    <div className="px-10 py-10 space-y-6">
      <header
        data-tour="system-status"
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            {t("systemStatus.eyebrow")}
          </p>
          <h2 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">
            {t("systemStatus.title")}
          </h2>
          <p className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.55] text-subtle">
            {t("systemStatus.subtitle")}
          </p>
        </div>
        <span
          data-qa="overall-status-pill"
          className={cn(
            "inline-flex items-center gap-2 rounded-sm hairline border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]",
            overallOk
              ? "border-pass/30 bg-pass/5 text-pass"
              : ready.kind === "checking" || health.kind === "checking"
              ? "border-white/[0.07] bg-surface text-subtle"
              : "border-fail/30 bg-fail/5 text-fail"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              overallOk ? "bg-pass" : "bg-fail"
            )}
            aria-hidden="true"
          />
          {overallOk
            ? t("systemStatus.health.ok")
            : ready.kind === "checking" ||
              ready.kind === "error" ||
              health.kind === "checking"
            ? t("systemStatus.health.checking")
            : t("systemStatus.health.degraded")}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <HealthCard health={health} ready={ready} />
        <MetricsCard stats={stats} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoListCard
          titleKey="systemStatus.pipeline.title"
          subtitleKey="systemStatus.pipeline.subtitle"
          itemsKey="systemStatus.pipeline.steps"
          Icon={Workflow}
        />
        <InfoListCard
          titleKey="systemStatus.reliability.title"
          subtitleKey="systemStatus.reliability.subtitle"
          itemsKey="systemStatus.reliability.items"
          Icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoListCard
          titleKey="systemStatus.endpointCatalog.title"
          subtitleKey="systemStatus.endpointCatalog.subtitle"
          itemsKey="systemStatus.endpointCatalog.items"
          Icon={Code2}
          mono
        />
        <InfoListCard
          titleKey="systemStatus.quality.title"
          subtitleKey="systemStatus.quality.subtitle"
          itemsKey="systemStatus.quality.items"
          Icon={FileCode2}
        />
      </div>

      <AuditFeedCard audit={audit} />

      <LinksCard />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static proof cards
// ---------------------------------------------------------------------------

function InfoListCard({
  titleKey,
  subtitleKey,
  itemsKey,
  Icon,
  mono = false
}: Readonly<{
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  itemsKey: string;
  Icon: typeof FileCode2;
  mono?: boolean;
}>) {
  const { t, get } = useI18n();
  const items = get<string[]>(itemsKey) ?? [];

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">{t(titleKey)}</h3>
        </div>
        <p className="mt-1 text-xs text-muted">{t(subtitleKey)}</p>
      </div>
      <ul className="divide-y divide-white/[0.05]">
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              "px-4 py-2.5 text-sm text-subtle",
              mono && "font-mono text-xs text-foreground/80"
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Health card
// ---------------------------------------------------------------------------

function HealthCard({
  health,
  ready
}: Readonly<{ health: HealthState; ready: ReadyState }>) {
  const { t } = useI18n();

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("systemStatus.health.title")}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          {t("systemStatus.health.subtitle")}
        </p>
      </div>

      <ul className="divide-y divide-white/[0.05]">
        <CheckRow
          label={t("systemStatus.health.liveness")}
          state={health.kind === "ok" ? "ok" : health.kind === "checking" ? "checking" : "fail"}
        />
        <CheckRow
          label={t("systemStatus.health.readiness")}
          state={
            ready.kind === "ok"
              ? "ok"
              : ready.kind === "checking" || ready.kind === "error"
              ? "checking"
              : "fail"
          }
        />
        {ready.kind === "ok" || ready.kind === "not-ready" ? (
          <>
            <CheckRow
              label={t("systemStatus.health.env")}
              state={ready.checks.env === "ok" ? "ok" : "fail"}
              detail={ready.checks.env}
            />
            <CheckRow
              label={t("systemStatus.health.db")}
              state={ready.checks.db === "ok" ? "ok" : "fail"}
              detail={ready.checks.db}
            />
            <CheckRow
              label={t("systemStatus.health.migrations")}
              state={ready.checks.migrations === "ok" ? "ok" : "fail"}
              detail={ready.checks.migrations}
            />
          </>
        ) : null}
      </ul>
    </section>
  );
}

function CheckRow({
  label,
  state,
  detail
}: Readonly<{ label: string; state: "ok" | "fail" | "checking"; detail?: string }>) {
  return (
    <li className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-foreground/80">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]",
          state === "ok" && "text-pass",
          state === "fail" && "text-fail",
          state === "checking" && "text-muted"
        )}
      >
        {state === "ok" ? (
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        ) : state === "fail" ? (
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {detail ?? state}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Metrics card
// ---------------------------------------------------------------------------

function MetricsCard({ stats }: Readonly<{ stats: StatsState }>) {
  const { t, language } = useI18n();

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("systemStatus.metrics.title")}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          {t("systemStatus.metrics.subtitle")}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-white/[0.05]">
        <Metric
          label={t("systemStatus.metrics.totalRuns")}
          value={stats.kind === "ok" ? String(stats.data.totalRuns) : "—"}
          loading={stats.kind === "loading"}
        />
        <Metric
          label={t("systemStatus.metrics.totalEvents")}
          value={stats.kind === "ok" ? String(stats.data.totalEvents) : "—"}
          loading={stats.kind === "loading"}
        />
        <Metric
          label={t("systemStatus.metrics.runP95LatencyMs")}
          value={
            stats.kind === "ok" && stats.data.runP95LatencyMs !== null
              ? `${stats.data.runP95LatencyMs} ${t("systemStatus.metrics.ms")}`
              : t("systemStatus.metrics.unknown")
          }
          loading={stats.kind === "loading"}
        />
        <Metric
          label={t("systemStatus.metrics.lastEventAt")}
          value={
            stats.kind === "ok" && stats.data.lastEventAt
              ? formatRelative(stats.data.lastEventAt, language)
              : stats.kind === "ok"
              ? t("systemStatus.metrics.never")
              : t("systemStatus.metrics.unknown")
          }
          loading={stats.kind === "loading"}
        />
      </dl>
    </section>
  );
}

function Metric({
  label,
  value,
  loading
}: Readonly<{ label: string; value: string; loading: boolean }>) {
  return (
    <div className="bg-surface/60 px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-mono text-lg text-foreground",
          loading && "text-subtle"
        )}
      >
        {loading ? "…" : value}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit feed card
// ---------------------------------------------------------------------------

function AuditFeedCard({ audit }: Readonly<{ audit: AuditState }>) {
  const { t, language } = useI18n();

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("systemStatus.feed.title")}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          {t("systemStatus.feed.subtitle")}
        </p>
      </div>

      {audit.kind === "loading" ? (
        <div className="px-4 py-6 text-center text-xs text-muted">…</div>
      ) : audit.kind === "error" ? (
        <div className="px-4 py-6 text-center text-xs text-fail">—</div>
      ) : audit.items.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted">
          {t("systemStatus.feed.empty")}
        </div>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur">
              <tr className="text-muted">
                <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                  {t("systemStatus.feed.time")}
                </th>
                <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                  {t("systemStatus.feed.type")}
                </th>
                <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                  {t("systemStatus.feed.actor")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {audit.items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2 font-mono text-foreground/80">
                    {formatRelative(item.createdAt, language)}
                  </td>
                  <td className="px-4 py-2 font-mono text-foreground">
                    {item.eventType}
                  </td>
                  <td className="px-4 py-2 text-subtle">{item.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Links card
// ---------------------------------------------------------------------------

function LinksCard() {
  const { t } = useI18n();

  const links: Array<{ label: string; href: string; Icon: typeof FileCode2 }> = [
    { label: t("systemStatus.links.apiDocs"), href: API_DOCS_URL, Icon: FileCode2 },
    { label: t("systemStatus.links.apiContract"), href: "/app/api", Icon: Code2 },
    { label: t("systemStatus.links.repo"), href: REPO_URL, Icon: Code2 },
    { label: t("systemStatus.links.auditJson"), href: AUDIT_JSON_URL, Icon: Database },
    { label: t("systemStatus.links.ci"), href: CI_URL, Icon: Workflow }
  ];

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("systemStatus.links.title")}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {t("systemStatus.links.subtitle")}
        </p>
      </div>
      <ul className="divide-y divide-white/[0.05]">
        {links.map(({ label, href, Icon }) => (
          <li key={href}>
            <a
              href={href}
              target={href.startsWith("/") ? undefined : "_blank"}
              rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
              className="group flex items-center justify-between px-4 py-3 text-sm text-foreground/80 transition hover:bg-white/[0.02] hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />
                {label}
              </span>
              <ArrowUpRight
                className="h-3.5 w-3.5 text-muted transition group-hover:text-accent"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(iso: string, language: Language): string {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return iso;
  const diffMs = Date.now() - ts;
  const locale = language === "ru" ? "ru" : "en";
  const date = new Date(iso);
  if (diffMs < 0) {
    return new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(date);
  }

  const sec = Math.round(diffMs / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (sec < 60) return formatter.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (min < 60) return formatter.format(-min, "minute");
  const hr = Math.round(min / 60);
  if (hr < 24) return formatter.format(-hr, "hour");
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
