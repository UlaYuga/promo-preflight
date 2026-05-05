import type { CheckModule, IssueDraft } from "../types";
import {
  createKeywordExcerpt,
  extractDateLikeSignals,
  extractNumericSignals,
  includesAny
} from "../helpers";
import { buildCheckResult } from "../result";
import { combinedSource, firstAssetMatching } from "./common";
import { loc } from "../i18n";

const ENGLISH_HINTS = [
  "claim",
  "today",
  "deposit",
  "eligible",
  "terms apply",
  "valid until"
];
const PORTUGUESE_HINTS = ["hoje", "depósito", "termos", "válido", "elegível"];

export const localizationQaCheck: CheckModule = {
  id: "localization_qa",
  run(context) {
    const { bundle } = context;
    const lang = context.language;
    const combinedText = combinedSource(bundle.termsText, bundle.assets);
    const currencyMentions = extractNumericSignals(combinedText)
      .currencyAmounts.map((signal) => signal.currency)
      .filter((currency): currency is string => Boolean(currency));
    const mismatchedCurrencies = Array.from(
      new Set(
        currencyMentions.filter((currency) => currency !== bundle.metadata.currency)
      )
    );
    const dateSignals = extractDateLikeSignals(combinedText);
    const ambiguousDates = dateSignals.filter(isAmbiguousNumericDate);
    const expectsBrazilianSignals =
      bundle.metadata.locale === "pt-BR" ||
      includesAny(bundle.metadata.geo, ["Brazil", /\bBR\b/i]);
    const englishAsset = firstAssetMatching(bundle.assets, ENGLISH_HINTS);
    const hasPortugueseHint = includesAny(combinedText, PORTUGUESE_HINTS);
    const issues: IssueDraft[] = [];

    if (
      mismatchedCurrencies.length > 0 ||
      (expectsBrazilianSignals && bundle.metadata.currency !== "BRL")
    ) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Currency signals do not match the selected locale or GEO context.",
          "Сигналы валюты не соответствуют выбранным локали или гео.",
          lang
        ),
        evidence: [
          {
            field: "metadata.currency",
            snippet: bundle.metadata.currency
          },
          {
            field: "currencySignals",
            snippet:
              mismatchedCurrencies.length > 0
                ? mismatchedCurrencies.join(", ")
                : "Brazil context expects BRL"
          }
        ],
        suggestedFix: loc(
          "Align campaign currency, copy, and terms with the selected localization context.",
          "Согласуйте валюту кампании, тексты и условия с выбранным контекстом локализации.",
          lang
        ),
        ownerSuggestion: "localization",
        confidence: 0.91
      });
    }

    if (expectsBrazilianSignals && englishAsset && !hasPortugueseHint) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Selected locale or GEO suggests pt-BR, but supplied copy appears English-only.",
          "Локаль или гео предполагают pt-BR, но переданный текст выглядит только на английском.",
          lang
        ),
        evidence: [
          {
            field: `${englishAsset.channel}.${englishAsset.fieldName}`,
            snippet: createKeywordExcerpt(englishAsset.text, ENGLISH_HINTS)
          },
          { field: "metadata.locale", snippet: bundle.metadata.locale }
        ],
        suggestedFix: loc(
          "Provide localized pt-BR copy and terms, or correct the locale metadata.",
          "Предоставьте локализованный текст на pt-BR и условия, или исправьте метаданные локали.",
          lang
        ),
        ownerSuggestion: "localization",
        confidence: 0.86
      });
    }

    if (ambiguousDates.length > 0) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Numeric date format is ambiguous for cross-market launch review.",
          "Числовой формат даты неоднозначен для проверки на нескольких рынках.",
          lang
        ),
        evidence: [
          {
            field: "dateSignals",
            snippet: ambiguousDates.slice(0, 3).join(", ")
          }
        ],
        suggestedFix: loc(
          "Use an unambiguous date format such as 5 June 2026 or a locale-specific full date.",
          "Используйте однозначный формат даты, например «5 июня 2026» или полную дату в локальном формате.",
          lang
        ),
        ownerSuggestion: "localization",
        confidence: 0.8
      });
    }

    return buildCheckResult("localization_qa", issues, {
      passSummary: loc(
        "Locale, currency, and date signals are coherent.",
        "Локаль, валюта и формат дат согласованы.",
        lang
      ),
      issueSummary: loc(
        "Localization QA found currency, language, or date issues.",
        "Обнаружены проблемы с валютой, языком или форматом дат.",
        lang
      ),
      deterministicSignals: {
        geo: bundle.metadata.geo,
        locale: bundle.metadata.locale,
        currency: bundle.metadata.currency,
        currencyMentions,
        mismatchedCurrencies,
        dateSignals,
        ambiguousDates,
        expectsBrazilianSignals,
        hasPortugueseHint
      }
    });
  }
};

function isAmbiguousNumericDate(value: string) {
  if (!value.includes("/") && !value.includes("-")) {
    return false;
  }

  const [first, second] = value.split(/[/-]/).map(Number);
  return first >= 1 && first <= 12 && second >= 1 && second <= 12;
}
