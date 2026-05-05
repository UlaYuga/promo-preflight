"use client";

import { useI18n } from "@/lib/i18n";
import { CampaignList } from "@/components/campaign-list";

export function CampaignsPageContent() {
  const { language } = useI18n();
  const isRu = language === "ru";

  const eyebrow = isRu ? "01 / Воркспейс" : "01 / Workspace";
  const heroTitle = isRu ? "Запущенные\nкампании" : "Campaigns\nin flight";
  const heroLines = heroTitle.split("\n");
  const allRunsLabel = isRu ? "Все запуски" : "All runs";
  const subtitle = isRu
    ? "Все проверки кампаний, сохранённые в этом воркспейсе. Откройте любую, чтобы посмотреть отчёт, сравнить версии или передать в запуск."
    : "All campaign checks saved in this workspace. Open any to review the report, compare versions, or hand off for launch.";

  return (
    <div>
      <section className="px-10 pt-14 pb-12 hairline-b" data-tour="workspace-overview">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {eyebrow}
            </p>
            <h1 className="display mt-6 text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[1] tracking-tightest">
              {heroLines[0]}
              {heroLines[1] && (
                <>
                  <br />
                  <span className="text-subtle">{heroLines[1]}</span>
                </>
              )}
            </h1>
            <p className="mt-7 max-w-[64ch] text-[14.5px] leading-[1.55] text-subtle">
              {subtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="px-10 py-10">
        <div className="flex items-end justify-between gap-6 mb-7">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {allRunsLabel}
            </p>
          </div>
        </div>
        <CampaignList />
      </section>
    </div>
  );
}