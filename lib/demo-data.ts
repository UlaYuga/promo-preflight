export const OWNERS: Record<string, string> = {
  product: "Maya Chen",
  crm: "Noah Patel",
  legal: "Elena Rossi",
  risk: "Omar Haddad",
  localization: "Anika Weber",
  analytics: "Jonas Reed",
};

export const OWNER_ROLES = [
  { role: "product", labelEn: "Product", labelRu: "Продукт", descEn: "Owns campaign launch & business value.", descRu: "Отвечает за запуск кампании и бизнес-ценность." },
  { role: "crm", labelEn: "CRM", labelRu: "CRM", descEn: "Owns channel orchestration & sends.", descRu: "Отвечает за оркестрацию каналов и отправки." },
  { role: "legal", labelEn: "Legal", labelRu: "Юристы", descEn: "Owns T&C clauses & jurisdictional copy.", descRu: "Отвечает за пункты T&C и юрисдикционные тексты." },
  { role: "risk", labelEn: "Risk", labelRu: "Риски", descEn: "Owns offer math sanity & abuse vectors.", descRu: "Отвечает за математику оффера и векторы злоупотреблений." },
  { role: "localization", labelEn: "Localization", labelRu: "Локализация", descEn: "Owns locale, currency, date formats.", descRu: "Отвечает за локаль, валюту, форматы дат." },
  { role: "analytics", labelEn: "Analytics", labelRu: "Аналитика", descEn: "Owns UTMs, attribution, reporting.", descRu: "Отвечает за UTM, атрибуцию, отчётность." },
];

export const CHECK_DEFS = [
  { id: "channel_consistency", nameEn: "Channel consistency", nameRu: "Консистентность по каналам", route: "core" },
  { id: "terms_robustness", nameEn: "Terms robustness", nameRu: "Прочность условий", route: "core" },
  { id: "offer_math_sanity", nameEn: "Offer math sanity", nameRu: "Проверка математики оффера", route: "deterministic" },
  { id: "jurisdictional_risk_signals", nameEn: "Jurisdictional risk signals", nameRu: "Юрисдикционные риск-сигналы", route: "core" },
  { id: "localization_qa", nameEn: "Localization QA", nameRu: "QA локализации", route: "core" },
  { id: "launch_ownership", nameEn: "Launch ownership", nameRu: "Ответственные за запуск", route: "core" },
  { id: "link_qa", nameEn: "Link QA", nameRu: "QA ссылок", route: "fast" },
  { id: "format_qa", nameEn: "Format QA", nameRu: "QA форматов", route: "fast" },
];

export const WORKED_EXAMPLES = [
  { id: "EX01", labelEn: "Reload bundle mismatch", labelRu: "Несоответствие reload-бандла" },
  { id: "EX02", labelEn: "Missing max-bet clause", labelRu: "Отсутствует пункт о макс. ставке" },
  { id: "EX03", labelEn: "Math burden", labelRu: "Ошибка математики" },
  { id: "EX04", labelEn: "Jurisdiction copy risk", labelRu: "Риск юрисдикционных текстов" },
  { id: "EX05", labelEn: "Locale / currency mismatch", labelRu: "Несоответствие локаль / валюта" },
  { id: "EX06", labelEn: "Owner gap", labelRu: "Пробел в ответственных" },
  { id: "EX07", labelEn: "Broken UTM", labelRu: "Сломанный UTM" },
  { id: "EX08", labelEn: "Push over hard limit", labelRu: "Push превышает жёсткий лимит" },
  { id: "EX09", labelEn: "BR welcome (clean)", labelRu: "BR welcome (чисто)" },
  { id: "EX10", labelEn: "Wagering vague", labelRu: "Расплывчатый вейджер" },
  { id: "EX11", labelEn: "Cashback float drift", labelRu: "Расхождение cashback" },
];