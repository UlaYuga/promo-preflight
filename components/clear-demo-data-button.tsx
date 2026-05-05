"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT,
  PROMO_PREFLIGHT_DEMO_STORAGE_KEYS
} from "@/lib/demo-storage";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function ClearDemoDataButton({
  compact = false
}: Readonly<{
  compact?: boolean;
}>) {
  const [cleared, setCleared] = useState(false);
  const { t } = useI18n();

  function handleClear() {
    PROMO_PREFLIGHT_DEMO_STORAGE_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
    window.dispatchEvent(new Event(PROMO_PREFLIGHT_DEMO_DATA_CLEARED_EVENT));
    setCleared(true);
    window.setTimeout(() => setCleared(false), 2200);
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      data-testid="clear-demo-data"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded border border-white/[0.07] bg-surface text-sm font-medium text-foreground/80 transition hover:border-cyan-500/60 hover:text-white",
        compact ? "px-3 py-2 text-xs" : "w-full px-3 py-2"
      )}
      aria-live="polite"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {cleared ? t("common.demoDataCleared") : t("common.clearDemoData")}
    </button>
  );
}
