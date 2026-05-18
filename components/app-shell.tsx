"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackgroundWave } from "@/components/background-wave";
import { CommandPalette } from "@/components/command-palette";
import { LanguageToggle, useI18n, type TranslationKey } from "@/lib/i18n";
import { RunOverlay } from "@/components/run-overlay";
import { SidebarNav } from "@/components/sidebar-nav";
import { CHECK_DEFS } from "@/lib/demo-data";

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

export function AppShell({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { t } = useI18n();
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
        <div className="px-6 pt-6 pb-5 hairline-b">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="block h-2 w-2 rounded-full bg-accent neon-pulse shrink-0" />
            <p className="text-[13px] font-semibold tracking-[-0.01em] text-foreground">Preflight</p>
          </Link>
        </div>

        <SidebarNav />

        <div className="px-4 py-4 hairline-t space-y-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2 rounded-sm px-2.5 py-2 text-[12px] text-subtle hover:text-foreground hover:bg-surface/50 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
              <path d="m21 21-4.3-4.3" />
            </svg>
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
              <p className="font-mono text-[10px] text-muted uppercase tracking-[0.18em]">Product</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TopBar */}
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur hairline-b">
          <div className="flex items-center px-4 sm:px-6 lg:px-10 h-14 gap-6">

            <div className="ml-auto flex items-center gap-1.5">
              <LanguageToggle />
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 hairline border px-3 py-1.5 rounded-sm text-[12px] text-subtle hover:text-foreground hover:bg-surface/50 transition-colors"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span>{t("topbar.search" as TranslationKey)}</span>
                <kbd className="font-mono text-[10px] px-[5px] py-[1px] border border-white/[0.07] rounded-[3px] bg-page text-muted leading-none inline-flex items-center">
                  ⌘K
                </kbd>
              </button>
              <button
                onClick={runPreflight}
                disabled={running}
                className="inline-flex items-center gap-2 bg-accent text-ink px-3.5 py-1.5 rounded-sm text-[12.5px] font-semibold hover:brightness-110 active:brightness-90 disabled:opacity-50 transition-all focus-ring"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z" />
                </svg>
                {running ? "Running…" : t("topbar.runPreflight" as TranslationKey)}
              </button>
            </div>
          </div>
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
