"use client";

import { OwnersTable } from "@/components/owners-table";
import { useI18n } from "@/lib/i18n";
import type { OwnerResolution } from "@/schemas/owners";

export function OwnersPageContent({
  owners
}: Readonly<{ owners: OwnerResolution[] }>) {
  const { t } = useI18n();

  return (
    <div>
      <section className="px-10 pt-14 pb-10 hairline-b">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {t("owners.pageEyebrow")}
        </p>
        <h1 className="display mt-6 text-[64px] leading-[1] tracking-tightest text-foreground">
          {t("owners.pageTitle")}
        </h1>
        <p className="mt-7 max-w-[52ch] text-[14.5px] leading-[1.55] text-subtle">
          {t("owners.pageSubtitle")}
        </p>
        <div className="mt-6">
          <span className="hairline border rounded-sm px-3 py-1.5 font-mono text-[11px] text-subtle">
            {t("owners.configBadge")}
          </span>
        </div>
      </section>

      <section className="px-10 py-10">
        <OwnersTable owners={owners} />
      </section>
    </div>
  );
}
