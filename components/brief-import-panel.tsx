"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import {
  BRIEF_EXTRACTION_SAMPLE,
  type BriefExtractionResult,
  type ExtractionField,
} from "@/schemas/brief-extraction";

// ---------------------------------------------------------------------------
// Brief Import Panel
//
// Paste a free-text campaign brief or load the sample.
// AI extracts candidate fields for human confirmation before deterministic checks.
// ---------------------------------------------------------------------------

type Phase = "idle" | "loading" | "review" | "error";

type Props = {
  onConfirm: (result: BriefExtractionResult) => void;
  onCancel: () => void;
};

export function BriefImportPanel({ onConfirm, onCancel }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<BriefExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function handleLoadSample() {
    setText(BRIEF_EXTRACTION_SAMPLE);
    setPhase("idle");
    setErrorMessage("");
  }

  async function handleExtract() {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      setErrorMessage(t("briefImport.errorTooShort" as TranslationKey));
      setPhase("error");
      return;
    }

    setPhase("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/brief-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawBrief: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message ?? t("briefImport.errorGeneric" as TranslationKey),
        );
        setPhase("error");
        return;
      }

      setResult(data as BriefExtractionResult);
      setPhase("review");
    } catch {
      setErrorMessage(t("briefImport.errorNetwork" as TranslationKey));
      setPhase("error");
    }
  }

  function handleConfirm() {
    if (result) {
      onConfirm(result);
    }
  }

  const needsConfirm = result?.needsConfirmation ?? [];
  const notProvided = result?.notProvided ?? [];
  const extractedFields = result?.fields ?? [];

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {t("briefImport.eyebrow" as TranslationKey)}
        </p>
        <h2 className="mt-3 text-[32px] tracking-tighter2 text-foreground">
          {t("briefImport.title" as TranslationKey)}
        </h2>
        <p className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.55] text-subtle">
          {t("briefImport.subtitle" as TranslationKey)}
        </p>
      </div>

      {/* Trust statement */}
      <div className="flex items-start gap-3 rounded border border-accent/20 bg-accent-muted px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-[13px] leading-5 text-foreground/80">
          {t("briefImport.trustStatement" as TranslationKey)}
        </p>
      </div>

      {/* Textarea — shown in idle and error phases */}
      {phase !== "review" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="brief-import-textarea"
              className="text-xs font-medium text-subtle"
            >
              {t("briefImport.textareaLabel" as TranslationKey)}
            </label>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
            >
              {t("briefImport.loadSample" as TranslationKey)}
            </button>
          </div>
          <textarea
            id="brief-import-textarea"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (phase === "error") setPhase("idle");
            }}
            rows={14}
            maxLength={20000}
            placeholder={t("briefImport.placeholder" as TranslationKey)}
            className="w-full rounded border border-white/[0.07] bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/60 focus:border-accent/60 focus:ring-2 focus:ring-accent/15 resize-y leading-6 font-mono"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">
              {text.length}/20000
            </span>
            <button
              type="button"
              disabled={phase === "loading" || text.trim().length < 10}
              onClick={handleExtract}
              className={cn(
                "inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition",
                phase === "loading" || text.trim().length < 10
                  ? "cursor-not-allowed border border-white/[0.07] bg-background text-muted/60"
                  : "border border-accent/60 bg-accent/15 text-accent hover:bg-accent/25",
              )}
            >
              {phase === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t("briefImport.extracting" as TranslationKey)}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {t("briefImport.extract" as TranslationKey)}
                </>
              )}
            </button>
          </div>

          {phase === "error" && errorMessage && (
            <div className="flex items-start gap-2 rounded border border-fail/30 bg-fail/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-fail" aria-hidden="true" />
              <p className="text-sm text-fail">{errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Review panel — shown after extraction */}
      {phase === "review" && result && (
        <div className="space-y-5">
          {/* Extracted fields */}
          <Section
            icon={<CheckCircle2 className="h-4 w-4 text-pass" />}
            title={t("briefImport.sections.extracted" as TranslationKey)}
            subtitle={t("briefImport.sections.extractedHint" as TranslationKey)}
            color="pass"
          >
            <div className="space-y-2">
              {extractedFields.map((field, i) => (
                <ExtractedFieldRow key={i} field={field} />
              ))}
            </div>
          </Section>

          {/* Needs confirmation */}
          {needsConfirm.length > 0 && (
            <Section
              icon={<CircleAlert className="h-4 w-4 text-warn" />}
              title={t("briefImport.sections.needsConfirmation" as TranslationKey)}
              subtitle={t("briefImport.sections.needsConfirmationHint" as TranslationKey)}
              color="warn"
            >
              <ul className="space-y-1.5">
                {needsConfirm.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warn">
                    <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-warn/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Not provided */}
          {notProvided.length > 0 && (
            <Section
              icon={<Info className="h-4 w-4 text-muted" />}
              title={t("briefImport.sections.notProvided" as TranslationKey)}
              subtitle={t("briefImport.sections.notProvidedHint" as TranslationKey)}
              color="muted"
            >
              <ul className="space-y-1.5">
                {notProvided.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-muted/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Provider note */}
          {result.providerNote && (
            <div className="rounded border border-white/[0.07] bg-surface/40 px-4 py-3">
              <p className="text-xs leading-5 text-muted">{result.providerNote}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-white/[0.07] bg-background px-4 py-2 text-sm text-subtle hover:text-foreground transition-colors"
            >
              {t("briefImport.back" as TranslationKey)}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 rounded border border-accent/60 bg-accent/15 px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/25 transition-colors"
            >
              {t("briefImport.confirmAndRun" as TranslationKey)}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
  icon,
  title,
  subtitle,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: "pass" | "warn" | "muted";
  children: React.ReactNode;
}) {
  const borderColor =
    color === "pass"
      ? "border-pass/20"
      : color === "warn"
        ? "border-warn/20"
        : "border-white/[0.07]";

  const bgColor =
    color === "pass"
      ? "bg-pass/[0.04]"
      : color === "warn"
        ? "bg-warn/[0.04]"
        : "bg-surface/40";

  return (
    <div className={cn("rounded border p-4", borderColor, bgColor)}>
      <div className="mb-3 flex items-center gap-2.5">
        {icon}
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ExtractedFieldRow({ field }: { field: ExtractionField }) {
  const confidenceColor =
    field.confidence === "high"
      ? "text-pass"
      : field.confidence === "medium"
        ? "text-warn"
        : "text-muted";

  const confidenceBg =
    field.confidence === "high"
      ? "bg-pass/10 border-pass/20"
      : field.confidence === "medium"
        ? "bg-warn/10 border-warn/20"
        : "bg-muted/10 border-muted/20";

  return (
    <div className="rounded border border-white/[0.07] bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground/80">{field.label}</p>
          <p className="mt-0.5 font-mono text-xs text-subtle break-all">
            {field.value}
          </p>
          {field.sourceSnippet && (
            <p className="mt-1.5 text-[11px] leading-4 text-muted/70 line-clamp-2">
              <span className="text-muted/50">«</span>
              {field.sourceSnippet}
              <span className="text-muted/50">»</span>
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium uppercase",
            confidenceColor,
            confidenceBg,
          )}
        >
          {field.confidence}
        </span>
      </div>
    </div>
  );
}
