import type { Channel, PromoAsset } from "../../../schemas/index";
import type { CheckModule, IssueDraft } from "../types";
import { createSourceExcerpt, getAssetField, getCharacterCount } from "../helpers";
import { buildCheckResult } from "../result";
import { loc } from "../i18n";

type FormatLimit = {
  softLimit: number;
  hardLimit: number;
};

const DEFAULT_LIMITS: Record<Channel, Record<string, FormatLimit>> = {
  email: {
    subject: { softLimit: 50, hardLimit: 78 },
    body: { softLimit: 1200, hardLimit: 2000 }
  },
  push: {
    title: { softLimit: 40, hardLimit: 55 },
    body: { softLimit: 120, hardLimit: 180 }
  },
  onsite: {
    title: { softLimit: 60, hardLimit: 90 },
    banner: { softLimit: 80, hardLimit: 120 },
    body: { softLimit: 180, hardLimit: 260 }
  },
  landing: {
    hero: { softLimit: 80, hardLimit: 120 },
    cta: { softLimit: 24, hardLimit: 36 },
    body: { softLimit: 600, hardLimit: 1200 }
  },
  sms: {
    body: { softLimit: 140, hardLimit: 160 }
  },
  in_app: {
    title: { softLimit: 45, hardLimit: 70 },
    body: { softLimit: 160, hardLimit: 240 },
    cta: { softLimit: 24, hardLimit: 36 }
  }
};

export const formatQaCheck: CheckModule = {
  id: "format_qa",
  run(context) {
    const { assets } = context.bundle;
    const lang = context.language;
    const issues: IssueDraft[] = [];

    if (assets.length === 0) {
      return buildCheckResult("format_qa", issues, {
        notApplicable: true,
        notApplicableSummary: loc(
          "No channel assets were supplied for deterministic format QA.",
          "Материалы каналов не переданы — проверка форматов не выполнялась.",
          lang
        ),
        passSummary: loc(
          "Assets fit configured format limits.",
          "Все материалы укладываются в лимиты форматов.",
          lang
        ),
        issueSummary: loc(
          "Format QA found length or empty-field issues.",
          "Обнаружены проблемы с длиной текста или пустыми полями.",
          lang
        ),
        deterministicSignals: { assetCount: 0 },
        confidence: 0.88
      });
    }

    for (const asset of assets) {
      const field = getAssetField(asset);
      const length = getCharacterCount(asset.text);
      const limits = resolveLimits(asset);

      if (length === 0) {
        issues.push({
          severity: "LOW",
          blocker: false,
          detectedIssue: loc(
            "An included asset field is empty.",
            "Включённое поле материала пустое.",
            lang
          ),
          evidence: [{ field, snippet: "0 chars" }],
          suggestedFix: loc(
            "Add final copy for this field or remove it from the campaign asset list.",
            "Добавьте финальный текст или удалите поле из списка материалов кампании.",
            lang
          ),
          ownerSuggestion: "crm",
          confidence: 0.9
        });
        continue;
      }

      if (length > limits.hardLimit * 1.2) {
        issues.push({
          severity: "HIGH",
          blocker: true,
          detectedIssue: loc(
            "A critical asset field exceeds its hard character limit by more than 20%.",
            "Поле превышает жёсткий лимит символов более чем на 20%.",
            lang
          ),
          evidence: [
            {
              field,
              snippet: `${length} chars, hard limit ${limits.hardLimit}`
            },
            {
              field: `${field}.excerpt`,
              snippet: createSourceExcerpt(asset.text, { maxLength: 90 })
            }
          ],
          suggestedFix: loc(
            "Rewrite the field to fit the hard limit before handoff to CRM production.",
            "Перепишите поле, чтобы уложиться в жёсткий лимит, перед передачей в CRM-производство.",
            lang
          ),
          ownerSuggestion: "crm",
          confidence: 0.96
        });
        continue;
      }

      if (length > limits.hardLimit) {
        issues.push({
          severity: "MEDIUM",
          blocker: false,
          detectedIssue: loc(
            "An asset field exceeds its hard character limit.",
            "Поле превышает жёсткий лимит символов.",
            lang
          ),
          evidence: [
            {
              field,
              snippet: `${length} chars, hard limit ${limits.hardLimit}`
            }
          ],
          suggestedFix: loc(
            "Shorten the field to fit the hard channel limit.",
            "Сократите текст до жёсткого лимита канала.",
            lang
          ),
          ownerSuggestion: "crm",
          confidence: 0.95
        });
        continue;
      }

      if (length >= limits.softLimit) {
        issues.push({
          severity: "LOW",
          blocker: false,
          detectedIssue: loc(
            "An asset field is at or above its soft character limit.",
            "Поле достигло или превысило мягкий лимит символов.",
            lang
          ),
          evidence: [
            {
              field,
              snippet: `${length} chars, soft limit ${limits.softLimit}`
            }
          ],
          suggestedFix: loc(
            "Tighten copy if the target placement is space constrained.",
            "Сократите текст, если в целевом плейсменте есть ограничения по пространству.",
            lang
          ),
          ownerSuggestion: "crm",
          confidence: 0.9
        });
      }
    }

    return buildCheckResult("format_qa", issues, {
      passSummary: loc(
        "Assets are within configured channel format limits.",
        "Все материалы соответствуют лимитам форматов каналов.",
        lang
      ),
      issueSummary: loc(
        "Format QA found length or empty-field issues.",
        "Обнаружены проблемы с длиной текста или пустыми полями.",
        lang
      ),
      deterministicSignals: {
        assets: assets.map((asset) => {
          const limits = resolveLimits(asset);
          return {
            field: getAssetField(asset),
            length: getCharacterCount(asset.text),
            softLimit: limits.softLimit,
            hardLimit: limits.hardLimit
          };
        })
      }
    });
  }
};

function resolveLimits(asset: PromoAsset): FormatLimit {
  const normalizedField = asset.fieldName.toLowerCase();
  const channelDefaults = DEFAULT_LIMITS[asset.channel];
  const matchedDefault = Object.entries(channelDefaults).find(([fieldName]) =>
    normalizedField.includes(fieldName)
  )?.[1] ?? { softLimit: 120, hardLimit: 200 };

  return {
    softLimit: asset.softLimit ?? matchedDefault.softLimit,
    hardLimit: asset.hardLimit ?? matchedDefault.hardLimit
  };
}
