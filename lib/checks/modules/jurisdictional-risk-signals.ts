import type { CheckModule, IssueDraft } from "../types";
import {
  createKeywordExcerpt,
  createSourceExcerpt,
  includesAny
} from "../helpers";
import { buildCheckResult } from "../result";
import { combinedSource, firstAssetMatching } from "./common";
import { loc } from "../i18n";

const HIGH_RISK_CLAIMS = [
  "guaranteed profit",
  "guaranteed outcome",
  "risk-free",
  "cannot lose",
  "no risk",
  "sure profit"
];

const RESPONSIBLE_SIGNALS = [
  "responsible",
  "responsible gaming",
  "safer gambling",
  "play responsibly",
  "terms apply"
];

const AGE_SIGNALS = ["18+", "21+", "over 18", "adults only"];
const WAGERING_SIGNALS = ["wagering", "playthrough", /\b\d+\s*x\b/i];
const GEO_RESTRICTION_SIGNALS = [
  "available in",
  "restricted",
  "not available",
  "eligible countries",
  "territories",
  "residents of",
  "geo"
];

export const jurisdictionalRiskSignalsCheck: CheckModule = {
  id: "jurisdictional_risk_signals",
  run(context) {
    const { bundle } = context;
    const lang = context.language;
    const combinedText = combinedSource(bundle.termsText, bundle.assets);
    const geo = bundle.metadata.geo;
    const isBrazil = hasJurisdiction(geo, ["BR", "Brazil"]);
    const isEu = hasJurisdiction(geo, ["EU", "European Union", "MGA"]);
    const isCuracao = hasJurisdiction(geo, ["Curacao"]);
    const isCis = hasJurisdiction(geo, ["CIS"]);
    const regulatedGeo = includesAny(geo, [
      "UKGC",
      "MGA",
      "Brazil",
      "BR",
      "EU",
      "CIS",
      "Curacao",
      "regulated"
    ]);
    const intentionallyGeneric = includesAny(geo, ["generic", "demo"]);
    const hasResponsibleSignal = includesAny(combinedText, RESPONSIBLE_SIGNALS);
    const hasAgeSignal = includesAny(combinedText, AGE_SIGNALS);
    const highRiskAsset = firstAssetMatching(bundle.assets, HIGH_RISK_CLAIMS);
    const hasHighRiskClaim =
      Boolean(highRiskAsset) || includesAny(bundle.termsText, HIGH_RISK_CLAIMS);
    const hasWagering = includesAny(combinedText, WAGERING_SIGNALS);
    const hasGeoRestriction = includesAny(
      bundle.termsText,
      GEO_RESTRICTION_SIGNALS
    );
    const issues: IssueDraft[] = [];

    if (hasHighRiskClaim) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Copy contains a high-risk certainty claim that needs Legal review.",
          "В тексте есть формулировка типа «гарантированная прибыль» — необходима проверка Юридическим отделом.",
          lang
        ),
        evidence: [
          highRiskAsset
            ? {
                field: `${highRiskAsset.channel}.${highRiskAsset.fieldName}`,
                snippet: createKeywordExcerpt(highRiskAsset.text, HIGH_RISK_CLAIMS)
              }
            : {
                field: "termsText",
                snippet: createKeywordExcerpt(bundle.termsText, HIGH_RISK_CLAIMS)
              }
        ],
        suggestedFix: loc(
          "Replace certainty wording with neutral campaign mechanics and route the copy to Legal/Risk.",
          "Замените формулировку гарантии нейтральным описанием механики и направьте материал на проверку Юридическому/Risk.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.93
      });
    }

    if (hasHighRiskClaim && hasWagering) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Risk-free or no-risk wording appears alongside wagering mechanics.",
          "Формулировки «без риска» соседствуют с условиями отыгрыша — противоречие.",
          lang
        ),
        evidence: [
          highRiskAsset
            ? {
                field: `${highRiskAsset.channel}.${highRiskAsset.fieldName}`,
                snippet: createKeywordExcerpt(highRiskAsset.text, HIGH_RISK_CLAIMS)
              }
            : {
                field: "termsText",
                snippet: createKeywordExcerpt(bundle.termsText, HIGH_RISK_CLAIMS)
              },
          {
            field: "wageringSignals",
            snippet: createKeywordExcerpt(combinedText, WAGERING_SIGNALS)
          }
        ],
        suggestedFix: loc(
          "Remove certainty wording and state wagering conditions in neutral campaign language.",
          "Уберите формулировки гарантии и опишите условия отыгрыша нейтральным языком.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.91
      });
    }

    if (isBrazil && !hasResponsibleSignal) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "BR jurisdiction context is missing responsible-use wording.",
          "Для юрисдикции BR отсутствует обязательная формулировка об ответственной игре.",
          lang
        ),
        evidence: [
          { field: "metadata.geo", snippet: geo },
          {
            field: "termsText",
            snippet: createSourceExcerpt(bundle.termsText, { maxLength: 100 })
          }
        ],
        suggestedFix: loc(
          "Add responsible-use wording appropriate for the BR review context.",
          "Добавьте формулировку об ответственной игре, соответствующую требованиям BR.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.9
      });
    }

    if (isEu && !hasAgeSignal) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "EU jurisdiction context is missing age-verification disclaimer wording.",
          "Для юрисдикции EU отсутствует дисклеймер о возрастной проверке.",
          lang
        ),
        evidence: [
          { field: "metadata.geo", snippet: geo },
          {
            field: "termsText",
            snippet: createSourceExcerpt(bundle.termsText, { maxLength: 100 })
          }
        ],
        suggestedFix: loc(
          "Add age-verification wording to terms and visible promotional copy.",
          "Добавьте формулировку возрастной проверки в условия и видимые рекламные материалы.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.89
      });
    }

    if (
      (isBrazil || isEu || isCuracao || isCis || regulatedGeo) &&
      !intentionallyGeneric &&
      !hasGeoRestriction
    ) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Non-generic jurisdiction context is missing GEO availability or restriction wording.",
          "Для указанной юрисдикции отсутствует формулировка о доступности или ограничении по гео.",
          lang
        ),
        evidence: [
          { field: "metadata.geo", snippet: geo },
          {
            field: "termsText",
            snippet: createSourceExcerpt(bundle.termsText, { maxLength: 100 })
          }
        ],
        suggestedFix: loc(
          "Add clear GEO availability or restriction language to the terms.",
          "Добавьте чёткую формулировку о доступности или ограничении по гео в условия.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.85
      });
    }

    if (regulatedGeo && (!hasResponsibleSignal || !hasAgeSignal)) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Regulated GEO context is missing basic age or responsible-use signals.",
          "Для регулируемой юрисдикции отсутствуют базовые сигналы возраста или ответственной игры.",
          lang
        ),
        evidence: [
          { field: "metadata.geo", snippet: geo },
          {
            field: "termsText",
            snippet: createSourceExcerpt(bundle.termsText, { maxLength: 100 })
          }
        ],
        suggestedFix: loc(
          "Add age and responsible-use wording appropriate for the selected review context.",
          "Добавьте формулировки о возрасте и ответственной игре, соответствующие выбранному контексту проверки.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.88
      });
    } else if (!intentionallyGeneric && (!hasResponsibleSignal || !hasAgeSignal)) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Basic age or responsible-use signals are missing from the supplied bundle.",
          "В пакете кампании отсутствуют базовые упоминания возраста или ответственной игры.",
          lang
        ),
        evidence: [
          { field: "metadata.geo", snippet: geo },
          {
            field: "termsText",
            snippet: createSourceExcerpt(bundle.termsText, { maxLength: 100 })
          }
        ],
        suggestedFix: loc(
          "Confirm whether disclaimer wording is required for this launch context.",
          "Уточните, требуются ли дисклеймеры для данного контекста запуска.",
          lang
        ),
        ownerSuggestion: "risk",
        confidence: 0.76
      });
    }

    if (
      isBrazil &&
      (bundle.metadata.locale !== "pt-BR" || bundle.metadata.currency !== "BRL")
    ) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Brazil GEO metadata is not aligned with expected locale or currency signals.",
          "Метаданные GEO для Бразилии не соответствуют ожидаемым локали или валюте.",
          lang
        ),
        evidence: [
          {
            field: "metadata",
            snippet: `${bundle.metadata.locale}, ${bundle.metadata.currency}`
          }
        ],
        suggestedFix: loc(
          "Confirm Brazil localization metadata before Legal/Risk review.",
          "Проверьте метаданные локализации для Бразилии перед проверкой Юридическим/Risk.",
          lang
        ),
        ownerSuggestion: "localization",
        confidence: 0.82
      });
    }

    return buildCheckResult("jurisdictional_risk_signals", issues, {
      passSummary: loc(
        "Jurisdictional keyword checks did not find disclaimer or high-risk claim issues.",
        "Юрисдикционные проверки не выявили проблем с дисклеймерами или рискованными формулировками.",
        lang
      ),
      issueSummary: loc(
        "Jurisdictional risk signals found high-risk wording or missing disclaimers.",
        "Обнаружены рискованные формулировки или отсутствующие дисклеймеры.",
        lang
      ),
      deterministicSignals: {
        geo,
        isBrazil,
        isEu,
        isCuracao,
        isCis,
        regulatedGeo,
        hasResponsibleSignal,
        hasAgeSignal,
        hasHighRiskClaim,
        hasWagering,
        hasGeoRestriction
      }
    });
  }
};

function hasJurisdiction(geo: string, values: string[]) {
  const normalized = geo.toLowerCase();

  return values.some((value) => {
    const candidate = value.toLowerCase();

    if (candidate.length <= 3) {
      return new RegExp(`\\b${escapeRegExp(candidate)}\\b`, "i").test(geo);
    }

    return normalized.includes(candidate);
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
