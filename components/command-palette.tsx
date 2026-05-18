"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { CHECK_DEFS, WORKED_EXAMPLES } from "@/lib/demo-data";

type PaletteItem = {
  kind: string;
  label: string;
  hint: string;
  action: () => void;
};

const navItems = [
  { key: "campaigns", route: "/app/campaigns", num: "01", hint: "G C" },
  { key: "intake", route: "/app/intake", num: "02", hint: "G I" },
  { key: "riskReport", route: "/app/risk-report", num: "03", hint: "G R" },
  { key: "handoff", route: "/app/handoff", num: "04", hint: "G H" },
  { key: "readiness", route: "/app/readiness", num: "05", hint: "G L" },
  { key: "rules", route: "/app/rules", num: "06", hint: "G U" },
  { key: "owners", route: "/app/owners", num: "07", hint: "G O" },
  { key: "systemStatus", route: "/app/status", num: "08", hint: "G S" },
  { key: "apiContract", route: "/app/api", num: "09", hint: "G A" },
  { key: "evidence", route: "/app/evidence", num: "10", hint: "G E" },
];

export function CommandPalette({ onClose }: Readonly<{ onClose: () => void }>) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setActiveIndex(0);
  }

  const items = useMemo<PaletteItem[]>(() => {
    const base: PaletteItem[] = [
      ...navItems.map((n) => ({
        kind: t("palette.go" as TranslationKey),
        label: t(`nav.${n.key}` as TranslationKey),
        hint: `${n.num} · ${n.hint}`,
        action: () => { router.push(n.route); onClose(); }
      })),
      {
        kind: t("palette.action" as TranslationKey),
        label: t("palette.actions.run" as TranslationKey),
        hint: "⌘↵",
        action: () => { router.push("/app/intake"); onClose(); }
      },
      {
        kind: t("palette.action" as TranslationKey),
        label: t("palette.actions.save" as TranslationKey),
        hint: "⌘S",
        action: onClose
      },
      {
        kind: t("palette.action" as TranslationKey),
        label: t("palette.actions.exportMd" as TranslationKey),
        hint: "E M",
        action: onClose
      },
      {
        kind: t("palette.action" as TranslationKey),
        label: t("palette.actions.exportSlack" as TranslationKey),
        hint: "E S",
        action: onClose
      },
      ...WORKED_EXAMPLES.map((ex) => ({
        kind: t("palette.example" as TranslationKey),
        label: `${ex.id} — ${ex.labelEn}`,
        hint: "",
        action: onClose
      })),
      ...CHECK_DEFS.map((c) => ({
        kind: t("palette.check" as TranslationKey),
        label: c.nameEn,
        hint: c.id,
        action: () => { router.push("/app/risk-report"); onClose(); }
      })),
    ];

    if (!query) return base;
    const ql = query.toLowerCase();
    return base.filter(
      (x) => (x.label + x.kind + (x.hint || "")).toLowerCase().includes(ql)
    );
  }, [query, t, router, onClose]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[activeIndex]?.action();
    }
  }

  const grouped: { kind: string; items: PaletteItem[] }[] = [];
  const seen = new Set<string>();
  items.forEach((it) => {
    if (!seen.has(it.kind)) {
      seen.add(it.kind);
      grouped.push({ kind: it.kind, items: [] });
    }
    grouped.find((g) => g.kind === it.kind)!.items.push(it);
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="palette-in w-[640px] max-w-[92vw] bg-page hairline border rounded-sm shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 hairline-b">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
            <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t("palette.placeholder" as TranslationKey)}
            name="command-palette-search"
            placeholder={t("palette.placeholder" as TranslationKey) || "Search · run · jump"}
            className="flex-1 rounded-sm bg-transparent text-[15px] tracking-tight2 outline-none placeholder:text-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent/40"
          />
          <kbd className="font-mono text-[10px] px-[5px] py-[1px] border border-white/[0.07] rounded-[3px] bg-page text-subtle leading-none inline-flex items-center gap-px">
            esc
          </kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto py-2">
          {grouped.map((g) => (
            <div key={g.kind} className="px-2 py-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted px-3 pt-2 pb-1">
                {g.kind}
              </p>
              {g.items.map((it, idx) => {
                const globalIdx = items.indexOf(it);
                return (
                  <button
                    key={idx}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                    onClick={it.action}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-[13.5px] text-left ${
                      globalIdx === activeIndex
                        ? "bg-surface text-foreground"
                        : "text-subtle hover:text-foreground"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={globalIdx === activeIndex ? "text-accent" : "text-muted"}>
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                    <span className="flex-1 truncate tracking-tight2">{it.label}</span>
                    {it.hint && (
                      <span className="font-mono text-[10px] text-muted">{it.hint}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-12 text-muted text-[12.5px]">
              {t("palette.noMatches" as TranslationKey) || "No matches"}
            </div>
          )}
        </div>
        <div className="hairline-t px-5 py-2.5 flex items-center gap-3 text-[10.5px] text-muted">
          <span>{t("palette.move" as TranslationKey) || "Move"} <kbd className="font-mono text-[10px] px-[5px] py-[1px] border border-white/[0.07] rounded-[3px] bg-page text-subtle leading-none inline-flex items-center gap-px">↑</kbd><kbd className="font-mono text-[10px] px-[5px] py-[1px] border border-white/[0.07] rounded-[3px] bg-page text-subtle leading-none inline-flex items-center gap-px">↓</kbd></span>
          <span>{t("palette.open" as TranslationKey) || "Open"} <kbd className="font-mono text-[10px] px-[5px] py-[1px] border border-white/[0.07] rounded-[3px] bg-page text-subtle leading-none inline-flex items-center gap-px">↵</kbd></span>
          <span className="ml-auto font-mono">{t("palette.stats" as TranslationKey) || "23 rules · 8 checks · 6 owners"}</span>
        </div>
      </div>
    </div>
  );
}
