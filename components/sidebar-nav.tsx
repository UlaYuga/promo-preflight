"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  FileJson2,
  Gauge,
  History,
  LayoutDashboard,
  LucideIcon,
  Send,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavKey =
  | "campaigns"
  | "intake"
  | "riskReport"
  | "handoff"
  | "readiness"
  | "rules"
  | "owners"
  | "systemStatus"
  | "apiContract"
  | "evidence";

type NavItem = {
  key: NavKey;
  route: string;
  hint: string;
  icon: LucideIcon;
};

const primaryItems: NavItem[] = [
  { key: "campaigns", route: "/app/campaigns", hint: "G C", icon: LayoutDashboard },
  { key: "intake", route: "/app/intake", hint: "G I", icon: ClipboardCheck },
  { key: "riskReport", route: "/app/risk-report", hint: "G R", icon: ShieldCheck },
  { key: "handoff", route: "/app/handoff", hint: "G H", icon: Send },
  { key: "readiness", route: "/app/readiness", hint: "G L", icon: Gauge }
];

const referenceItems: NavItem[] = [
  { key: "rules", route: "/app/rules", hint: "G U", icon: BookOpen },
  { key: "owners", route: "/app/owners", hint: "G O", icon: UsersRound },
  { key: "systemStatus", route: "/app/status", hint: "G S", icon: History },
  { key: "apiContract", route: "/app/api", hint: "G A", icon: FileJson2 },
  { key: "evidence", route: "/app/evidence", hint: "G E", icon: ShieldCheck }
];

function isItemActive(pathname: string, key: NavKey) {
  if (key === "campaigns") {
    return pathname === "/app/campaigns" || pathname.startsWith("/app/campaigns/");
  }

  if (key === "intake") return pathname === "/app/intake";
  if (key === "riskReport") return pathname === "/app/risk-report";
  if (key === "handoff") return pathname === "/app/handoff";
  if (key === "readiness") return pathname === "/app/readiness";
  if (key === "rules") return pathname === "/app/rules";
  if (key === "owners") return pathname === "/app/owners";
  if (key === "systemStatus") return pathname === "/app/status";
  if (key === "apiContract") return pathname === "/app/api";
  if (key === "evidence") return pathname === "/app/evidence";

  return false;
}

function labelForNavItem(
  key: NavKey,
  language: string,
  t: (key: TranslationKey) => string
) {
  if (key === "campaigns") {
    return language === "ru" ? "Решение" : "Workspace";
  }

  return t(`nav.${key}` as TranslationKey);
}

export function SidebarNav() {
  const pathname = usePathname();
  const { language, t } = useI18n();
  const launchFlowTitle = language === "ru" ? "Путь запуска" : "Launch flow";
  const referenceTitle = language === "ru" ? "Справка" : "Reference";
  const referenceActive = referenceItems.some((item) =>
    isItemActive(pathname, item.key)
  );

  function renderItems(items: NavItem[], secondary = false) {
    return items.map((item) => {
      const active = isItemActive(pathname, item.key);
      const label = labelForNavItem(item.key, language, t);
      const Icon = item.icon;

      return (
        <Link
          key={item.key}
          href={item.route}
          className={cn(
            "group relative flex min-h-10 items-center gap-3 rounded-sm px-3 py-2 text-left transition-colors",
            active
              ? "bg-surface text-foreground"
              : "text-subtle hover:bg-surface/50 hover:text-foreground",
            secondary && !active && "text-muted"
          )}
        >
          {active ? (
            <span className="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 rounded-full bg-accent" />
          ) : null}
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              active ? "text-accent" : "text-muted"
            )}
            aria-hidden="true"
          />
          <span className="flex-1 text-sm font-medium tracking-normal">
            {label}
          </span>
          {!active ? (
            <span className="opacity-0 transition-opacity group-hover:opacity-100">
              <kbd className="inline-flex items-center gap-px rounded-[3px] border border-white/[0.07] bg-page px-1.5 py-px font-mono text-[10px] leading-none text-muted">
                {item.hint}
              </kbd>
            </span>
          ) : null}
        </Link>
      );
    });
  }

  return (
    <nav className="flex-1 px-3 py-4" aria-label="Workspace">
      <div>
        <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {launchFlowTitle}
        </p>
        <div className="flex flex-col gap-px">{renderItems(primaryItems)}</div>
      </div>

      <details className="group mt-5" open={referenceActive}>
        <summary className="mb-2 flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted [&::-webkit-details-marker]:hidden">
          <span>{referenceTitle}</span>
          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="flex flex-col gap-px">{renderItems(referenceItems, true)}</div>
      </details>
    </nav>
  );
}
