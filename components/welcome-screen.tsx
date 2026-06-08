"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadTourSample } from "@/lib/tour/sample";
import { getTourStepRoute } from "@/lib/tour/steps";
import { startTour } from "@/lib/tour/storage";
import { LanguageToggle, useI18n, type TranslationKey } from "@/lib/i18n";

const particles = Array.from({ length: 26 }, (_, i) => {
  const seed = (i * 2654435761) >>> 0;
  const r1 = ((seed & 0xffff) / 0xffff);
  const r2 = (((seed >> 16) & 0xffff) / 0xffff);
  const r3 = (((seed * 3) >>> 0) & 0xffff) / 0xffff;
  const r4 = (((seed * 7) >>> 0) & 0xffff) / 0xffff;
  return {
    size: 4 + r1 * 6,
    left: 4 + r2 * 92,
    top: 8 + r3 * 84,
    alpha: 0.45 + r4 * 0.45,
    glowSize: 6 + r1 * 12,
    animDuration: 5 + r2 * 7,
    animDelay: r3 * 6,
  };
});

const SYSTEM_LINKS = [
  { labelKey: "welcome.systemLinks.status", href: "/app/status" },
  { labelKey: "welcome.systemLinks.api", href: "/app/api" },
  { labelKey: "welcome.systemLinks.evidence", href: "/app/evidence" }
] as const satisfies ReadonlyArray<{ labelKey: TranslationKey; href: string }>;

const HANDOFF_OWNERS = ["Legal", "Risk", "CRM"];

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function ExtIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function HandoffPreview() {
  const { get, t } = useI18n();
  const issues = get<string[]>("welcome.handoff.issues") ?? [];

  return (
    <div className="hp">
      <div className="hp-head">
        <div className="hp-avatar">
          <span>P</span>
        </div>
        <div className="hp-id">
          <div className="hp-id-row">
            <span className="hp-sender">Preflight</span>
            <span className="hp-app">APP</span>
            <span className="hp-time">14:22</span>
          </div>
          <div className="hp-channel">#promo-launches</div>
        </div>
      </div>

      <div className="hp-msg">
        <div className="hp-bar" />
        <div className="hp-body">
          <div className="hp-status">
            <span className="hp-dot" />
            <span className="hp-status-text">{t("welcome.handoff.verdict")}</span>
          </div>
          <div className="hp-campaign">Brazil Welcome 100%</div>
          <div className="hp-meta">{t("welcome.handoff.launchIn")}</div>

          <div className="hp-summary">{t("welcome.handoff.summary")}</div>

          <div className="hp-issues">
            {issues.map((text, i) => (
              <div key={i} className="hp-issue">
                <span className="hp-issue-num">{i + 1}</span>
                <div className="hp-issue-body">
                  <div className="hp-issue-text">{text}</div>
                  <div className="hp-issue-owner">
                    <span className="hp-owner-dot" />
                    {HANDOFF_OWNERS[i] ?? ""}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hp-actions">
            <Link href="/app/risk-report" className="hp-btn hp-btn-primary inline-flex items-center justify-center">
              {t("welcome.handoff.cta")}
            </Link>
            <Link href="/app/handoff" className="hp-btn hp-btn-ghost inline-flex items-center justify-center">
              {t("welcome.handoff.secondary")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const { t, language } = useI18n();

  function startProductTour() {
    loadTourSample({ clearDemoData: true, language });
    const next = startTour(0);
    router.push(getTourStepRoute(next.stepIndex, next));
  }

  return (
    <main className="relative h-screen overflow-hidden bg-background text-foreground">
      {/* ── Layer 1: Editorial blurred portrait backdrop ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="motion-decorative absolute right-[-8%] top-[-5%] h-[120%] w-[55%] blur-[90px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 55% 45%, rgba(180,170,160,0.22), transparent 70%), radial-gradient(ellipse 50% 65% at 40% 35%, rgba(160,150,140,0.15), transparent 65%), radial-gradient(circle at 50% 50%, rgba(200,195,185,0.11), transparent 50%)",
            animation: "fog-drift 18s ease-in-out infinite"
          }}
        />
        <div
          className="motion-decorative absolute left-[-5%] bottom-[-10%] h-[90%] w-[40%] blur-[80px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 60%, rgba(60,60,65,0.16), transparent 70%)",
            animation: "fog-drift 22s ease-in-out infinite 3s"
          }}
        />
      </div>

      {/* ── Layer 2: Green wave / glow atmosphere ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="motion-decorative absolute left-[10%] top-[-20%] h-[70%] w-[55%] blur-[90px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(197,255,61,0.32), transparent 70%)",
            animation: "glow-pulse 5s ease-in-out infinite"
          }}
        />
        <div
          className="motion-decorative absolute right-[-5%] top-[25%] h-[55%] w-[45%] blur-[80px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(197,255,61,0.24), transparent 70%)",
            animation: "glow-pulse 6.5s ease-in-out infinite 2s"
          }}
        />
        <div
          className="motion-decorative absolute left-[35%] top-[5%] h-[45%] w-[35%] blur-[70px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(95,109,205,0.18), transparent 70%)",
            animation: "fog-drift 14s ease-in-out infinite 1s"
          }}
        />
        <div
          className="motion-decorative absolute bottom-0 left-0 h-[30%] w-full blur-[50px]"
          style={{
            background:
              "linear-gradient(to top, rgba(197,255,61,0.20), transparent 72%)",
            animation: "glow-pulse 8s ease-in-out infinite 1.5s"
          }}
        />
      </div>

      {/* ── Layer 3: Green light particles ── */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
        {particles.map((p, i) => (
          <div
            key={i}
            className="motion-decorative absolute rounded-full"
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
        className="motion-decorative pointer-events-none absolute inset-0 z-[2] opacity-[0.05] mix-blend-overlay"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
          animation: "grain-shift 6s steps(1) infinite"
        }}
      />

      {/* ── Layer 5: Content — Variant A "Refined Classic" ── */}
      <div className="landing-a">
        <div className="frame">
          <header className="topbar">
            <span />
            <LanguageToggle className="scale-125 origin-top-right" />
          </header>

          <section className="grid">
            <div className="lcol" data-tour="welcome-overview">
              <h1 className="display" aria-label="Promo Preflight">
                <span>Promo</span>
                <span className="display-accent">Preflight</span>
              </h1>

              <p className="positioning">{t("welcome.heroA.positioning")}</p>

              <div className="cta-row">
                <button
                  type="button"
                  data-tour="take-tour"
                  className="btn btn-primary"
                  onClick={startProductTour}
                >
                  {t("welcome.heroA.ctaPrimary")}
                  <ArrowIcon />
                </button>
                <Link href="/app/intake?examples=1" className="btn btn-ghost">
                  {t("welcome.heroA.ctaSecondary")}
                  <BookIcon />
                </Link>
              </div>

              <div className="syslinks">
                {SYSTEM_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="syslink">
                    {t(l.labelKey)}
                    <ExtIcon />
                  </Link>
                ))}
              </div>
            </div>

            <aside className="rcol">
              <HandoffPreview />
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
