"use client";

import { useState } from "react";
import { ArrowRight, Bot, CheckCircle2, CircleAlert, LoaderCircle, Sparkles } from "lucide-react";
import {
  BriefExtractionResponseSchema,
  type BriefExtractionResponse,
  type CampaignExtractionCandidate
} from "@/schemas/brief-extraction";
import { SAMPLE_BRIEF } from "@/lib/ai/brief-extraction-sample";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type BriefImportPanelProps = {
  onConfirm: (candidate: CampaignExtractionCandidate) => void;
};

const REVIEW_FIELD_KEYS: Record<string, string> = {
  "metadata.geo": "market",
  "metadata.locale": "localeCurrency",
  "offer.maxBonus": "offerMechanics",
  "assets.email.body": "emailCopy",
  paymentMethods: "paymentMethods",
  "owners.legal.status": "legalApproval",
  "metadata.launchDate": "launchDate",
  "offer.maxCashout": "maxCashout"
};

const MOCK_VALUE_KEYS: Record<string, string> = {
  "offer.maxBonus": "offerMechanics",
  "assets.email.body": "emailCopy"
};

const MOCK_REASON_KEYS: Record<string, string> = {
  "owners.legal.status": "legalApproval",
  "metadata.launchDate": "launchDate",
  "offer.maxCashout": "maxCashout"
};

