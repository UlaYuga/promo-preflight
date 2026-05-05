import { z } from "zod";
import {
  ChannelSchema,
  CheckSeveritySchema,
  OwnerRoleSchema
} from "./index";
import { CHECK_DEFINITIONS, CHECK_IDS } from "../lib/checks/definitions";

export const DOMAIN_RULE_IDS = [
  "risk_free_with_wagering",
  "bonus_amount_mismatch_across_channels",
  "wagering_window_shorter_than_bonus_expiry",
  "missing_utm_on_cta",
  "currency_mismatch_across_channels",
  "free_spins_without_eligible_games",
  "br_market_missing_responsible_gaming",
  "eu_market_missing_age_verification_disclaimer",
  "max_bet_during_wagering_undefined",
  "vip_eligibility_undefined",
  "withdrawal_terms_missing",
  "cashback_percentage_mismatch",
  "min_deposit_undefined_or_inconsistent",
  "geo_restriction_missing",
  "time_limited_offer_without_end_date"
] as const;

export const RULE_IDS = [...CHECK_IDS, ...DOMAIN_RULE_IDS] as const;

export const JurisdictionSchema = z.enum([
  "BR",
  "EU",
  "CIS",
  "Curacao",
  "Other",
  "Global"
]);

export const RuleIdSchema = z.enum(RULE_IDS);
export const SourceCheckIdSchema = z.enum(CHECK_IDS);

export const RuleSchema = z
  .object({
    id: RuleIdSchema,
    source_check_id: SourceCheckIdSchema.optional(),
    public_name: z.string().min(1).max(120),
    description_en: z.string().min(1).max(1000),
    description_ru: z.string().min(1).max(1000),
    severity: CheckSeveritySchema,
    owner: OwnerRoleSchema,
    jurisdictions: z.array(JurisdictionSchema).min(1).default(["Global"]),
    channels: z.array(ChannelSchema).min(1),
    condition: z.string().min(1).max(1200),
    suggested_fix: z.string().min(1).max(1200),
    runtime_note: z.string().min(1).max(300).refine(
      (value) => value.includes("TypeScript"),
      "runtime_note must state that runtime behavior is implemented in TypeScript."
    )
  })
  .strict();

export const RulesArtifactSchema = z
  .object({
    version: z.number().int().positive(),
    artifact: z.literal("promo_preflight_rules"),
    runtime_note: z.string().min(1).max(300).refine(
      (value) => value.includes("TypeScript"),
      "runtime_note must state that runtime behavior is implemented in TypeScript."
    ),
    rules: z.array(RuleSchema).length(RULE_IDS.length)
  })
  .strict()
  .superRefine((artifact, context) => {
    const ruleIds = artifact.rules.map((rule) => rule.id);
    const uniqueRuleIds = new Set(ruleIds);

    if (uniqueRuleIds.size !== ruleIds.length) {
      context.addIssue({
        code: "custom",
        message: "rules must contain unique rule ids",
        path: ["rules"]
      });
    }

    const missingRuleIds = CHECK_IDS.filter((checkId) => !uniqueRuleIds.has(checkId));
    if (missingRuleIds.length > 0) {
      context.addIssue({
        code: "custom",
        message: `rules are missing check ids: ${missingRuleIds.join(", ")}`,
        path: ["rules"]
      });
    }

    const missingDomainRuleIds = DOMAIN_RULE_IDS.filter(
      (ruleId) => !uniqueRuleIds.has(ruleId)
    );
    if (missingDomainRuleIds.length > 0) {
      context.addIssue({
        code: "custom",
        message: `rules are missing domain rule ids: ${missingDomainRuleIds.join(", ")}`,
        path: ["rules"]
      });
    }

    const definitionById = new Map<string, {
      publicName: string;
      severity: z.infer<typeof CheckSeveritySchema>;
    }>(
      CHECK_DEFINITIONS.map((definition) => [
        definition.id,
        {
          publicName: definition.publicName,
          severity: definition.defaultSeverity
        }
      ])
    );

    for (const [index, rule] of artifact.rules.entries()) {
      const definition = definitionById.get(rule.id);

      if (!definition) {
        if (!rule.source_check_id) {
          context.addIssue({
            code: "custom",
            message: "domain rules must include source_check_id",
            path: ["rules", index, "source_check_id"]
          });
        }

        continue;
      }

      if (rule.source_check_id && rule.source_check_id !== rule.id) {
        context.addIssue({
          code: "custom",
          message: "base rule source_check_id must match id when supplied",
          path: ["rules", index, "source_check_id"]
        });
      }

      if (rule.public_name !== definition.publicName) {
        context.addIssue({
          code: "custom",
          message: `public_name must match check definition: ${definition.publicName}`,
          path: ["rules", index, "public_name"]
        });
      }

      if (rule.severity !== definition.severity) {
        context.addIssue({
          code: "custom",
          message: `severity must match check definition default: ${definition.severity}`,
          path: ["rules", index, "severity"]
        });
      }
    }
  });

export type RuleId = z.infer<typeof RuleIdSchema>;
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;
export type RuleArtifactRule = z.infer<typeof RuleSchema>;
export type RulesArtifact = z.infer<typeof RulesArtifactSchema>;
