"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Zap } from "lucide-react";
import { BackgroundWave } from "@/components/background-wave";
import { CommandPalette } from "@/components/command-palette";
import { LanguageToggle, useI18n, type TranslationKey } from "@/lib/i18n";
import { RunOverlay } from "@/components/run-overlay";
import { SidebarNav } from "@/components/sidebar-nav";
import { CHECK_DEFS } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const navRouteMap: Record<string, string> = {
  c: "/app/campaigns",
  i: "/app/intake",
  r: "/app/risk-report",
  h: "/app/handoff",
  l: "/app/readiness",
  u: "/app/rules",
  o: "/app/owners",
  s: "/app/status",
  a: "/app/api",
  e: "/app/evidence"
};

const mobileNavItems = [
  { key: "campaigns", href: "/app/campaigns" },
  { key: "intake", href: "/app/intake" },
  { key: "riskReport", href: "/app/risk-report" },
  { key: "handoff", href: "/app/handoff" },
  { key: "readiness", href: "/app/readiness" }
] as const;

export function AppShell({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, t } = useI18n();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [runStep, setRunStep] = useState(0);

  const runPreflight = useCallback(async () => {
    setRunning(true);
    setRunStep(0);
    for (let i = 1; i <= CHECK_DEFS.length; i++) {
      await new Promise((r) => setTimeout(r, 200));
      setRunStep(i);
    }
    await new Promise((r) => setTimeout(r, 180));
    setRunning(false);
    router.push("/app/risk-report");
  }, [router]);

  useEffect(() => {
    let pending = "";
    let timer: ReturnType<typeof setTimeout>;

    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        return;
      }
      if (
        e.target instanceof HTMLElement &&
        /input|textarea|select/i.test(e.target.tagName)
      ) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key.toLowerCase() === "g") {
        pending = "g";
        clearTimeout(timer);
        timer = setTimeout(() => {
          pending = "";
        }, 900);
        return;
      }
      if (pending === "g") {
        const route = navRouteMap[e.key.toLowerCase()];
        if (route) {
          router.push(route);
          pending = "";
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <BackgroundWave />

      {/* Sidebar */}
      <aside className="hidden w-[228px] shrink-0 hairline-r bg-background md:flex flex-col sticky top-0 h-screen z-20">
        <div className="px-6 py-4 hairline-b">
          <Link href="/" className="flex min-h-10 items-center gap-2.5 hover:opacity-80 transition-opacity focus-ring">
            <span className="block h-2 w-2 rounded-full bg-accent neon-pulse shrink-0" />
            <p className="text-sm font-semibold tracking-normal text-foreground">Preflight</p>
          </Link>
        </div>

        <SidebarNav />

        <div className="px-4 py-4 hairline-t space-y-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex min-h-10 items-center gap-2 rounded-sm px-2.5 py-2 text-[13px] text-subtle hover:text-foreground hover:bg-surface/50 transition-colors focus-ring"
          >
            <Search aria-hidden="true" size={13} strokeWidth={1.7} />
            <span className="flex-1 text-left">{t("sidebarNav.searchCmd" as TranslationKey)}</span>
            <kbd className="font-mono text-[10px] px-[5px] py-[1px] border border-white/[0.07] rounded-[3px] bg-page text-muted leading-none inline-flex items-center">
              ⌘K
            </kbd>
          </button>
          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
            <div className="h-6 w-6 rounded-full bg-overlay flex items-center justify-center text-[11px] font-semibold text-subtle shrink-0">
              M
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium truncate text-foreground/80">Maya Chen</p>
              <p className="font-mono text-[11px] text-muted uppercase tracking-[0.1em]">Product</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* TopBar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl hairline-b">
          <div className="flex h-14 items-center px-4 sm:px-6 lg:px-8">

            <div className="ml-auto flex items-center gap-2">
              <LanguageToggle variant="subtle" />
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden h-9 items-center gap-2 rounded-sm border border-white/[0.07] bg-page/55 px-3 text-[13px] text-muted transition-colors hover:border-white/[0.12] hover:bg-surface/55 hover:text-subtle focus-ring md:inline-flex"
              >
                <Search aria-hidden="true" size={14} strokeWidth={1.7} />
                <span>{t("topbar.search" as TranslationKey)}</span>
                <kbd className="font-mono text-[10px] px-[5px] py-[1px] border border-white/[0.07] rounded-[3px] bg-background text-muted leading-none inline-flex items-center">
                  ⌘K
                </kbd>
              </button>
              <button
                onClick={runPreflight}
                disabled={running}
                className="inline-flex h-9 items-center gap-2 rounded-sm border border-accent/25 bg-accent/[0.08] px-3.5 text-[13px] font-semibold text-foreground transition-colors hover:border-accent/45 hover:bg-accent/[0.13] active:bg-accent/[0.16] disabled:opacity-50 focus-ring"
              >
                <Zap aria-hidden="true" size={13} strokeWidth={2} className="text-accent" />
                {running
                  ? language === "ru"
                    ? "Проверка…"
                    : "Running…"
                  : t("topbar.runPreflight" as TranslationKey)}
              </button>
            </div>
          </div>
          <nav
            className="grid grid-cols-5 gap-1 px-3 pb-2 md:hidden"
            aria-label="Primary workspace"
          >
            {mobileNavItems.map((item) => {
              const active =
                item.key === "campaigns"
                  ? pathname === item.href || pathname.startsWith("/app/campaigns/")
                  : pathname === item.href;
              const shortLabels: Record<(typeof mobileNavItems)[number]["key"], string> =
                language === "ru"
                  ? {
                      campaigns: "Старт",
                      intake: "Бриф",
                      riskReport: "Риск",
                      handoff: "Пакет",
                      readiness: "Готово"
                    }
                  : {
                      campaigns: "Start",
                      intake: "Brief",
                      riskReport: "Risk",
                      handoff: "Pack",
                      readiness: "Ready"
                    };
              const label = shortLabels[item.key];

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-10 min-w-0 items-center justify-center rounded-full border px-1.5 py-1.5 text-xs font-semibold leading-4 transition",
                    active
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-white/[0.07] bg-surface/70 text-subtle hover:text-foreground"
                  )}
                  aria-label={t(`nav.${item.key}` as TranslationKey)}
                >
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} />
      )}
      {running && <RunOverlay step={runStep} />}
    </div>
  );
}
