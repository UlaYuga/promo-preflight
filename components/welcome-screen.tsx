"use client";

import Link from "next/link";
import {
  Activity,
  BellRing,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  DatabaseZap,
  FileSearch,
  GitCompareArrows,
  GitPullRequestArrow,
  RadioTower,
  Send,
  ServerCog,
  ShieldCheck
} from "lucide-react";
import { TourLauncher } from "@/components/tour-launcher";
import { LanguageToggle, useI18n } from "@/lib/i18n";

const workflowIcons = [
  DatabaseZap,
  ShieldCheck,
  RadioTower,
  ServerCog,
  ClipboardCheck,
  BellRing,
  FileSearch,
  GitCompareArrows,
  Send,
  Activity
];

const particles = Array.from({ length: 14 }, (_, i) => {
  const seed = (i * 2654435761) >>> 0;
  const r1 = ((seed & 0xffff) / 0xffff);
  const r2 = (((seed >> 16) & 0xffff) / 0xffff);
  const r3 = (((seed * 3) >>> 0) & 0xffff) / 0xffff;
  const r4 = (((seed * 7) >>> 0) & 0xffff) / 0xffff;
  return {
    size: 3 + r1 * 4,
    left: 5 + r2 * 90,
    top: 10 + r3 * 80,
    alpha: 0.3 + r4 * 0.4,
    glowSize: 4 + r1 * 8,
    animDuration: 6 + r2 * 10,
    animDelay: r3 * 8,
  };
});

