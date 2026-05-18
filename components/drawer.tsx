"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bolt,
  Copy,
  X
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type DrawerPayload =
  | { kind: "issue"; payload: IssueDrawerData }
  | { kind: "campaign"; payload: CampaignDrawerData }
  | { kind: "rule"; payload: RuleDrawerData }
  | { kind: "example"; payload: ExampleDrawerData }
  | null;

export type IssueDrawerData = {
  id: string;
  checkId: string;
  checkName?: string;
  checkNameRu?: string;
  status: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  blocker: boolean;
  owner: string;
  detectedEn: string;
  detectedRu: string;
  fixEn: string;
  fixRu: string;
  whyEn: string;
  whyRu: string;
  evidence?: Array<{ field: string; snippet: string }>;
};

export type CampaignDrawerData = {
  id: string;
  name: string;
  type: string;
  geo: string;
  state: string;
  owner: string;
  ownerRole?: string;
  fail: number;
  warn: number;
  updated: string;
  findings?: Array<{
    id: string;
    status: string;
    detectedEn: string;
    detectedRu: string;
  }>;
};

export type RuleDrawerData = {
  id: string;
  check: string;
  checkName?: string;
  checkNameRu?: string;
  domain: string;
  sev: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  textEn: string;
  textRu: string;
};

export type ExampleDrawerData = {
  id: string;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
};

export function Drawer({
  drawer,
  onClose
}: Readonly<{
  drawer: DrawerPayload;
  onClose: () => void;
}>) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!drawer) return null;

  const { kind, payload } = drawer;

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="flex-1 bg-black/55 backdrop-blur-md" />
      <aside
        className="drawer-in w-[520px] max-w-[92vw] bg-page hairline-l h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-6 pb-5 hairline-b flex items-center justify-between">
          <Eyebrow>
            {kind === "issue" && `Issue · ${payload.id}`}
            {kind === "campaign" && `Campaign · ${(payload as CampaignDrawerData).id}`}
            {kind === "rule" && `Rule · ${(payload as RuleDrawerData).id}`}
            {kind === "example" && `Example · ${(payload as ExampleDrawerData).id}`}
          </Eyebrow>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {kind === "issue" && <IssueDrawer issue={payload as IssueDrawerData} />}
        {kind === "campaign" && (
          <CampaignDrawer
            c={payload as CampaignDrawerData}
            onOpenRiskReport={() => {
              onClose();
              router.push("/app/risk-report");
            }}
          />
        )}
        {kind === "rule" && <RuleDrawer r={payload as RuleDrawerData} />}
        {kind === "example" && <ExampleDrawer ex={payload as ExampleDrawerData} />}
      </aside>
    </div>
  );
}

function Eyebrow({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
      {children}
    </p>
  );
}

