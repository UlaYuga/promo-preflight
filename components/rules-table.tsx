"use client";

import { useMemo, useState } from "react";
import type {
  Channel,
  CheckSeverity,
  OwnerRole
} from "@/schemas/index";
import type { Jurisdiction, RuleArtifactRule } from "@/schemas/rules";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const severityOrder: Record<CheckSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

export function RulesTable({
  rules
}: Readonly<{
  rules: RuleArtifactRule[];
}>) {
  const { language, t } = useI18n();
  const [severityFilter, setSeverityFilter] = useState<CheckSeverity | "all">(
    "all"
  );
  const [ownerFilter, setOwnerFilter] = useState<OwnerRole | "all">("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<
    Jurisdiction | "all"
  >("all");

  const severityOptions = useMemo(
    () =>
      Array.from(new Set(rules.map((rule) => rule.severity))).sort(
        (a, b) => severityOrder[a] - severityOrder[b]
      ),
    [rules]
  );
  const ownerOptions = useMemo(
    () =>
      Array.from(new Set(rules.map((rule) => rule.owner))).sort((a, b) =>
        formatOwner(a).localeCompare(formatOwner(b))
      ),
    [rules]
  );
  const jurisdictionOptions = useMemo(
    () =>
      Array.from(
        new Set(rules.flatMap((rule) => rule.jurisdictions))
      ).sort((a, b) => formatJurisdiction(a).localeCompare(formatJurisdiction(b))),
    [rules]
  );
  const filteredRules = useMemo(
    () =>
      rules.filter((rule) => {
        const severityMatches =
          severityFilter === "all" || rule.severity === severityFilter;
        const ownerMatches = ownerFilter === "all" || rule.owner === ownerFilter;
        const jurisdictionMatches =
          jurisdictionFilter === "all" ||
          rule.jurisdictions.includes(jurisdictionFilter);

        return severityMatches && ownerMatches && jurisdictionMatches;
      }),
    [jurisdictionFilter, ownerFilter, rules, severityFilter]
  );

  return (
    <section
      data-tour="rules-table"
      className="overflow-hidden rounded-sm hairline border bg-surface/60"
    >
      {/* Filter bar */}
      <div className="hairline-b px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-4">
          <RuleFilterChips
            label={t("rules.filters.severity")}
            value={severityFilter}
            onChange={(v) => setSeverityFilter(v as CheckSeverity | "all")}
            options={severityOptions.map((s) => ({ value: s, label: s }))}
          />
          <RuleFilterChips
            label={t("rules.filters.owner")}
            value={ownerFilter}
            onChange={(v) => setOwnerFilter(v as OwnerRole | "all")}
            options={ownerOptions.map((o) => ({ value: o, label: formatOwner(o) }))}
          />
          <RuleFilterChips
            label={t("rules.filters.jurisdiction")}
            value={jurisdictionFilter}
            onChange={(v) => setJurisdictionFilter(v as Jurisdiction | "all")}
            options={jurisdictionOptions.map((j) => ({ value: j, label: formatJurisdiction(j) }))}
          />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted shrink-0">
          {t("rules.showing", { shown: filteredRules.length, total: rules.length })}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-background">
            <tr>
              <th scope="col" className="w-[200px] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">
                {t("rules.columns.rule")}
              </th>
              <th scope="col" className="min-w-[260px] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">
                {t("rules.columns.description")}
              </th>
              <th scope="col" className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">
                {t("rules.columns.severity")}
              </th>
              <th scope="col" className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">
                {t("rules.columns.owner")}
              </th>
              <th scope="col" className="min-w-[140px] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">
                {t("rules.columns.jurisdiction")}
              </th>
              <th scope="col" className="min-w-[180px] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">
                {t("rules.columns.channels")}
              </th>
              <th scope="col" className="min-w-[280px] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">
                {t("rules.columns.condition")}
              </th>
              <th scope="col" className="min-w-[280px] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted font-medium">
                {t("rules.columns.suggestedFix")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => (
              <tr key={rule.id} className="hairline-b align-top hover:bg-surface/40 transition-colors">
                <td className="px-5 py-4">
                  <p className="text-[14px] font-medium text-foreground tracking-tight2 leading-snug">
                    {rule.public_name}
                  </p>
                </td>
                <td className="px-5 py-4 text-[13px] text-subtle leading-[1.55]">
                  <p lang={language}>
                    {language === "ru"
                      ? rule.description_ru ?? rule.description_en
                      : rule.description_en}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <SeverityBadge severity={rule.severity} />
                </td>
                <td className="px-5 py-4">
                  <OwnerBadge owner={rule.owner} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {rule.jurisdictions.map((jurisdiction) => (
                      <JurisdictionBadge key={jurisdiction} jurisdiction={jurisdiction} />
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {rule.channels.map((channel) => (
                      <span
                        key={channel}
                        className="rounded-sm hairline border bg-background px-2 py-0.5 font-mono text-[11px] text-subtle"
                      >
                        {formatChannel(channel)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4 text-[13px] text-subtle leading-[1.55]">
                  {rule.condition}
                </td>
                <td className="px-5 py-4 text-[13px] text-subtle leading-[1.55]">
                  {rule.suggested_fix}
                  {rule.runtime_note ? (
                    <p className="mt-2 text-[11px] text-muted leading-5">
                      {rule.runtime_note}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RuleFilterChips({
  label,
  onChange,
  options,
  value
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}>) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={cn(
            "px-2.5 py-1 rounded-sm text-[11.5px] font-medium transition",
            value === "all" ? "bg-surface text-foreground" : "text-subtle hover:text-foreground"
          )}
        >
          {t("rules.filters.all", { label: label.toLowerCase() })}
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-2.5 py-1 rounded-sm text-[11.5px] font-medium transition",
              value === option.value ? "bg-surface text-foreground" : "text-subtle hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: Readonly<{ severity: CheckSeverity }>) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        severity === "CRITICAL" && "border-transparent bg-fail text-white",
        severity === "HIGH" && "border-fail/30 bg-fail/10 text-fail",
        severity === "MEDIUM" && "border-warn/30 bg-warn/10 text-warn",
        severity === "LOW" && "hairline border bg-surface text-muted"
      )}
    >
      {severity}
    </span>
  );
}

function OwnerBadge({ owner }: Readonly<{ owner: OwnerRole }>) {
  return (
    <span className="inline-flex rounded-sm border border-accent/30 bg-accent/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
      {formatOwner(owner)}
    </span>
  );
}

function JurisdictionBadge({
  jurisdiction
}: Readonly<{ jurisdiction: Jurisdiction }>) {
  return (
    <span className="inline-flex rounded-sm hairline border bg-surface px-2 py-0.5 text-[11px] font-medium text-subtle">
      {formatJurisdiction(jurisdiction)}
    </span>
  );
}

function formatOwner(owner: OwnerRole) {
  return owner.charAt(0).toUpperCase() + owner.slice(1);
}

function formatChannel(channel: Channel) {
  return channel.replace("_", " ");
}

function formatJurisdiction(jurisdiction: Jurisdiction) {
  return jurisdiction;
}
