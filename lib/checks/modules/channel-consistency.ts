import type { CheckModule, IssueDraft } from "../types";
import {
  createKeywordExcerpt,
  createSourceExcerpt,
  extractDateLikeSignals,
  extractNumericSignals,
  getAssetField,
  getCharacterCount,
  includesAny
} from "../helpers";
import { buildCheckResult } from "../result";
import { loc } from "../i18n";

const URGENCY_SIGNALS = [
  "today only",
  "24 hours",
  "ends today",
  "limited time",
  "ends soon",
  "last chance"
];

export const channelConsistencyCheck: CheckModule = {
  id: "channel_consistency",
  run(context) {
    const { bundle } = context;
    const lang = context.language;
    const issues: IssueDraft[] = [];

    if (bundle.assets.length === 0) {
      return buildCheckResult("channel_consistency", issues, {
        notApplicable: true,
        notApplicableSummary: loc(
          "No marketing assets were supplied, so cross-channel consistency cannot be assessed.",
          "Маркетинговые материалы не переданы — согласованность по каналам не проверялась.",
          lang
        ),
        passSummary: loc(
          "Marketing assets and offer facts are aligned.",
          "Материалы и параметры акции согласованы.",
          lang
        ),
        issueSummary: loc(
          "Channel consistency found conflicting offer claims.",
          "Обнаружены противоречия между каналами.",
          lang
        ),
        deterministicSignals: {
          assetCount: 0,
          termsExcerpt: createSourceExcerpt(bundle.termsText)
        },
        confidence: 0.86
      });
    }

    const emptyAssets = bundle.assets.filter(
      (asset) => getCharacterCount(asset.text.trim()) === 0
    );
    if (emptyAssets.length > 0) {
      issues.push({
        severity: "LOW",
        blocker: false,
        detectedIssue: loc(
          "One or more included channel fields are empty, so consistency cannot be confirmed.",
          "Одно или несколько полей каналов пусты — подтвердить согласованность невозможно.",
          lang
        ),
        evidence: [
          {
            field: "assets",
            snippet: emptyAssets.map(getAssetField).join(", ")
          }
        ],
        suggestedFix: loc(
          "Add the missing channel copy or remove the channel from the included asset list.",
          "Добавьте текст для пустых полей или исключите канал из списка материалов.",
          lang
        ),
        ownerSuggestion: "crm",
        confidence: 0.87
      });
    }

    for (const asset of bundle.assets) {
      const signals = extractNumericSignals(asset.text);
      const percentageConflict =
        typeof bundle.offer.bonusPercentage === "number" &&
        signals.percentages.some(
          (percentage) => percentage !== bundle.offer.bonusPercentage
        );
      const maxBonusConflict =
        typeof bundle.offer.maxBonus === "number" &&
        signals.currencyAmounts.some(
          (amount) =>
            amount.currency === bundle.metadata.currency &&
            amount.amount !== bundle.offer.maxBonus
        );
      const currencyConflict = signals.currencyAmounts.some(
        (amount) =>
          Boolean(amount.currency) && amount.currency !== bundle.metadata.currency
      );

      if (percentageConflict || maxBonusConflict || currencyConflict) {
        issues.push({
          severity: "HIGH",
          blocker: true,
          detectedIssue: loc(
            "A channel asset contains numeric offer claims that differ from approved offer fields.",
            "В тексте канала числа акции не совпадают с утверждёнными параметрами.",
            lang
          ),
          evidence: [
            {
              field: getAssetField(asset),
              snippet: createSourceExcerpt(asset.text, { maxLength: 100 })
            },
            {
              field: "offer",
              snippet: `${bundle.offer.bonusPercentage ?? "n/a"}% up to ${
                bundle.offer.maxBonus ?? "n/a"
              } ${bundle.metadata.currency}`
            }
          ],
          suggestedFix: loc(
            "Align channel copy with the approved offer fields or update the offer fields before launch review.",
            "Согласуйте текст канала с параметрами акции или обновите параметры перед проверкой.",
            lang
          ),
          ownerSuggestion: "crm",
          confidence: 0.94
        });
      }
    }

    const termsSignals = extractNumericSignals(bundle.termsText);
    const termsPercentageConflict =
      typeof bundle.offer.bonusPercentage === "number" &&
      termsSignals.percentages.length > 0 &&
      termsSignals.percentages.some(
        (percentage) => percentage !== bundle.offer.bonusPercentage
      );
    const termsMaxBonusConflict =
      typeof bundle.offer.maxBonus === "number" &&
      termsSignals.currencyAmounts.length > 0 &&
      termsSignals.currencyAmounts.some(
        (amount) =>
          amount.currency === bundle.metadata.currency &&
          amount.amount !== bundle.offer.maxBonus &&
          amount.amount !== bundle.offer.minDeposit &&
          amount.amount !== bundle.offer.maxBet &&
          amount.amount !== bundle.offer.maxCashout
      );

    if (termsPercentageConflict || termsMaxBonusConflict) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Terms text appears to contain an offer amount or percentage that conflicts with offer basics.",
          "В условиях акции цифры расходятся с утверждёнными параметрами.",
          lang
        ),
        evidence: [
          {
            field: "termsText",
            snippet: createSourceExcerpt(bundle.termsText, { maxLength: 100 })
          },
          {
            field: "offer",
            snippet: `${bundle.offer.bonusPercentage ?? "n/a"}% up to ${
              bundle.offer.maxBonus ?? "n/a"
            } ${bundle.metadata.currency}`
          }
        ],
        suggestedFix: loc(
          "Reconcile T&C numeric claims with offer basics before approving any channel copy.",
          "Приведите числа в условиях в соответствие с параметрами акции перед согласованием материалов.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.88
      });
    }

    const todayOnlyAsset = bundle.assets.find((asset) =>
      includesAny(asset.text, ["today only", "24 hours", "ends today"])
    );
    const termsHasLongerWindow = includesAny(bundle.termsText, [
      "7 days",
      "seven days",
      "valid until",
      "campaign period"
    ]);

    if (todayOnlyAsset && termsHasLongerWindow) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "A channel asset implies an immediate expiry while terms reference a longer validity window.",
          "Текст канала говорит о немедленном истечении, тогда как в условиях указан более длительный срок.",
          lang
        ),
        evidence: [
          {
            field: getAssetField(todayOnlyAsset),
            snippet: createKeywordExcerpt(todayOnlyAsset.text, ["today only"])
          },
          {
            field: "termsText",
            snippet: createKeywordExcerpt(bundle.termsText, [
              "7 days",
              "valid until",
              "campaign period"
            ])
          }
        ],
        suggestedFix: loc(
          "Replace vague urgency with the exact validity period used in the approved terms.",
          "Замените размытое «сегодня» точным сроком из утверждённых условий.",
          lang
        ),
        ownerSuggestion: "crm",
        confidence: 0.78
      });
    }

    const wageringWindowDays = extractDaysNear(bundle.termsText, [
      "wagering",
      "playthrough"
    ]);
    const expiryWindowDays = extractDaysNear(bundle.termsText, [
      "expires",
      "expiry",
      "valid"
    ]);

    if (
      typeof wageringWindowDays === "number" &&
      typeof expiryWindowDays === "number" &&
      wageringWindowDays < expiryWindowDays
    ) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Wagering window appears shorter than the broader bonus expiry window.",
          "Срок отыгрыша короче общего срока действия бонуса.",
          lang
        ),
        evidence: [
          {
            field: "termsText",
            snippet: createKeywordExcerpt(bundle.termsText, [
              "wagering",
              "expires",
              "valid"
            ])
          },
          {
            field: "timingSignals",
            snippet: `wagering ${wageringWindowDays} days, expiry ${expiryWindowDays} days`
          }
        ],
        suggestedFix: loc(
          "Clarify both timing windows and ensure channel copy uses the approved expiry language.",
          "Уточните оба срока и убедитесь, что текст канала использует утверждённую формулировку истечения.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.78
      });
    }

    const urgencyAsset = bundle.assets.find((asset) =>
      includesAny(asset.text, URGENCY_SIGNALS)
    );
    const termsDateSignals = extractDateLikeSignals(bundle.termsText);
    const hasEndDateSignal =
      Boolean(bundle.metadata.launchDate) ||
      termsDateSignals.length > 0 ||
      includesAny(bundle.termsText, ["valid until", "expires on", "ends on"]);

    if (urgencyAsset && !hasEndDateSignal) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Time-limited channel copy does not have a clear end date in metadata or terms.",
          "В тексте канала есть срочность, но чёткая дата окончания не указана ни в метаданных, ни в условиях.",
          lang
        ),
        evidence: [
          {
            field: getAssetField(urgencyAsset),
            snippet: createKeywordExcerpt(urgencyAsset.text, URGENCY_SIGNALS)
          }
        ],
        suggestedFix: loc(
          "Add the approved end date or remove unsupported urgency wording.",
          "Добавьте утверждённую дату окончания или уберите формулировки срочности.",
          lang
        ),
        ownerSuggestion: "crm",
        confidence: 0.81
      });
    }

    return buildCheckResult("channel_consistency", dedupeIssues(issues), {
      passSummary: loc(
        "Marketing assets, terms, and offer fields are aligned.",
        "Материалы, условия и параметры акции согласованы.",
        lang
      ),
      issueSummary: loc(
        "Channel consistency found conflicting or incomplete claims.",
        "Обнаружены противоречия или неполные данные между каналами.",
        lang
      ),
      deterministicSignals: {
        assetCount: bundle.assets.length,
        assetSignals: bundle.assets.map((asset) => ({
          field: getAssetField(asset),
          numbers: extractNumericSignals(asset.text),
          textLength: getCharacterCount(asset.text)
        })),
        termsSignals,
        wageringWindowDays,
        expiryWindowDays,
        termsDateSignals,
        offer: {
          bonusPercentage: bundle.offer.bonusPercentage,
          maxBonus: bundle.offer.maxBonus,
          currency: bundle.metadata.currency
        }
      }
    });
  }
};

function extractDaysNear(source: string, anchors: string[]) {
  const normalized = source.replace(/\s+/g, " ");
  const matches = normalized.matchAll(/\b(\d+)\s+days?\b/gi);

  for (const match of matches) {
    const index = match.index ?? 0;
    const windowStart = Math.max(0, index - 80);
    const windowEnd = Math.min(normalized.length, index + 80);
    const window = normalized.slice(windowStart, windowEnd);

    if (anchors.some((anchor) => window.toLowerCase().includes(anchor))) {
      return Number(match[1]);
    }
  }

  return undefined;
}

function dedupeIssues(issues: IssueDraft[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.detectedIssue}:${issue.evidence
      .map((item) => item.field)
      .join("|")}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