function IssueDrawer({ issue }: Readonly<{ issue: IssueDrawerData }>) {
  const { language } = useI18n();
  const locale = language;
  const detected = locale === "ru" ? issue.detectedRu : issue.detectedEn;
  const fix = locale === "ru" ? issue.fixRu : issue.fixEn;
  const why = locale === "ru" ? issue.whyRu : issue.whyEn;
  const checkName = locale === "ru" ? issue.checkNameRu : issue.checkName;

  return (
    <div className="px-7 py-7">
      <Eyebrow>{checkName || issue.checkId}</Eyebrow>
      <h3 className="display mt-4 text-[34px] leading-[1.1] tracking-tightest">
        {detected.length > 80 ? detected.slice(0, 72) + "…" : detected}
      </h3>

      <div className="mt-7 grid grid-cols-2 gap-y-6 gap-x-8">
        <Kv
          label={locale === "ru" ? "Критичность" : "Severity"}
          value={
            locale === "ru"
              ? severityRu(issue.severity)
              : issue.severity
          }
        />
        <Kv
          label={locale === "ru" ? "Блокер" : "Blocker"}
          value={issue.blocker ? (locale === "ru" ? "Да" : "Yes") : locale === "ru" ? "Нет" : "No"}
        />
        <Kv label={locale === "ru" ? "Владелец" : "Owner"} value={issue.owner} />
        <Kv label={locale === "ru" ? "Статус" : "Status"} value={issue.status} />
      </div>

      {issue.evidence && issue.evidence.length > 0 && (
        <DrawerSection title={locale === "ru" ? "Доказательства" : "Evidence"}>
          <div className="space-y-3">
            {issue.evidence.map((e, i) => (
              <div key={i} className="hairline border rounded-sm p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  {e.field}
                </p>
                <p className="mt-2 font-mono text-[12px] text-foreground/85 leading-[1.5]">
                  &ldquo;{e.snippet}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </DrawerSection>
      )}

      <DrawerSection title={locale === "ru" ? "Как исправить" : "Suggested fix"}>
        <p className="text-[14.5px] tracking-tight2 leading-[1.55]">{fix}</p>
      </DrawerSection>

      <DrawerSection title={locale === "ru" ? "Почему важно" : "Why it matters"}>
        <p className="text-[13.5px] text-subtle leading-[1.6]">{why}</p>
      </DrawerSection>

      <div className="mt-8 flex gap-2.5">
        <button
          type="button"
          className="flex-1 hairline border px-3 py-2 rounded-sm text-[12.5px] hover:border-overlay inline-flex items-center justify-center gap-2 transition"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {locale === "ru" ? "Скопировать" : "Copy fix"}
        </button>
        <button
          type="button"
          className="flex-1 hairline border px-3 py-2 rounded-sm text-[12.5px] hover:border-overlay inline-flex items-center justify-center gap-2 transition"
        >
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          {locale === "ru" ? "К готовности" : "Go to Readiness"}
        </button>
      </div>
    </div>
  );
}

function CampaignDrawer({
  c,
  onOpenRiskReport
}: Readonly<{
  c: CampaignDrawerData;
  onOpenRiskReport: () => void;
}>) {
  const { language } = useI18n();
  const locale = language;

  return (
    <div className="px-7 py-7">
      <Eyebrow>
        {c.type} · {c.geo}
      </Eyebrow>
      <h3 className="display mt-4 text-[40px] leading-[1.1] tracking-tightest">
        {c.name}
      </h3>

      <div className="mt-3 flex items-center gap-3">
        <StatusLabel status={c.state} />
        <span className="font-mono text-[11px] text-muted">
          {locale === "ru" ? `Обновлено ${c.updated} назад` : `Updated ${c.updated} ago`}
        </span>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-y-6">
        <Stat n={c.fail} label={locale === "ru" ? "Сбой" : "Fail"} tone={c.fail ? "fail" : "text"} />
        <Stat n={c.warn} label={locale === "ru" ? "Внимание" : "Warn"} tone={c.warn ? "warn" : "text"} />
        <Stat
          n={c.fail + c.warn === 0 ? 8 : 8 - c.fail - c.warn}
          label={locale === "ru" ? "Чисто" : "Pass"}
          tone="pass"
        />
      </div>

      <DrawerSection title={locale === "ru" ? "Владелец" : "Owner"}>
        <p className="text-[14.5px] tracking-tight2">{c.owner}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {c.ownerRole || "Product"}
        </p>
      </DrawerSection>

      {c.findings && c.findings.length > 0 && (
        <DrawerSection title={locale === "ru" ? "Последние замечания" : "Recent findings"}>
          <ul className="hairline-t">
            {c.findings.map((f) => (
              <li key={f.id} className="py-3.5 hairline-b">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] text-muted">{f.id}</span>
                  <StatusLabel status={f.status} />
                </div>
                <p className="mt-1.5 text-[13.5px] tracking-tight2 leading-[1.45]">
                  {locale === "ru" ? f.detectedRu : f.detectedEn}
                </p>
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}

      <div className="mt-8 flex gap-2.5">
        <button
          type="button"
          className="flex-1 bg-accent text-ink px-3 py-2 rounded-sm text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 hover:brightness-95 transition"
        >
          <Bolt className="h-3.5 w-3.5" aria-hidden="true" />
          {locale === "ru" ? "Перезапустить" : "Re-run preflight"}
        </button>
        <button
          type="button"
          onClick={onOpenRiskReport}
          className="flex-1 hairline border px-3 py-2 rounded-sm text-[12.5px] hover:border-overlay inline-flex items-center justify-center gap-2 transition"
        >
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          {locale === "ru" ? "Отчёт о рисках" : "Open Risk Report"}
        </button>
      </div>
    </div>
  );
}

function RuleDrawer({ r }: Readonly<{ r: RuleDrawerData }>) {
  const { language } = useI18n();
  const locale = language;
  const text = locale === "ru" ? r.textRu : r.textEn;
  const checkName = locale === "ru" ? r.checkNameRu : r.checkName;

  return (
    <div className="px-7 py-7">
      <Eyebrow>
        {checkName || r.check} · {r.domain}
      </Eyebrow>
      <h3 className="display mt-4 text-[28px] tracking-tighter2 leading-[1.15]">
        {text}
      </h3>

      <div className="mt-6 grid grid-cols-2 gap-y-5">
        <Kv
          label={locale === "ru" ? "Критичность" : "Severity"}
          value={locale === "ru" ? severityRu(r.sev) : r.sev}
        />
        <Kv label={locale === "ru" ? "Домен" : "Domain"} value={r.domain} />
        <Kv label={locale === "ru" ? "Проверка" : "Check"} value={checkName || r.check} />
      </div>

      <DrawerSection title={locale === "ru" ? "Что делает" : "What it does"}>
        <p className="text-[13.5px] text-subtle leading-[1.6]">
          {locale === "ru"
            ? "Детерминированное правило, срабатывающее при preflight. Читает бандл, фиксирует замечание если предикат не выполнен. Без промптов, без LLM — чистый TypeScript"
            : "Deterministic rule fired during preflight. Reads from the bundle, raises a finding when the predicate fails. No prompts, no LLM calls — pure TypeScript"}
        </p>
      </DrawerSection>
    </div>
  );
}

function ExampleDrawer({ ex }: Readonly<{ ex: ExampleDrawerData }>) {
  const { language } = useI18n();
  const locale = language;
  const label = locale === "ru" ? ex.labelRu : ex.labelEn;
  const desc = locale === "ru" ? ex.descRu : ex.descEn;

  return (
    <div className="px-7 py-7">
      <h3 className="display mt-2 text-[34px] leading-[1.1] tracking-tightest">
        {label}
      </h3>
      <p className="mt-3 text-[13.5px] text-subtle leading-[1.55]">
        {desc || "Synthetic scenario."}
      </p>
    </div>
  );
}

function Kv({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      <p className="mt-1.5 text-[14px] tracking-tight2">{value}</p>
    </div>
  );
}

function DrawerSection({
  title,
  children
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="mt-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted mb-3">
        {title}
      </p>
      {children}
    </section>
  );
}

function Stat({
  n,
  label,
  tone = "text"
}: Readonly<{
  n: number;
  label: string;
  tone?: "text" | "pass" | "warn" | "fail" | "accent";
}>) {
  const c =
    {
      text: "text-foreground",
      pass: "text-pass",
      warn: "text-warn",
      fail: "text-fail",
      accent: "text-accent"
    }[tone] || "text-foreground";

  return (
    <div>
      <p
        className={cn(
          "display num text-[28px] stack-tight tracking-tighter2",
          c
        )}
      >
        {String(n).padStart(2, "0")}
      </p>
      <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
    </div>
  );
}

function StatusLabel({
  status,
  className = ""
}: Readonly<{ status: string; className?: string }>) {
  const colorMap: Record<string, string> = {
    PASS: "text-pass",
    WARN: "text-warn",
    FAIL: "text-fail",
    BLOCKED: "text-fail",
    READY: "text-pass",
    REVIEW: "text-subtle",
    N_A: "text-muted"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]",
        colorMap[status] || "text-subtle",
        className
      )}
    >
      <span
        className={cn(
          "block h-1.5 w-1.5 rounded-full",
          status === "PASS" || status === "READY"
            ? "bg-pass"
            : status === "WARN"
              ? "bg-warn"
              : status === "FAIL" || status === "BLOCKED"
                ? "bg-fail"
                : "bg-sub"
        )}
      />
      {status}
    </span>
  );
}

function severityRu(sev: string) {
  const map: Record<string, string> = {
    CRITICAL: "Критический",
    HIGH: "Высокая",
    MEDIUM: "Средняя",
    LOW: "Низкая"
  };
  return map[sev] || sev;
}
