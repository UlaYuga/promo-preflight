import type { CheckModule, IssueDraft } from "../types";
import {
  createKeywordExcerpt,
  createSourceExcerpt,
  getCharacterCount,
  includesAny
} from "../helpers";
import { buildCheckResult } from "../result";
import { combinedSource } from "./common";
import { loc } from "../i18n";

const TERM_SIGNALS = {
  wagering: ["wagering", "playthrough", /\b\d+\s*x\b/i],
  maxBet: ["max bet", "maximum bet", "max stake", "maximum stake"],
  eligibility: ["eligible", "eligibility", "new users", "existing users"],
  expiry: ["expires", "expiry", "valid until", "within", "campaign period"],
  maxCashout: ["max cashout", "maximum cashout", "cashout cap"],
  householdLimit: [
    "one per household",
    "one per ip",
    "one per payment",
    "single account"
  ],
  eligibleGames: ["eligible games", "included games", "excluded games"],
  contribution: ["contribution", "contribute", "contributes"],
  cooldown: ["cooldown", "cool-down", "once per", "per week", "per month"],
  responsibleUse: ["responsible", "safer gambling", "18+", "over 18"],
  freeSpins: ["free spins", "freespins", "free spin"],
  vip: ["vip", "invite-only", "invite only"],
  withdrawal: ["withdrawal", "withdraw", "cashout", "cash out", "payout"]
} as const;

