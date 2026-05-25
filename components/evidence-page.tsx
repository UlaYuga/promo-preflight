"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileSearch,
  GitPullRequestArrow,
  RadioTower,
  Route,
  ShieldCheck,
  TestTube2
} from "lucide-react";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type MatrixItem = {
  area: string;
  visible: string;
  proof: string;
};

type RiskItem = {
  title: string;
  body: string;
};

type PathItem = {
  label: string;
  href: string;
  note: string;
};

const summaryStats = [
  ["08", "evidence.summary.checks"],
  ["10", "evidence.summary.endpoints"],
  ["196", "evidence.summary.tests"],
  ["23", "evidence.summary.rules"]
] as const;

const evidenceLinks = [
  {
    labelKey: "evidence.links.status",
    href: "/app/status",
    Icon: RadioTower
  },
  {
    labelKey: "evidence.links.api",
    href: "/app/api",
    Icon: Route
  },
  {
    labelKey: "evidence.links.docs",
    href: "https://github.com/UlaYuga/promo-preflight/blob/main/docs/API.md",
    Icon: FileSearch
  },
  {
    labelKey: "evidence.links.ci",
    href: "https://github.com/UlaYuga/promo-preflight/actions/workflows/ci.yml",
    Icon: TestTube2
  },
  {
    labelKey: "evidence.links.prs",
    href: "https://github.com/UlaYuga/promo-preflight/pulls?q=is%3Apr+is%3Aclosed",
    Icon: GitPullRequestArrow
  }
] as const;

export function EvidencePage() {
  const { get, t } = useI18n();
  const matrix = get<MatrixItem[]>("evidence.matrix.items") ?? [];
  const risks = get<RiskItem[]>("evidence.risks.items") ?? [];
  const reviewerPath = get<PathItem[]>("evidence.reviewerPath.items") ?? [];

  return (
    <div className="px-10 py-10 space-y-6">
      <header
        data-tour="evidence"
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            {t("evidence.eyebrow")}
          </p>
          <h1 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">
            {t("evidence.title")}
          </h1>
          <p className="mt-2 max-w-[68ch] text-[14.5px] leading-[1.55] text-subtle">
            {t("evidence.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-4 overflow-hidden rounded border border-white/[0.07] bg-surface/50">
          {summaryStats.map(([value, key], index) => (
            <div
              key={key}
              className={cn(
                "min-w-24 px-4 py-3",
                index < summaryStats.length - 1 && "border-r border-white/[0.06]"
              )}
            >
              <p className="font-mono text-2xl leading-none text-foreground">{value}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                {t(key as TranslationKey)}
              </p>
            </div>
          ))}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.74fr]">
        <CapabilityMatrix items={matrix} />
        <ReviewerPath items={reviewerPath} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.78fr_1fr]">
        <RiskRegister items={risks} />
        <ArchitectureStory />
      </section>

      <EvidenceLinks />
    </div>
  );
}

function CapabilityMatrix({ items }: Readonly<{ items: MatrixItem[] }>) {
  const { t } = useI18n();

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">
            {t("evidence.matrix.title")}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted">{t("evidence.matrix.subtitle")}</p>
      </div>
      <div className="sm:hidden">
        <ul className="divide-y divide-white/[0.05]">
          {items.map((item) => (
            <li key={item.area} className="space-y-3 px-4 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  {t("evidence.matrix.area")}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.area}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  {t("evidence.matrix.visible")}
                </p>
                <p className="mt-1 text-sm leading-6 text-subtle">{item.visible}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  {t("evidence.matrix.proof")}
                </p>
                <p className="mt-1 text-sm leading-6 text-subtle">{item.proof}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/[0.07] text-muted">
            <tr>
              <th className="px-4 py-2 font-mono uppercase tracking-[0.16em]">
                {t("evidence.matrix.area")}
              </th>
              <th className="px-4 py-2 font-mono uppercase tracking-[0.16em]">
                {t("evidence.matrix.visible")}
              </th>
              <th className="px-4 py-2 font-mono uppercase tracking-[0.16em]">
                {t("evidence.matrix.proof")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {items.map((item) => (
              <tr key={item.area} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-foreground">{item.area}</td>
                <td className="px-4 py-3 text-subtle">{item.visible}</td>
                <td className="px-4 py-3 text-subtle">{item.proof}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReviewerPath({ items }: Readonly<{ items: PathItem[] }>) {
  const { t } = useI18n();

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">
            {t("evidence.reviewerPath.title")}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          {t("evidence.reviewerPath.subtitle")}
        </p>
      </div>
      <ol className="divide-y divide-white/[0.05]">
        {items.map((item, index) => (
          <li key={item.href} className="grid grid-cols-[34px_1fr] gap-3 px-4 py-3">
            <span className="font-mono text-xs text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <Link
                href={item.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition hover:text-accent"
              >
                {item.label}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <p className="mt-1 text-xs leading-5 text-subtle">{item.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RiskRegister({ items }: Readonly<{ items: RiskItem[] }>) {
  const { t } = useI18n();

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">
            {t("evidence.risks.title")}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted">{t("evidence.risks.subtitle")}</p>
      </div>
      <ul className="divide-y divide-white/[0.05]">
        {items.map((item) => (
          <li key={item.title} className="px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-subtle">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArchitectureStory() {
  const { get, t } = useI18n();
  const steps = get<string[]>("evidence.architecture.steps") ?? [];

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">
            {t("evidence.architecture.title")}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          {t("evidence.architecture.subtitle")}
        </p>
      </div>
      <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2">
        {steps.map((step, index) => (
          <div key={step} className="bg-surface/70 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 text-sm leading-6 text-subtle">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceLinks() {
  const { t } = useI18n();

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {t("evidence.links.title")}
        </h2>
        <p className="mt-1 text-xs text-muted">{t("evidence.links.subtitle")}</p>
      </div>
      <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-5">
        {evidenceLinks.map(({ labelKey, href, Icon }) => {
          const external = href.startsWith("http");
          const className =
            "group bg-surface/70 px-4 py-4 text-sm text-foreground/80 transition hover:bg-surface hover:text-foreground";
          const content = (
            <>
              <Icon className="h-4 w-4 text-subtle transition group-hover:text-accent" aria-hidden="true" />
              <span className="mt-3 inline-flex items-center gap-2">
                {t(labelKey as TranslationKey)}
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </span>
            </>
          );

          return external ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {content}
            </a>
          ) : (
            <Link key={href} href={href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
