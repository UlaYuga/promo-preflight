"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clipboard, ExternalLink, KeyRound, ServerCog } from "lucide-react";
import { useI18n, type TranslationKey } from "@/lib/i18n";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/runs",
    noteEn: "Idempotent run creation",
    noteRu: "Идемпотентное создание прогона"
  },
  {
    method: "GET",
    path: "/api/v1/runs/:id",
    noteEn: "Fetch persisted run",
    noteRu: "Получить сохранённый прогон"
  },
  {
    method: "GET",
    path: "/api/v1/campaigns",
    noteEn: "List campaigns",
    noteRu: "Список кампаний"
  },
  {
    method: "GET",
    path: "/api/v1/campaigns/:id",
    noteEn: "Fetch campaign",
    noteRu: "Получить кампанию"
  },
  {
    method: "GET",
    path: "/api/v1/campaigns/:id/versions",
    noteEn: "List versions",
    noteRu: "Список версий"
  },
  {
    method: "GET",
    path: "/api/v1/campaigns/:id/diff",
    noteEn: "Compare blockers",
    noteRu: "Сравнить блокеры"
  },
  {
    method: "GET",
    path: "/api/v1/audit",
    noteEn: "Read audit events",
    noteRu: "Прочитать события аудита"
  },
  {
    method: "GET",
    path: "/api/v1/stats",
    noteEn: "Run telemetry",
    noteRu: "Телеметрия прогонов"
  },
  {
    method: "GET",
    path: "/api/health",
    noteEn: "Liveness probe",
    noteRu: "Проверка доступности"
  },
  {
    method: "GET",
    path: "/api/ready",
    noteEn: "DB + migrations readiness",
    noteRu: "Готовность БД и миграций"
  },
];

const curlExample = `curl -X POST https://promo-preflight-production.up.railway.app/api/v1/runs \\
  -H "Authorization: Bearer $PREFLIGHT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d @campaign-bundle.json`;

const responseExample = `{
  "runId": "2a099960-d864-4d93-954f-1886bd5e980c",
  "campaignId": "631f7c66-f803-4302-85f7-956634e5f40d",
  "campaignVersion": 5,
  "verdict": "BLOCK",
  "status": "completed",
  "counts": { "block": 2, "warn": 2, "info": 0 },
  "blockers": [
    {
      "ruleId": "terms_robustness.TERMS_ROBUSTNESS-002",
      "severity": "block",
      "evidence": "termsText: missing max bet clause",
      "suggestion": "Add the missing required clauses before launch.",
      "ownerHint": "legal"
    }
  ],
  "createdAt": "2026-05-17T20:48:00.000Z",
  "completedAt": "2026-05-17T20:48:00.100Z"
}`;

export function ApiContractPage() {
  const { language, t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copyCurl() {
    await navigator.clipboard.writeText(curlExample);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="px-10 py-10 space-y-6">
      <header
        data-tour="api-contract"
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            {t("apiContract.eyebrow")}
          </p>
          <h1 className="display mt-3 text-[32px] tracking-tighter2 text-foreground">
            {t("apiContract.title")}
          </h1>
          <p className="mt-2 max-w-[64ch] text-[14.5px] leading-[1.55] text-subtle">
            {t("apiContract.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://github.com/UlaYuga/promo-preflight/blob/main/docs/API.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-white/[0.07] bg-surface px-3 py-2 text-sm text-foreground transition hover:border-accent/30 hover:text-accent"
          >
            {t("apiContract.links.docs")}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <Link
            href="/app/status"
            className="inline-flex items-center gap-2 rounded-sm border border-white/[0.07] bg-surface px-3 py-2 text-sm text-foreground transition hover:border-accent/30 hover:text-accent"
          >
            {t("apiContract.links.status")}
          </Link>
          <Link
            href="/app/evidence"
            className="inline-flex items-center gap-2 rounded-sm border border-white/[0.07] bg-surface px-3 py-2 text-sm text-foreground transition hover:border-accent/30 hover:text-accent"
          >
            {t("apiContract.links.evidence")}
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded border border-white/[0.07] bg-surface/60">
          <div className="border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <ServerCog className="h-4 w-4 text-subtle" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                {t("apiContract.primary.title")}
              </h2>
            </div>
            <p className="mt-1 font-mono text-xs text-accent">
              {t("apiContract.primary.subtitle")}
            </p>
          </div>
          <p className="px-4 py-4 text-sm leading-6 text-subtle">
            {t("apiContract.primary.body")}
          </p>
        </div>

        <div className="rounded border border-white/[0.07] bg-surface/60">
          <div className="border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-subtle" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                {t("apiContract.idempotency.title")}
              </h2>
            </div>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {(
              [
                "Idempotency-Key is required for POST /api/v1/runs",
                "Same key + same request body returns the original run",
                "Same key + different body returns 409 conflict",
                "Safe for client retries, webhook redelivery, and double-clicks",
              ] as const
            ).map((fallback, index) => (
              <li key={fallback} className="px-4 py-2.5 text-sm text-subtle">
                {t(`apiContract.idempotency.items.${index}` as TranslationKey)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded border border-white/[0.07] bg-surface/60">
        <div className="border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-subtle" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">
              {t("apiContract.auth.title")}
            </h2>
          </div>
        </div>
        <div className="space-y-2 px-4 py-4 text-sm leading-6 text-subtle">
          <p>{t("apiContract.auth.protected")}</p>
          <p>{t("apiContract.auth.public")}</p>
        </div>
      </section>

      <section className="rounded border border-white/[0.07] bg-surface/60">
        <div className="border-b border-white/[0.07] px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("apiContract.endpoints.title")}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {t("apiContract.endpoints.subtitle")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-white/[0.05]">
              {endpoints.map((endpoint) => (
                <tr key={`${endpoint.method} ${endpoint.path}`}>
                  <td className="w-24 px-4 py-2.5 font-mono text-accent">
                    {endpoint.method}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-foreground">
                    {endpoint.path}
                  </td>
                  <td className="px-4 py-2.5 text-subtle">
                    {language === "ru" ? endpoint.noteRu : endpoint.noteEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <CodePanel
          title={t("apiContract.curl.title")}
          subtitle={t("apiContract.curl.subtitle")}
          code={curlExample}
          action={
            <button
              type="button"
              onClick={copyCurl}
              className="inline-flex items-center gap-2 rounded-sm border border-white/[0.07] bg-page px-3 py-1.5 text-xs text-foreground transition hover:border-accent/30 hover:text-accent"
              aria-live="polite"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? t("common.savedSuccessfully") : t("apiContract.curl.copy")}
            </button>
          }
        />
        <CodePanel
          title={t("apiContract.response.title")}
          subtitle={t("apiContract.response.subtitle")}
          code={responseExample}
        />
      </section>

    </div>
  );
}

function CodePanel({
  title,
  subtitle,
  code,
  action,
}: Readonly<{
  title: string;
  subtitle: string;
  code: string;
  action?: React.ReactNode;
}>) {
  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-xs text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      <pre className="max-h-80 overflow-auto px-4 py-4 text-xs leading-5 text-subtle">
        <code>{code}</code>
      </pre>
    </section>
  );
}
