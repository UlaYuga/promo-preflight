import type { CheckSeverity, CheckStatus } from "../schemas/index";

export const SEVERITY_LABELS: Record<CheckSeverity, { en: string; ru: string }> = {
  CRITICAL: { en: "Critical", ru: "Критичный" },
  HIGH: { en: "High", ru: "Высокий" },
  MEDIUM: { en: "Medium", ru: "Средний" },
  LOW: { en: "Low", ru: "Низкий" }
};

export const CHECK_STATUS_LABELS: Record<CheckStatus, { en: string; ru: string }> = {
  FAIL: { en: "Fail", ru: "Ошибка" },
  WARN: { en: "Warn", ru: "Предупреждение" },
  PASS: { en: "Pass", ru: "Ок" },
  NOT_APPLICABLE: { en: "N/A", ru: "Н/П" }
};

export const OWNER_ROLE_DISPLAY: Record<string, { en: string; ru: string }> = {
  product: { en: "Product", ru: "Продукт" },
  crm: { en: "CRM", ru: "CRM" },
  legal: { en: "Legal", ru: "Юридический" },
  risk: { en: "Risk", ru: "Risk" },
  localization: { en: "Localization", ru: "Локализация" },
  analytics: { en: "Analytics", ru: "Аналитика" }
};

export function labelFor(
  map: Record<string, { en: string; ru: string }>,
  key: string,
  language?: string
): string {
  const entry = map[key];
  if (!entry) return key;
  return language === "ru" ? entry.ru : entry.en;
}
