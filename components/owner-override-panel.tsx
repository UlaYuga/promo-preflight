"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import {
  formatOwnerRoleLabel,
  resolveAllOwners,
  sanitizeOwnerOverrides
} from "@/lib/owners/resolver";
import { updateCampaignOwnerOverrides } from "@/lib/versioning";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { OWNER_ROLES, type OwnerOverrides } from "@/schemas/owners";
import type { CampaignRecord } from "@/schemas/versioning";

export function OwnerOverridePanel({
  campaign,
  onSaved,
  workspaceOwners
}: Readonly<{
  campaign: CampaignRecord;
  onSaved: () => void;
  workspaceOwners: OwnerOverrides;
}>) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<OwnerOverrides>(campaign.ownerOverrides);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const resolvedOwners = resolveAllOwners({
    ownerOverrides: campaign.ownerOverrides,
    workspaceOwners
  });

  function updateDraft(role: keyof OwnerOverrides, value: string) {
    setDraft((current) => ({
      ...current,
      [role]: value
    }));
  }

  function saveOverrides() {
    const nextOwnerOverrides = sanitizeOwnerOverrides(draft);
    const updated = updateCampaignOwnerOverrides(
      campaign.id,
      nextOwnerOverrides
    );

    if (!updated) {
      setStatusMessage(t("ownerOverrides.campaignNotFound"));
      return;
    }

    setDraft(nextOwnerOverrides);
    setStatusMessage(t("ownerOverrides.saved"));
    onSaved();
  }

  function resetOverrides() {
    const updated = updateCampaignOwnerOverrides(campaign.id, {});

    if (!updated) {
      setStatusMessage(t("ownerOverrides.campaignNotFound"));
      return;
    }

    setDraft({});
    setStatusMessage(t("ownerOverrides.cleared"));
    onSaved();
  }

  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("ownerOverrides.title")}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {t("ownerOverrides.subtitle")}
        </p>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {OWNER_ROLES.map((role) => {
          const workspaceName = workspaceOwners[role]?.trim();
          const resolvedOwner = resolvedOwners.find(
            (owner) => owner.ownerRole === role
          );

          return (
            <label key={role} className="block">
              <span className="text-xs font-medium uppercase text-muted">
                {formatOwnerRoleLabel(role)}
              </span>
              <input
                value={draft[role] ?? ""}
                onChange={(event) => updateDraft(role, event.target.value)}
                placeholder={
                  workspaceName || `${role} (not assigned)`
                }
                className={cn(
                  "mt-2 w-full rounded border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-cyan-500/70",
                  workspaceName
                    ? "border-white/[0.07]"
                    : "border-warn/30 placeholder:text-warn/70"
                )}
              />
              <span
                className={cn(
                  "mt-1 block text-xs",
                  resolvedOwner?.assigned ? "text-muted" : "text-warn"
                )}
              >
                {t("ownerOverrides.current", {
                  ownerName: resolvedOwner?.ownerName ?? t("common.unassigned")
                })}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {t("ownerOverrides.emptyUsesDefault")}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetOverrides}
            className="inline-flex items-center gap-2 rounded border border-white/[0.07] bg-background px-3 py-2 text-xs font-medium text-foreground/70 transition hover:border-white/[0.12] hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {t("ownerOverrides.clearOverrides")}
          </button>
          <button
            type="button"
            onClick={saveOverrides}
            className="inline-flex items-center gap-2 rounded border border-cyan-400/40 bg-info/10 px-3 py-2 text-xs font-medium text-info transition hover:bg-info/20"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {t("ownerOverrides.saveOverrides")}
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="border-t border-white/[0.07] px-4 py-3 text-xs text-subtle">
          {statusMessage}
        </div>
      ) : null}
    </section>
  );
}
