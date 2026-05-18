"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navKeys = [
  "campaigns",
  "intake",
  "riskReport",
  "handoff",
  "readiness",
  "rules",
  "owners",
  "systemStatus",
  "apiContract"
] as const;

const navNums: Record<string, string> = {
  campaigns: "01",
  intake: "02",
  riskReport: "03",
  handoff: "04",
  readiness: "05",
  rules: "06",
  owners: "07",
  systemStatus: "08",
  apiContract: "09"
};

const navHints: Record<string, string> = {
  campaigns: "G C",
  intake: "G I",
  riskReport: "G R",
  handoff: "G H",
  readiness: "G L",
  rules: "G U",
  owners: "G O",
  systemStatus: "G S",
  apiContract: "G A"
};

const navRoutes: Record<string, string> = {
  campaigns: "/app/campaigns",
  intake: "/app/intake",
  riskReport: "/app/risk-report",
  handoff: "/app/handoff",
  readiness: "/app/readiness",
  rules: "/app/rules",
  owners: "/app/owners",
  systemStatus: "/app/status",
  apiContract: "/app/api",
  versiondiff: "/app/campaigns/CMP-1042/versions/2"
};

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  function isActive(key: string) {
    if (key === "campaigns") return pathname === "/app/campaigns" || pathname.startsWith("/app/campaigns/");
    if (key === "intake") return pathname === "/app/intake";
    if (key === "riskReport") return pathname === "/app/risk-report";
    if (key === "handoff") return pathname === "/app/handoff";
    if (key === "readiness") return pathname === "/app/readiness";
    if (key === "rules") return pathname === "/app/rules";
    if (key === "owners") return pathname === "/app/owners";
    if (key === "systemStatus") return pathname === "/app/status";
    if (key === "apiContract") return pathname === "/app/api";
    if (key === "versiondiff") return pathname.startsWith("/app/campaigns/") && pathname.includes("/versions/");
    return false;
  }

  return (
    <nav className="flex-1 px-3 py-3 flex flex-col gap-px" aria-label="Workspace">
      {navKeys.map((key) => {
        const active = isActive(key);
        const label = t(`nav.${key}` as TranslationKey);
        const hint = navHints[key] || "";
        const num = navNums[key] || "0";

        return (
          <button
            key={key}
            onClick={() => router.push(navRoutes[key])}
            className={cn(
              "group relative flex items-center gap-3 rounded-sm px-3 py-2 text-left transition-colors",
              active
                ? "bg-surface text-foreground"
                : "text-subtle hover:text-foreground hover:bg-surface/50"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-px bg-accent rounded-full" />
            )}
            <span
              className={cn(
                "font-mono text-[10px]",
                active ? "text-accent" : "text-muted"
              )}
            >
              {num}
            </span>
            <span className="text-[13.5px] font-medium tracking-[-0.005em] flex-1">
              {label}
            </span>
            {!active && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <kbd className="font-mono text-[10px] px-1.5 py-px border border-white/[0.07] rounded-[3px] bg-page text-muted leading-none inline-flex items-center gap-px">
                  {hint}
                </kbd>
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
