import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOwnerRoleLabel } from "@/lib/owners/resolver";
import { useI18n } from "@/lib/i18n";
import type { OwnerResolution } from "@/schemas/owners";

export function OwnersTable({
  owners
}: Readonly<{
  owners: OwnerResolution[];
}>) {
  const { t } = useI18n();

  return (
    <section
      data-tour="owners-table"
      className="overflow-hidden rounded-sm hairline border bg-surface/60"
    >
      <div className="hairline-b px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">
          {t("owners.tableTitle")}
        </h3>
        <p className="mt-1 text-xs leading-5 text-subtle">
          {t("owners.tableSubtitle")}
        </p>
      </div>

      <div className="sm:hidden">
        <ul className="divide-y divide-white/[0.06]">
          {owners.map((owner) => (
            <li key={owner.ownerRole} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6 text-foreground">
                    {formatOwnerRoleLabel(owner.ownerRole)}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm leading-6",
                      owner.assigned ? "text-subtle" : "text-warn"
                    )}
                  >
                    {owner.ownerName}
                  </p>
                </div>
                <OwnerStatusBadge assigned={owner.assigned} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-background">
            <tr>
              <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("owners.columns.role")}</th>
              <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("owners.columns.ownerName")}</th>
              <th className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted font-medium">{t("owners.columns.assignment")}</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((owner) => (
              <tr
                key={owner.ownerRole}
                className="hairline-b align-top hover:bg-surface/40 transition-colors"
              >
                <td className="px-5 py-4 font-medium text-foreground text-[13px]">
                  {formatOwnerRoleLabel(owner.ownerRole)}
                </td>
                <td
                  className={cn(
                    "px-5 py-4 text-[13px]",
                    owner.assigned ? "text-subtle" : "text-warn"
                  )}
                >
                  {owner.ownerName}
                </td>
                <td className="px-5 py-4">
                  <OwnerStatusBadge assigned={owner.assigned} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OwnerStatusBadge({ assigned }: Readonly<{ assigned: boolean }>) {
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        assigned
          ? "border-pass/30 bg-pass/10 text-pass"
          : "border-warn/30 bg-warn/10 text-warn"
      )}
    >
      {assigned ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {assigned ? t("owners.assigned") : t("owners.notAssigned")}
    </span>
  );
}
