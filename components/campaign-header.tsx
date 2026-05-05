"use client";

import { ClearDemoDataButton } from "@/components/clear-demo-data-button";
import { LanguageToggle } from "@/lib/i18n";

export function CampaignHeader({
  mockModeEnabled
}: Readonly<{
  mockModeEnabled: boolean;
}>) {
  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur hairline-b">
      <div className="flex items-center px-10 h-14 gap-6">
        <div className="flex items-center gap-3 text-[12px] text-subtle">
          <span className="block h-1.5 w-1.5 rounded-full bg-pass [animation:pulseDot_1.6s_ease-in-out_infinite]" />
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-muted">
            Engine unavailable
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {mockModeEnabled ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-warn/20 bg-warn/10 px-2 py-1 text-[11px] font-medium text-warn">
              Mock
            </span>
          ) : null}
          <LanguageToggle />
          <div className="lg:hidden">
            <ClearDemoDataButton compact />
          </div>
        </div>
      </div>
    </header>
  );
}