export function BriefImportPanel({ onConfirm }: Readonly<BriefImportPanelProps>) {
  const { t } = useI18n();
  const [rawBrief, setRawBrief] = useState("");
  const [extraction, setExtraction] = useState<BriefExtractionResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleExtract() {
    if (rawBrief.trim().length < 20) {
      setError(t("intake.briefImport.shortBrief"));
      return;
    }

    setLoading(true);
    setError("");
    setExtraction(null);

    try {
      const response = await fetch("/api/brief-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawBrief })
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "code" in payload &&
          payload.code === "mock_sample_only"
            ? t("intake.briefImport.mockOnly")
            : payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : t("intake.briefImport.extractionFailed");
        setError(message);
        return;
      }

      const parsed = BriefExtractionResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setError(t("intake.briefImport.invalidResponse"));
        return;
      }

      setExtraction(parsed.data);
    } catch {
      setError(t("intake.briefImport.extractionFailed"));
    } finally {
      setLoading(false);
    }
  }

  function handleLoadSample() {
    setRawBrief(SAMPLE_BRIEF);
    setExtraction(null);
    setError("");
  }

  return (
    <section
      aria-label={t("intake.briefImport.title")}
      className="mb-4 overflow-hidden rounded border border-accent/20 bg-surface/60"
    >
      <header className="hairline-b flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-accent/30 bg-accent/10 text-accent">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
              {t("intake.briefImport.eyebrow")}
            </p>
            <h3 className="mt-1 text-[15px] font-semibold text-foreground">
              {t("intake.briefImport.title")}
            </h3>
            <p className="mt-1 max-w-[64ch] text-sm leading-6 text-muted">
              {t("intake.briefImport.promise")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          className="rounded border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          {t("intake.briefImport.loadSample")}
        </button>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
        <div>
          <label className="block">
            <span className="text-xs font-medium text-subtle">
              {t("intake.briefImport.rawBrief")}
            </span>
            <textarea
              name="rawBrief"
              autoComplete="off"
              value={rawBrief}
              onChange={(event) => setRawBrief(event.target.value)}
              rows={14}
              placeholder={t("intake.briefImport.placeholder")}
              className="mt-2 block w-full resize-y rounded border border-white/[0.07] bg-background px-3 py-3 text-sm leading-6 text-foreground transition placeholder:text-muted/60 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleExtract}
              className={cn(
                "inline-flex items-center gap-2 rounded border px-4 py-2.5 text-sm font-medium transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                loading
                  ? "cursor-wait border-white/[0.07] bg-background text-muted"
                  : "border-accent/50 bg-accent/15 text-accent hover:bg-accent/25"
              )}
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {loading
                ? t("intake.briefImport.extracting")
                : t("intake.briefImport.extract")}
            </button>
            <span className="text-xs leading-5 text-muted">
              {t("intake.briefImport.rawNotStored")}
            </span>
          </div>
          {error ? (
            <p
              role="alert"
              className="mt-3 rounded border border-warn/30 bg-warn/10 px-3 py-2 text-sm leading-6 text-warn"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="rounded border border-white/[0.07] bg-background p-3">
          {extraction ? (
            <ExtractionReview
              extraction={extraction}
              onConfirm={() => onConfirm(extraction.candidate)}
            />
          ) : (
            <div className="flex min-h-[280px] flex-col justify-center px-3">
              <p className="text-sm font-medium text-foreground">
                {t("intake.briefImport.emptyTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("intake.briefImport.emptyDescription")}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ExtractionReview({
  extraction,
  onConfirm
}: Readonly<{ extraction: BriefExtractionResponse; onConfirm: () => void }>) {
  const { t } = useI18n();

  return (
    <div aria-live="polite">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">
          {t("intake.briefImport.reviewTitle")}
        </h4>
        <span className="rounded border border-info/25 bg-info/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-info">
          {extraction.mode === "mock"
            ? t("intake.briefImport.mockBadge")
            : t("intake.briefImport.liveBadge")}
        </span>
      </div>
      <p className="mb-3 text-xs leading-5 text-muted">
        {t("intake.briefImport.reviewHelp")}
      </p>

      <ReviewGroup
        title={t("intake.briefImport.extracted")}
        icon="pass"
        rows={extraction.extracted.map((field) => ({
          key: field.path,
          title: localizedReviewFieldLabel(field.path, field.label, t),
          body:
            extraction.mode === "mock"
              ? localizedMockValue(field.path, field.value, t)
              : field.value,
          detail: `"${field.evidence}" · ${t(
            `intake.briefImport.confidence.${field.confidence}` as TranslationKey
          )}`
        }))}
      />
      <ReviewGroup
        title={t("intake.briefImport.needsConfirmation")}
        icon="warn"
        rows={extraction.needsConfirmation.map((gap) => ({
          key: gap.path,
          title: localizedReviewFieldLabel(gap.path, gap.label, t),
          body:
            extraction.mode === "mock"
              ? localizedMockReason(gap.path, gap.reason, t)
              : gap.reason
        }))}
      />
      <ReviewGroup
        title={t("intake.briefImport.notProvided")}
        icon="muted"
        rows={extraction.notProvided.map((gap) => ({
          key: gap.path,
          title: localizedReviewFieldLabel(gap.path, gap.label, t),
          body:
            extraction.mode === "mock"
              ? localizedMockReason(gap.path, gap.reason, t)
              : gap.reason
        }))}
      />

      <button
        type="button"
        onClick={onConfirm}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded border border-accent/50 bg-accent/15 px-3 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        {t("intake.briefImport.confirmAndRun")}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function localizedReviewFieldLabel(
  path: string,
  fallback: string,
  t: ReturnType<typeof useI18n>["t"]
) {
  const key = REVIEW_FIELD_KEYS[path];
  return key
    ? t(`intake.briefImport.fieldLabels.${key}` as TranslationKey)
    : fallback;
}

function localizedMockValue(
  path: string,
  fallback: string,
  t: ReturnType<typeof useI18n>["t"]
) {
  const key = MOCK_VALUE_KEYS[path];
  return key
    ? t(`intake.briefImport.mockValues.${key}` as TranslationKey)
    : fallback;
}

function localizedMockReason(
  path: string,
  fallback: string,
  t: ReturnType<typeof useI18n>["t"]
) {
  const key = MOCK_REASON_KEYS[path];
  return key
    ? t(`intake.briefImport.mockReasons.${key}` as TranslationKey)
    : fallback;
}

type ReviewRow = { key: string; title: string; body: string; detail?: string };

function ReviewGroup({
  title,
  icon,
  rows
}: Readonly<{
  title: string;
  icon: "pass" | "warn" | "muted";
  rows: ReviewRow[];
}>) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="hairline-t py-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        {title}
      </p>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.key} className="flex gap-2.5 text-xs leading-5">
            {icon === "pass" ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pass" aria-hidden="true" />
            ) : icon === "warn" ? (
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" aria-hidden="true" />
            ) : (
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
            )}
            <span className="min-w-0 break-words">
              <span className="font-medium text-foreground/85">{row.title}: </span>
              <span className="text-subtle">{row.body}</span>
              {row.detail ? (
                <span className="block text-muted">{row.detail}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
