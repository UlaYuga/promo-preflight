import type { CheckModule, IssueDraft } from "../types";
import { createKeywordExcerpt, extractNumericSignals } from "../helpers";
import { buildCheckResult } from "../result";
import { loc } from "../i18n";

export const offerMathSanityCheck: CheckModule = {
  id: "offer_math_sanity",
  run(context) {
    const { offer, metadata } = context.bundle;
    const lang = context.language;
    const wageringMultiplier = offer.wageringRequirement
      ? extractNumericSignals(offer.wageringRequirement).multipliers[0]
      : undefined;
    const hasBonusMath = [
      offer.bonusAmount,
      offer.bonusPercentage,
      offer.maxBonus,
      offer.maxCashout,
      offer.maxBet,
      wageringMultiplier
    ].some((value) => typeof value === "number");
    const issues: IssueDraft[] = [];
    const estimatedTurnover =
      wageringMultiplier && offer.maxBonus
        ? wageringMultiplier * offer.maxBonus
        : undefined;
    const minDepositBonus =
      typeof offer.minDeposit === "number" &&
      typeof offer.bonusPercentage === "number"
        ? offer.minDeposit * (offer.bonusPercentage / 100)
        : undefined;

    if (!hasBonusMath) {
      return buildCheckResult("offer_math_sanity", issues, {
        notApplicable: true,
        notApplicableSummary: loc(
          "No bonus math fields were supplied for deterministic calculation.",
          "Числовые параметры бонуса не переданы — расчёт невозможен.",
          lang
        ),
        passSummary: loc(
          "Offer math fields are internally plausible.",
          "Числовые параметры акции согласованы.",
          lang
        ),
        issueSummary: loc(
          "Offer math contains deterministic risk signals.",
          "Обнаружены противоречия в числах акции.",
          lang
        ),
        deterministicSignals: { hasBonusMath },
        confidence: 0.86
      });
    }

    if (
      typeof offer.maxCashout === "number" &&
      typeof offer.maxBonus === "number" &&
      offer.maxCashout < offer.maxBonus
    ) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Max cashout is lower than the maximum bonus amount.",
          "Максимальный вывод меньше максимального бонуса.",
          lang
        ),
        evidence: [
          { field: "offer.maxBonus", snippet: `${offer.maxBonus} ${metadata.currency}` },
          {
            field: "offer.maxCashout",
            snippet: `${offer.maxCashout} ${metadata.currency}`
          }
        ],
        suggestedFix: loc(
          "Raise max cashout above max bonus or explain the limitation clearly in approved terms.",
          "Поднимите лимит вывода выше максимального бонуса или явно опишите ограничение в условиях.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.96
      });
    }

    if (
      typeof minDepositBonus === "number" &&
      typeof offer.maxBonus === "number" &&
      minDepositBonus > offer.maxBonus
    ) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Minimum deposit and bonus percentage exceed the advertised maximum bonus cap.",
          "Минимальный депозит и процент бонуса превышают заявленный максимальный бонус.",
          lang
        ),
        evidence: [
          {
            field: "offer",
            snippet: `${offer.bonusPercentage}% of ${offer.minDeposit} ${metadata.currency} = ${minDepositBonus} ${metadata.currency}`
          },
          { field: "offer.maxBonus", snippet: `${offer.maxBonus} ${metadata.currency}` }
        ],
        suggestedFix: loc(
          "Adjust min deposit, percentage, or max bonus copy so the first eligible amount is not confusing.",
          "Скорректируйте минимальный депозит, процент или максимальный бонус так, чтобы первая допустимая сумма была понятна.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.88
      });
    }

    if (offer.wageringRequirement && !wageringMultiplier) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Wagering requirement is present but no deterministic multiplier could be parsed.",
          "Условие отыгрыша есть, но числовой множитель не распознан.",
          lang
        ),
        evidence: [
          {
            field: "offer.wageringRequirement",
            snippet: offer.wageringRequirement
          }
        ],
        suggestedFix: loc(
          "Rewrite wagering as a clear multiplier, for example 20x bonus.",
          "Запишите отыгрыш в виде чёткого множителя, например 20x бонуса.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.81
      });
    }

    if (hasBonusMath && offer.wageringRequirement && !offer.maxBet) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Wagering is configured but max bet is missing from offer basics.",
          "Отыгрыш настроен, но максимальная ставка не указана в параметрах акции.",
          lang
        ),
        evidence: [
          {
            field: "offer.wageringRequirement",
            snippet: offer.wageringRequirement
          }
        ],
        suggestedFix: loc(
          "Add a max bet value for the active wagering period before review.",
          "Добавьте максимальную ставку для периода отыгрыша перед проверкой.",
          lang
        ),
        ownerSuggestion: "risk",
        confidence: 0.87
      });
    }

    const requiresMinDeposit =
      (metadata.promoType === "welcome" || metadata.promoType === "reload") &&
      (typeof offer.bonusAmount === "number" ||
        typeof offer.bonusPercentage === "number" ||
        typeof offer.maxBonus === "number" ||
        Boolean(offer.wageringRequirement));
    const termsMinDeposit = extractMinDeposit(context.bundle.termsText);

    if (requiresMinDeposit && typeof offer.minDeposit !== "number") {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Deposit-triggered mechanics are missing a minimum deposit value.",
          "Механика на основе депозита не содержит минимальной суммы пополнения.",
          lang
        ),
        evidence: [
          { field: "metadata.promoType", snippet: metadata.promoType },
          {
            field: "offer.minDeposit",
            snippet: "No minimum deposit supplied"
          }
        ],
        suggestedFix: loc(
          "Add the approved minimum deposit amount and align terms and channel copy to that value.",
          "Добавьте утверждённую минимальную сумму депозита и согласуйте с ней условия и тексты каналов.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.84
      });
    }

    if (
      typeof offer.minDeposit === "number" &&
      typeof termsMinDeposit === "number" &&
      termsMinDeposit !== offer.minDeposit
    ) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Minimum deposit in terms differs from the structured offer value.",
          "Минимальный депозит в условиях не совпадает с параметрами акции.",
          lang
        ),
        evidence: [
          {
            field: "offer.minDeposit",
            snippet: `${offer.minDeposit} ${metadata.currency}`
          },
          {
            field: "termsText",
            snippet: createKeywordExcerpt(context.bundle.termsText, [
              "min deposit",
              "minimum deposit"
            ])
          }
        ],
        suggestedFix: loc(
          "Use one approved minimum deposit amount across offer basics and terms.",
          "Используйте единую утверждённую сумму минимального депозита во всех документах.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.86
      });
    }

    if (
      typeof wageringMultiplier === "number" &&
      typeof estimatedTurnover === "number" &&
      wageringMultiplier >= 45
    ) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Wagering multiplier creates a high expected turnover burden.",
          "Множитель отыгрыша создаёт высокую нагрузку на оборот.",
          lang
        ),
        evidence: [
          {
            field: "offer.wageringRequirement",
            snippet: `${wageringMultiplier}x, estimated turnover ${estimatedTurnover} ${metadata.currency}`
          }
        ],
        suggestedFix: loc(
          "Confirm the burden is intentional and state the wagering base clearly in terms.",
          "Убедитесь, что нагрузка намеренна, и явно укажите базу отыгрыша в условиях.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.82
      });
    }

    if (
      typeof offer.maxBet === "number" &&
      typeof offer.maxBonus === "number" &&
      offer.maxBet > offer.maxBonus * 0.25
    ) {
      issues.push({
        severity: "LOW",
        blocker: false,
        detectedIssue: loc(
          "Max bet is large relative to the maximum bonus amount and needs risk review.",
          "Максимальная ставка велика относительно максимального бонуса — требуется проверка Risk.",
          lang
        ),
        evidence: [
          {
            field: "offer",
            snippet: `max bet ${offer.maxBet}, max bonus ${offer.maxBonus} ${metadata.currency}`
          }
        ],
        suggestedFix: loc(
          "Confirm the max bet ratio with Risk or lower it to the approved campaign threshold.",
          "Согласуйте соотношение с Risk или снизьте до утверждённого порога кампании.",
          lang
        ),
        ownerSuggestion: "risk",
        confidence: 0.74
      });
    }

    return buildCheckResult("offer_math_sanity", issues, {
      passSummary: loc(
        "Deterministic offer math fields are internally plausible.",
        "Числовые параметры акции согласованы.",
        lang
      ),
      issueSummary: loc(
        "Offer math contains deterministic contradictions or warnings.",
        "Обнаружены противоречия или предупреждения в числах акции.",
        lang
      ),
      deterministicSignals: {
        minDeposit: offer.minDeposit,
        bonusAmount: offer.bonusAmount,
        bonusPercentage: offer.bonusPercentage,
        maxBonus: offer.maxBonus,
        wageringMultiplier,
        estimatedTurnover,
        minDepositBonus,
        maxCashout: offer.maxCashout,
        maxBet: offer.maxBet,
        requiresMinDeposit,
        termsMinDeposit
      }
    });
  }
};

function extractMinDeposit(termsText: string) {
  const match = termsText.match(
    /\b(?:min(?:imum)?\s+deposit|deposit\s+of)\D{0,20}(\d+(?:[.,]\d+)?)/i
  );

  if (!match) {
    return undefined;
  }

  return Number(match[1].replace(",", "."));
}
