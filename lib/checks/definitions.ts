import type { CheckSeverity } from "../../schemas/index";

export const CHECK_IDS = [
  "channel_consistency",
  "terms_robustness",
  "offer_math_sanity",
  "jurisdictional_risk_signals",
  "localization_qa",
  "launch_ownership",
  "link_qa",
  "format_qa"
] as const;

export type CheckId = (typeof CHECK_IDS)[number];

export type CheckModelRoute = "core" | "fast" | "deterministic";

export type CheckDefinition = {
  id: CheckId;
  publicName: string;
  publicNameRu: string;
  route: CheckModelRoute;
  defaultSeverity: CheckSeverity;
};

export const CHECK_DEFINITIONS = [
  {
    id: "channel_consistency",
    publicName: "Channel consistency",
    publicNameRu: "Согласованность по каналам",
    route: "core",
    defaultSeverity: "HIGH"
  },
  {
    id: "terms_robustness",
    publicName: "Terms robustness",
    publicNameRu: "Полнота условий акции",
    route: "core",
    defaultSeverity: "HIGH"
  },
  {
    id: "offer_math_sanity",
    publicName: "Offer math sanity",
    publicNameRu: "Расчёт акции",
    route: "deterministic",
    defaultSeverity: "MEDIUM"
  },
  {
    id: "jurisdictional_risk_signals",
    publicName: "Jurisdictional risk signals",
    publicNameRu: "Юрисдикционные риски",
    route: "core",
    defaultSeverity: "HIGH"
  },
  {
    id: "localization_qa",
    publicName: "Localization QA",
    publicNameRu: "Локализация",
    route: "core",
    defaultSeverity: "MEDIUM"
  },
  {
    id: "launch_ownership",
    publicName: "Launch ownership",
    publicNameRu: "Назначение ролей",
    route: "core",
    defaultSeverity: "MEDIUM"
  },
  {
    id: "link_qa",
    publicName: "Link QA",
    publicNameRu: "Проверка ссылок",
    route: "fast",
    defaultSeverity: "MEDIUM"
  },
  {
    id: "format_qa",
    publicName: "Format QA",
    publicNameRu: "Форматы материалов",
    route: "fast",
    defaultSeverity: "MEDIUM"
  }
] satisfies CheckDefinition[];

export const CHECK_DEFINITION_BY_ID = Object.fromEntries(
  CHECK_DEFINITIONS.map((definition) => [definition.id, definition])
) as Record<CheckId, CheckDefinition>;