export const termsRobustnessCheck: CheckModule = {
  id: "terms_robustness",
  run(context) {
    const { bundle } = context;
    const lang = context.language;
    const terms = bundle.termsText;
    const combinedText = combinedSource(bundle.termsText, bundle.assets);
    const hasWagering =
      Boolean(bundle.offer.wageringRequirement) ||
      includesAny(terms, TERM_SIGNALS.wagering);
    const hasFreeSpins = includesAny(combinedText, TERM_SIGNALS.freeSpins);
    const hasVipMechanic = includesAny(combinedText, TERM_SIGNALS.vip);
    const hasWithdrawalSignal = includesAny(terms, TERM_SIGNALS.withdrawal);
    const missingCritical: string[] = [];
    const missingRecommended: string[] = [];

    if (hasWagering && !bundle.offer.maxBet && !includesAny(terms, TERM_SIGNALS.maxBet)) {
      missingCritical.push("max bet");
    }

    if (hasWagering && !includesAny(terms, TERM_SIGNALS.wagering)) {
      missingCritical.push("wagering clause");
    }

    if (!bundle.offer.eligibilityRules && !includesAny(terms, TERM_SIGNALS.eligibility)) {
      missingCritical.push("eligibility");
    }

    if (!includesAny(terms, TERM_SIGNALS.expiry)) {
      missingCritical.push("expiry or campaign period");
    }

    if (
      typeof bundle.offer.maxCashout === "number" &&
      !includesAny(terms, TERM_SIGNALS.maxCashout)
    ) {
      missingCritical.push("max cashout");
    }

    if (!includesAny(terms, TERM_SIGNALS.householdLimit)) {
      missingRecommended.push("one-per-household/IP/payment limit");
    }

    if (!bundle.offer.eligibleGames && !includesAny(terms, TERM_SIGNALS.eligibleGames)) {
      missingRecommended.push("eligible or excluded games");
    }

    if (!bundle.offer.contribution && !includesAny(terms, TERM_SIGNALS.contribution)) {
      missingRecommended.push("contribution rules");
    }

    if (!bundle.offer.cooldown && !includesAny(terms, TERM_SIGNALS.cooldown)) {
      missingRecommended.push("cooldown or repeat-use timing");
    }

    if (!includesAny(terms, TERM_SIGNALS.responsibleUse)) {
      missingRecommended.push("age or responsible-use wording");
    }

    const issues: IssueDraft[] = [];

    if (missingCritical.length > 0) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Terms are missing critical restriction clauses for the configured promo mechanics.",
          "В условиях акции отсутствуют обязательные ограничения для настроенной механики.",
          lang
        ),
        evidence: [
          {
            field: "termsText",
            snippet: createSourceExcerpt(terms, { maxLength: 100 })
          },
          {
            field: "termsSignals",
            snippet: `Missing: ${missingCritical.join(", ")}`
          }
        ],
        suggestedFix: loc(
          "Add neutral clauses for each missing critical term before launch review.",
          "Добавьте нейтральные формулировки для каждого недостающего обязательного условия перед проверкой.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.91
      });
    }

    if (missingRecommended.length > 0) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Terms omit recommended guardrails that usually need owner confirmation.",
          "В условиях отсутствуют рекомендуемые ограничения, требующие подтверждения ответственного.",
          lang
        ),
        evidence: [
          {
            field: "termsSignals",
            snippet: `Missing: ${missingRecommended.slice(0, 4).join(", ")}`
          }
        ],
        suggestedFix: loc(
          "Confirm whether the missing guardrails are intentionally excluded, then add concise clauses where required.",
          "Уточните, намеренно ли исключены недостающие пункты, и при необходимости добавьте краткие формулировки.",
          lang
        ),
        ownerSuggestion: "risk",
        confidence: 0.84
      });
    }

    const vagueWagering = includesAny(terms, ["wagering applies"]) &&
      !includesAny(terms, ["bonus only", "bonus amount", "deposit plus bonus"]);

    if (vagueWagering) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Wagering wording is ambiguous about the calculation base.",
          "Формулировка отыгрыша не поясняет базу расчёта.",
          lang
        ),
        evidence: [
          {
            field: "termsText",
            snippet: createKeywordExcerpt(terms, ["wagering applies"])
          }
        ],
        suggestedFix: loc(
          "State whether wagering applies to bonus only or to deposit plus bonus.",
          "Укажите, начисляется ли отыгрыш только на бонус или на депозит плюс бонус.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.78
      });
    }

    if (
      hasFreeSpins &&
      !bundle.offer.eligibleGames &&
      !includesAny(terms, TERM_SIGNALS.eligibleGames)
    ) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Free-spin mechanics are missing eligible or excluded game scope.",
          "В механике фриспинов не указан список допустимых или исключённых игр.",
          lang
        ),
        evidence: [
          {
            field: "termsText",
            snippet: createKeywordExcerpt(terms, TERM_SIGNALS.freeSpins)
          },
          {
            field: "offer.eligibleGames",
            snippet: "No eligible games supplied"
          }
        ],
        suggestedFix: loc(
          "Add eligible or excluded game scope to the terms and any affected channel copy.",
          "Добавьте перечень допустимых или исключённых игр в условия и текст каналов.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.9
      });
    }

    if (
      hasVipMechanic &&
      !bundle.offer.eligibilityRules &&
      !includesAny(terms, TERM_SIGNALS.eligibility)
    ) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "VIP mechanics are referenced without explicit eligibility rules.",
          "VIP-механика упоминается без явных правил участия.",
          lang
        ),
        evidence: [
          {
            field: "termsText",
            snippet: createKeywordExcerpt(terms, TERM_SIGNALS.vip)
          },
          {
            field: "offer.eligibilityRules",
            snippet: "No VIP eligibility supplied"
          }
        ],
        suggestedFix: loc(
          "Define the qualifying audience, exclusions, and approval owner for the VIP mechanic.",
          "Определите целевую аудиторию, исключения и ответственного за утверждение VIP-механики.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.88
      });
    }

    const needsWithdrawalTerms =
      bundle.metadata.promoType === "cashback" ||
      typeof bundle.offer.maxCashout === "number" ||
      typeof bundle.offer.bonusAmount === "number" ||
      typeof bundle.offer.maxBonus === "number";

    if (needsWithdrawalTerms && !hasWithdrawalSignal) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Value-bearing mechanics do not describe withdrawal or cashout handling.",
          "Ценностная механика не описывает порядок вывода или кешбэка.",
          lang
        ),
        evidence: [
          {
            field: "termsText",
            snippet: createSourceExcerpt(terms, { maxLength: 100 })
          }
        ],
        suggestedFix: loc(
          "Add neutral withdrawal or cashout handling before owner review.",
          "Добавьте нейтральные условия вывода или кешбэка перед проверкой ответственным.",
          lang
        ),
        ownerSuggestion: "legal",
        confidence: 0.79
      });
    }

    return buildCheckResult("terms_robustness", issues, {
      passSummary: loc(
        "Terms include the core restrictions needed for review.",
        "Условия содержат ключевые ограничения, необходимые для проверки.",
        lang
      ),
      issueSummary: loc(
        "Terms robustness found missing or ambiguous restrictions.",
        "Обнаружены отсутствующие или размытые ограничения в условиях.",
        lang
      ),
      deterministicSignals: {
        termsLength: getCharacterCount(terms),
        hasWagering,
        hasFreeSpins,
        hasVipMechanic,
        hasWithdrawalSignal,
        missingCritical,
        missingRecommended
      }
    });
  }
};
