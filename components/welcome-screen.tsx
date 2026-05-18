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

  const systemLinks = [
    { href: "/app/status", icon: Activity, label: t("welcome.systemLinks.status"), external: false },
    { href: "/app/api", icon: Code2, label: t("welcome.systemLinks.api"), external: false },
    { href: "/app/evidence", icon: GitPullRequestArrow, label: t("welcome.systemLinks.evidence"), external: false },
    {
      href: "https://github.com/UlaYuga/promo-preflight/blob/main/docs/API.md",
      icon: BookOpen,
      label: t("welcome.systemLinks.docs"),
      external: true
    },
    {
      href: "https://github.com/UlaYuga/promo-preflight/actions/workflows/ci.yml",
      icon: ServerCog,
      label: t("welcome.systemLinks.github"),
      external: true
    }
  ];

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

      {/* ── Layer 5: Content — refined editorial broadsheet ── */}
      <div className="relative z-10 mx-auto flex h-screen w-full max-w-[1440px] flex-col px-6 sm:px-10 lg:px-14">
        {/* Masthead */}
        <header className="hairline-b flex items-baseline justify-between py-5">
          <div className="flex items-baseline gap-4">
            <span className="display text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">
              Promo&nbsp;Preflight
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:inline">
              {t("welcome.workflowTitle")}
            </span>
          </div>
          <LanguageToggle className="origin-top-right" />
        </header>

        <section className="grid flex-1 min-h-0 items-stretch gap-12 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:gap-16">
          {/* Lede column */}
          <div
            data-tour="welcome-overview"
            className="flex max-h-full min-w-0 flex-col overflow-y-auto pr-1"
          >
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
              <span className="inline-block h-[5px] w-[5px] rounded-full bg-accent shadow-[0_0_10px_rgba(197,255,61,0.7)]" />
              {t("welcome.eyebrow")}
            </p>

            <h1 className="display mt-6 text-[3.5rem] font-medium leading-[0.9] tracking-[-0.035em] text-foreground text-glow-green sm:text-7xl lg:text-[5.25rem]">
              Promo
              <br />
              <span className="text-subtle">Preflight</span>
            </h1>

            <div className="mt-8 max-w-2xl border-l border-accent/30 pl-5">
              <p className="text-[1.45rem] font-medium leading-[1.16] tracking-[-0.015em] text-foreground sm:text-[1.7rem]">
                {t("welcome.positioning")}
              </p>
              <p className="mt-4 text-[0.95rem] leading-7 text-subtle">
                {t("welcome.body")}
              </p>
            </div>

            <p className="hairline-t hairline-b mt-8 py-3 font-mono text-[10.5px] uppercase leading-5 tracking-[0.2em] text-muted">
              {t("welcome.proofStrip")}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <TourLauncher />
              <Link
                href="/app/intake?examples=1"
                className="group inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-md border border-white/[0.1] px-7 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-foreground transition-all duration-300 hover:border-accent/40 hover:text-accent"
              >
                {t("welcome.testCases")}
                <BookOpen
                  className="h-[15px] w-[15px] text-muted transition-colors duration-300 group-hover:text-accent"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <p className="mt-4 max-w-xl text-[0.8rem] leading-6 text-muted">
              {t("welcome.ctaHint")}
            </p>

            <nav className="hairline-t mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 pt-5">
              {systemLinks.map(({ href, icon: Icon, label, external }) => {
                const cls =
                  "group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-subtle transition-colors duration-200 hover:text-accent";
                const inner = (
                  <>
                    <Icon
                      className="h-[14px] w-[14px] text-muted transition-colors duration-200 group-hover:text-accent"
                      aria-hidden="true"
                    />
                    {label}
                  </>
                );
                return external ? (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                    {inner}
                  </a>
                ) : (
                  <Link key={href} href={href} className={cls}>
                    {inner}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-7 max-w-2xl border-l border-accent/30 pl-5">
              <h3 className="display text-[0.95rem] font-semibold tracking-[-0.005em] text-foreground">
                {t("welcome.architectureTitle")}
              </h3>
              <p className="mt-2 text-[0.85rem] leading-6 text-subtle">
                {t("welcome.architectureBody")}
              </p>
            </div>
          </div>

          {/* Editorial ledger card */}
          <aside className="glass-surface flex max-h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/[0.08] shadow-2xl shadow-black/60">
            <div className="hairline-b flex items-baseline justify-between px-6 py-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
                  {t("welcome.workflowTitle")}
                </p>
                <h2 className="display mt-1.5 text-[1.05rem] font-semibold tracking-[-0.01em] text-foreground">
                  {t("welcome.workflowSubtitle")}
                </h2>
              </div>
              <span className="num text-[11px] tracking-[0.18em] text-muted">
                {String(workflow.length).padStart(2, "0")}
              </span>
            </div>

            <ol className="min-h-0 flex-1 divide-y divide-white/[0.05] overflow-y-auto">
              {workflow.map((item, index) => {
                const Icon = workflowIcons[index] ?? CheckCircle2;
                return (
                  <li
                    key={item.label}
                    className="group grid grid-cols-[34px_1fr_18px] items-baseline gap-4 px-6 py-3.5 transition-colors duration-200 hover:bg-white/[0.025]"
                  >
                    <span className="num text-[0.95rem] font-medium text-muted transition-colors duration-200 group-hover:text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.88rem] font-semibold leading-snug tracking-[-0.005em] text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[0.78rem] leading-5 text-subtle">
                        {item.description}
                      </p>
                    </div>
                    <Icon
                      className="mt-1 h-[15px] w-[15px] text-muted transition-colors duration-200 group-hover:text-accent/70"
                      aria-hidden="true"
                    />
                  </li>
                );
              })}
            </ol>

            <div className="hairline-t grid grid-cols-4">
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
                  <p className="num text-[1.7rem] font-medium leading-none tracking-[-0.02em] text-foreground">
                    {value}
                  </p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
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
