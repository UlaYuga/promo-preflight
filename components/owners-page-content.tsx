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
      <section className="px-6 pt-10 pb-8 hairline-b sm:px-8 sm:pt-14 sm:pb-10 lg:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {t("owners.pageEyebrow")}
        </p>
        <h1 className="display mt-6 text-[44px] leading-[1.08] tracking-normal text-foreground sm:text-[64px] sm:leading-[1] sm:tracking-tightest">
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

      <section className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
        <OwnersTable owners={owners} />
      </section>
    </div>
  );
}