export function WelcomeScreen() {
  const { get, t } = useI18n();
  const workflow =
    get<Array<{ label: string; description: string }>>("welcome.workflowPreview") ?? [];

  return (
    <main className="relative h-screen overflow-hidden bg-background text-foreground">
      {/* ── Layer 1: Editorial blurred portrait backdrop ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute right-[-8%] top-[-5%] h-[120%] w-[55%] blur-[90px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 55% 45%, rgba(180,170,160,0.16), transparent 70%), radial-gradient(ellipse 50% 65% at 40% 35%, rgba(160,150,140,0.11), transparent 65%), radial-gradient(circle at 50% 50%, rgba(200,195,185,0.08), transparent 50%)",
            animation: "fog-drift 28s ease-in-out infinite"
          }}
        />
        <div
          className="absolute left-[-5%] bottom-[-10%] h-[90%] w-[40%] blur-[80px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 60%, rgba(60,60,65,0.12), transparent 70%)",
            animation: "fog-drift 32s ease-in-out infinite 4s"
          }}
        />
      </div>

      {/* ── Layer 2: Green wave / glow atmosphere ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-[10%] top-[-20%] h-[70%] w-[55%] blur-[90px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(197,255,61,0.18), transparent 70%)",
            animation: "glow-pulse 8s ease-in-out infinite"
          }}
        />
        <div
          className="absolute right-[-5%] top-[25%] h-[55%] w-[45%] blur-[80px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(197,255,61,0.14), transparent 70%)",
            animation: "glow-pulse 10s ease-in-out infinite 3s"
          }}
        />
        <div
          className="absolute left-[35%] top-[5%] h-[45%] w-[35%] blur-[70px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(95,109,205,0.10), transparent 70%)",
            animation: "fog-drift 22s ease-in-out infinite 1.5s"
          }}
        />
        <div
          className="absolute bottom-0 left-0 h-[30%] w-full blur-[50px]"
          style={{
            background:
              "linear-gradient(to top, rgba(197,255,61,0.10), transparent 75%)",
            animation: "glow-pulse 12s ease-in-out infinite 2s"
          }}
        />
      </div>

      {/* ── Layer 3: Green light particles ── */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: `radial-gradient(circle, rgba(197,255,61,${p.alpha}), transparent)`,
              boxShadow: `0 0 ${p.glowSize}px rgba(197,255,61,0.35)`,
              animation: `particle-float ${p.animDuration}s ease-in-out infinite`,
              animationDelay: `${p.animDelay}s`,
              opacity: 0
            }}
          />
        ))}
      </div>

      {/* ── Layer 4: Film grain / texture ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.03] mix-blend-overlay"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
          animation: "grain-shift 8s steps(1) infinite"
        }}
      />

      {/* ── Layer 5: Content ── */}
      <div className="relative z-10 mx-auto flex h-screen w-full max-w-7xl flex-col px-6 py-5 sm:px-10 lg:px-12 lg:py-6">
        <header className="flex items-center justify-between border-b border-[#1d1d23]/60 py-4">
          <span />
          <LanguageToggle className="scale-110 origin-top-right" />
        </header>

        <section className="grid flex-1 min-h-0 gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:gap-14">
          <div data-tour="welcome-overview" className="max-h-full overflow-y-auto pr-1">
            <h1 className="text-6xl font-medium leading-[0.90] tracking-[-0.03em] text-foreground sm:text-7xl lg:text-[5.5rem] text-glow-green">
              Promo
              <br />
              <span className="text-subtle">Preflight</span>
            </h1>

            <p className="mt-7 max-w-2xl text-[1.5rem] font-medium leading-[1.15] tracking-[-0.01em] text-foreground sm:text-[1.75rem]">
              {t("welcome.positioning")}
            </p>

            <p className="mt-5 max-w-xl text-lg leading-7 text-subtle">
              {t("welcome.body")}
            </p>

            <p className="mt-5 max-w-2xl rounded-sm border border-white/[0.08] bg-surface/45 px-4 py-3 font-mono text-[11px] uppercase leading-5 tracking-[0.14em] text-subtle">
              {t("welcome.proofStrip")}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <TourLauncher />
              <Link
                href="/app/intake?examples=1"
                className="glass-surface inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-md border border-white/[0.08] px-7 py-3 text-base font-medium text-foreground transition-all duration-300 hover:border-white/[0.14] hover:bg-page/70 hover:shadow-[0_0_40px_rgba(197,255,61,0.06)]"
              >
                {t("welcome.testCases")}
                <BookOpen className="h-[18px] w-[18px] text-subtle" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-subtle">
              {t("welcome.ctaHint")}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <Link
                href="/app/status"
                className="inline-flex items-center gap-2 rounded-sm border border-white/[0.08] bg-page/45 px-3 py-2 text-foreground transition hover:border-accent/30 hover:text-accent"
              >
                <Activity className="h-4 w-4" aria-hidden="true" />
                {t("welcome.systemLinks.status")}
              </Link>
              <Link
                href="/app/api"
                className="inline-flex items-center gap-2 rounded-sm border border-white/[0.08] bg-page/45 px-3 py-2 text-foreground transition hover:border-accent/30 hover:text-accent"
              >
                <Code2 className="h-4 w-4" aria-hidden="true" />
                {t("welcome.systemLinks.api")}
              </Link>
              <Link
                href="/app/evidence"
                className="inline-flex items-center gap-2 rounded-sm border border-white/[0.08] bg-page/45 px-3 py-2 text-foreground transition hover:border-accent/30 hover:text-accent"
              >
                <GitPullRequestArrow className="h-4 w-4" aria-hidden="true" />
                {t("welcome.systemLinks.evidence")}
              </Link>
              <a
                href="https://github.com/UlaYuga/promo-preflight/blob/main/docs/API.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-white/[0.08] bg-page/45 px-3 py-2 text-subtle transition hover:border-accent/30 hover:text-foreground"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {t("welcome.systemLinks.docs")}
              </a>
              <a
                href="https://github.com/UlaYuga/promo-preflight/actions/workflows/ci.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-white/[0.08] bg-page/45 px-3 py-2 text-subtle transition hover:border-accent/30 hover:text-foreground"
              >
                <ServerCog className="h-4 w-4" aria-hidden="true" />
                {t("welcome.systemLinks.github")}
              </a>
            </div>

            <div className="mt-6 max-w-2xl border-l border-accent/30 pl-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t("welcome.architectureTitle")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-subtle">
                {t("welcome.architectureBody")}
              </p>
            </div>
          </div>

          <aside className="glass-surface flex flex-col overflow-hidden rounded-lg border border-white/[0.08] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                  {t("welcome.workflowTitle")}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em] text-foreground">
                  {t("welcome.workflowSubtitle")}
                </h2>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/20 bg-accent/[0.08] text-accent shadow-[0_0_24px_rgba(197,255,61,0.08)]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="flex-1 divide-y divide-white/[0.06] overflow-y-auto">
              {workflow.map((item, index) => {
                const Icon = workflowIcons[index] ?? CheckCircle2;

                return (
                  <div
                    key={item.label}
                    className="grid grid-cols-[52px_1fr_32px] items-start gap-3 px-6 py-3.5 transition-colors duration-200 hover:bg-white/[0.03]"
                  >
                    <span className="font-mono text-sm font-medium text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold leading-snug text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[0.8rem] leading-5 text-subtle">
                        {item.description}
                      </p>
                    </div>
                    <Icon className="mt-0.5 h-5 w-5 text-accent/60" aria-hidden="true" />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-4 border-t border-white/[0.06]">
              {[
                ["08", t("welcome.metrics.checks")],
                ["23", t("welcome.metrics.rules")],
                ["10", t("welcome.metrics.endpoints")],
                ["162", t("welcome.metrics.tests")]
              ].map(([value, label], idx) => (
                <div
                  key={label}
                  className={`${idx < 3 ? "border-r border-white/[0.06]" : ""} px-5 py-4`}
                >
                  <p className="font-mono text-3xl font-medium leading-none tracking-[-0.02em] text-foreground">
                    {value}
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
