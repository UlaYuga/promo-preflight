"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { CHECK_DEFS } from "@/lib/demo-data";
import type { RuleArtifactRule } from "@/schemas/rules";

export function RulesPageContent({
  rules
}: Readonly<{
  rules: RuleArtifactRule[];
}>) {
  const { language } = useI18n();
  const isRu = language === "ru";
  const [check, setCheck] = useState("all");

  const filtered =
    check === "all"
      ? rules
      : rules.filter((r) => r.source_check_id === check || r.id === check);

  const heroLines = isRu ? "Двадцать три правила,\nвосемь проверок" : "Twenty-three rules,\neight checks";
  const lines = heroLines.split("\n");
  const heroLabel = lines.join(" ");
  const subtitle = isRu
    ? "Справочный каталог только для чтения: синтетические метки правил для демо-ревью, а не подтверждённые правовые требования."
    : "Read-only reference catalog: synthetic rule labels for the demo review, not verified legal requirements.";

  return (
    <div>
      <section className="px-6 pt-10 pb-8 hairline-b sm:px-8 sm:pt-14 sm:pb-10 lg:px-10" data-tour="rules-table">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {isRu ? "06 / Правила" : "06 / Rules"}
        </p>
        <h1
          aria-label={heroLabel}
          className="display mt-6 text-[46px] leading-[1.04] tracking-normal text-pretty sm:text-[64px] sm:leading-[1] sm:tracking-tightest"
        >
          {lines[0]}
          {lines[1] && (
            <>
              <br className="hidden sm:block" />
              {" "}
              <span className="text-subtle sm:block">{lines[1]}</span>
            </>
          )}
        </h1>
        <p className="mt-7 max-w-[52ch] text-[14.5px] leading-[1.55] text-subtle">
          {subtitle}
        </p>
      </section>

      <section className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="flex items-center gap-1.5 mb-7 flex-wrap">
          <FilterChip active={check === "all"} onClick={() => setCheck("all")}>
            {isRu ? "Все" : "All"} <span className="ml-1 text-muted">{rules.length}</span>
          </FilterChip>
          {CHECK_DEFS.map((c) => (
            <FilterChip key={c.id} active={check === c.id} onClick={() => setCheck(c.id)}>
              {isRu ? c.nameRu : c.nameEn}
            </FilterChip>
          ))}
        </div>
        <div className="grid gap-3 md:hidden">
          {filtered.map((r) => {
            const checkDef = CHECK_DEFS.find(
              (c) => c.id === r.source_check_id || c.id === r.id
            );
            const checkName = checkDef
              ? isRu
                ? checkDef.nameRu
                : checkDef.nameEn
              : r.source_check_id || r.id;

            return (
              <article
                key={r.id}
                className="rounded border border-white/[0.07] bg-surface/70 px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 break-all font-mono text-xs text-muted">{r.id}</span>
                  <span className="rounded-sm border border-white/[0.07] bg-background px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-subtle">
                    {r.owner}
                  </span>
                  <span className="rounded-sm border border-fail/25 bg-fail/10 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-fail">
                    {r.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
                  {checkName}
                </p>
                <p className="mt-2 text-sm leading-6 text-subtle">
                  {isRu ? r.description_ru : r.description_en}
                </p>
              </article>
            );
          })}
        </div>

        <div className="hidden hairline-t overflow-x-auto md:block">
          {filtered.map((r) => {
            const checkDef = CHECK_DEFS.find(
              (c) => c.id === r.source_check_id || c.id === r.id
            );
            return (
              <div
                key={r.id}
                className="grid min-w-[860px] grid-cols-[180px_120px_140px_minmax(0,1fr)_90px] gap-6 py-5 hairline-b items-baseline hover:bg-surface/40 transition-colors"
              >
                <span className="font-mono text-xs text-muted">{r.id}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-subtle">
                  {r.owner}
                </span>
                <span className="text-[13px] text-subtle">
                  {checkDef
                    ? isRu
                      ? checkDef.nameRu
                      : checkDef.nameEn
                    : r.source_check_id || r.id}
                </span>
                <span className="text-[15px] leading-[1.5] tracking-normal">
                  {isRu ? r.description_ru : r.description_en}
                </span>
                <span className="text-right font-mono text-[11px] uppercase tracking-[0.1em] text-subtle">
                  {r.severity}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children
}: Readonly<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      onClick={onClick}
      className={`min-h-8 px-2.5 py-1 text-xs font-medium rounded-sm transition ${
        active ? "bg-surface text-foreground" : "text-subtle hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
