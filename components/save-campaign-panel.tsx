"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BookmarkPlus, ChevronDown, Save } from "lucide-react";
import {
  createCampaign,
  listCampaigns,
  saveVersion
} from "@/lib/versioning";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { RiskReport } from "@/schemas/index";

type Mode = "closed" | "open";
type Tab = "new" | "existing";

export function SaveCampaignPanel({
  report
}: Readonly<{
  report: RiskReport;
}>) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("closed");
  const [tab, setTab] = useState<Tab>("new");
  const [newName, setNewName] = useState("");
  const [newJurisdiction, setNewJurisdiction] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [savedPath, setSavedPath] = useState<string | null>(null);
  // Synchronous re-entrancy guard. handleSave has no awaits, so a fast
  // double-click fires two click handlers before React re-renders and hides
  // the button — without this each click would createCampaign() again and
  // leave a duplicate campaign in the list. A ref (not state) is required:
  // the second handler must see the flag set by the first within the same tick.
  const inFlightRef = useRef(false);

  const campaigns = mode === "open" ? listCampaigns() : [];

  function open() {
    setMode("open");
    setStatus("idle");
    setStatusMessage("");
    setSavedPath(null);
    inFlightRef.current = false;
    const existing = listCampaigns();
    if (existing.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(existing[0].id);
    }
  }

  function close() {
    setMode("closed");
  }

  function handleSave() {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    try {
      let campaignId: string;

      if (tab === "new") {
        const name = newName.trim() || report.campaignName;
        const campaign = createCampaign(name, newJurisdiction);
        campaignId = campaign.id;
      } else {
        if (!selectedCampaignId) {
          setStatus("error");
          setStatusMessage(t("saveCampaign.selectCampaignError"));
          inFlightRef.current = false;
          return;
        }
        campaignId = selectedCampaignId;
      }

      const version = saveVersion(campaignId, report);
      const nextPath = `/app/campaigns/${campaignId}/versions/${version.n}`;
      setStatus("saved");
      setSavedPath(nextPath);
      setStatusMessage(
        t("saveCampaign.savedMessage", {
          version: version.n,
          path: nextPath
        })
      );
    } catch (err) {
      setStatus("error");
      setSavedPath(null);
      setStatusMessage(err instanceof Error ? err.message : t("common.saveFailed"));
      inFlightRef.current = false;
    }
  }

  if (mode === "closed") {
    return (
      <button
        type="button"
        data-tour="save-run"
        onClick={open}
        className="inline-flex items-center gap-2 rounded border border-white/[0.07] bg-surface px-3 py-2 text-xs font-medium text-foreground/70 transition hover:border-accent/40 hover:text-accent"
      >
        <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
        {t("saveCampaign.button")}
      </button>
    );
  }

  return (
    <div className="rounded border border-white/[0.07] bg-surface p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground/80">
          {t("saveCampaign.title")}
        </p>
        <button
          type="button"
          onClick={close}
          className="text-xs text-muted hover:text-foreground/70"
        >
          {t("common.cancel")}
        </button>
      </div>

      <div className="mb-3 flex gap-1">
        {(["new", "existing"] as Tab[]).map((tabOption) => (
          <button
            key={tabOption}
            type="button"
            onClick={() => setTab(tabOption)}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition",
              tab === tabOption
                ? "bg-accent/15 text-accent"
                : "text-subtle hover:text-foreground/80"
            )}
          >
            {tabOption === "new"
              ? t("saveCampaign.newCampaign")
              : t("saveCampaign.existingCampaign")}
          </button>
        ))}
      </div>

      <p className="mb-3 text-xs leading-5 text-subtle">
        {t("saveCampaign.description")}
      </p>

      {tab === "new" ? (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted">{t("saveCampaign.campaignName")}</span>
            <input
              type="text"
              value={newName}
              placeholder={report.campaignName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 w-full rounded border border-white/[0.07] bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted/60 focus:border-accent/40"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">{t("saveCampaign.jurisdiction")}</span>
            <input
              type="text"
              value={newJurisdiction}
              placeholder="e.g. BR, EU, CIS"
              onChange={(e) => setNewJurisdiction(e.target.value)}
              className="mt-1 w-full rounded border border-white/[0.07] bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted/60 focus:border-accent/40"
            />
          </label>
        </div>
      ) : (
        <div>
          <label className="block">
            <span className="text-xs text-muted">{t("saveCampaign.selectCampaign")}</span>
            {campaigns.length === 0 ? (
              <p className="mt-1 text-xs text-muted">
                {t("saveCampaign.noCampaigns")}
              </p>
            ) : (
              <div className="relative mt-1">
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full appearance-none rounded border border-white/[0.07] bg-background px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-accent/40"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            )}
          </label>
        </div>
      )}

      {status === "saved" ? (
        <div
          aria-live="polite"
          className="mt-3 rounded border border-pass/20 bg-pass/10 px-3 py-2 text-xs text-pass"
        >
          <p className="font-medium">{t("saveCampaign.saved")}</p>
          <p className="mt-1 text-pass/80">{statusMessage}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {savedPath ? (
              <Link
                href={savedPath}
                className="underline underline-offset-2 hover:text-pass"
              >
                {t("saveCampaign.viewVersionDetail")}
              </Link>
            ) : null}
            <Link
              href="/app/campaigns"
              className="underline underline-offset-2 hover:text-pass"
            >
              {t("saveCampaign.openCampaigns")}
            </Link>
            <Link
              href="/app/handoff"
              className="underline underline-offset-2 hover:text-pass"
            >
              {t("saveCampaign.openHandoff")}
            </Link>
          </div>
        </div>
      ) : status === "error" ? (
        <p className="mt-3 text-xs text-fail">{statusMessage}</p>
      ) : null}

      {status !== "saved" ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={tab === "existing" && campaigns.length === 0}
          className={cn(
            "mt-3 inline-flex w-full items-center justify-center gap-2 rounded border px-3 py-2 text-xs font-medium transition",
            tab === "existing" && campaigns.length === 0
              ? "cursor-not-allowed border-white/[0.07] text-muted/60"
              : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
          )}
        >
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          {t("common.save")}
        </button>
      ) : null}
    </div>
  );
}
