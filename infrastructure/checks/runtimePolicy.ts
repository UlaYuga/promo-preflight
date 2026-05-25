import { readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { PolicyArtifactInvalidException } from '../../domain/exception/PreflightException';
import type { PolicyRuleVersions } from '../../domain/model/Run';
import { PolicyRuleVersionsSchema } from '../policyRuleVersions';

const nonEmptyStringArray = z.array(z.string().min(1));

const PaymentRegionRulesSchema = z.strictObject({
  allowed: nonEmptyStringArray,
  grey: nonEmptyStringArray,
  forbidden: nonEmptyStringArray,
  rule_refs: nonEmptyStringArray,
  notes: z.string().min(1).optional(),
});

const PaymentRulesSchema = z.strictObject({
  version: z.number().int().positive(),
  regions: z.record(z.string().min(1), PaymentRegionRulesSchema),
});

const CryptoRegionRulesSchema = z.strictObject({
  status: z.enum(['forbidden', 'restricted', 'permitted_with_disclosure', 'permitted']),
  required_disclaimer: z.string().min(1).optional(),
  rule_refs: nonEmptyStringArray,
  notes: z.string().min(1).optional(),
});

const CryptoDisclosureRulesSchema = z.strictObject({
  version: z.number().int().positive(),
  regions: z.record(z.string().min(1), CryptoRegionRulesSchema),
});

const SeveritySchema = z.enum(['block', 'warn']);

const PhraseRuleSchema = z.strictObject({
  phrase: z.string().min(1),
  rule_ref: z.string().min(1),
  severity: SeveritySchema,
});

const MandatoryRuleSchema = z.strictObject({
  text: z.string().min(1),
  rule_ref: z.string().min(1),
  severity: SeveritySchema,
});

const RegionPhraseRulesSchema = z.strictObject({
  forbidden: z.array(PhraseRuleSchema),
  mandatory: z.array(MandatoryRuleSchema),
});

const ForbiddenPhrasesRulesSchema = z.strictObject({
  version: z.number().int().positive(),
  regions: z.record(z.string().min(1), RegionPhraseRulesSchema),
});

export type PaymentRulesYaml = z.infer<typeof PaymentRulesSchema>;
export type CryptoDisclosureYaml = z.infer<typeof CryptoDisclosureRulesSchema>;
export type ForbiddenPhrasesYaml = z.infer<typeof ForbiddenPhrasesRulesSchema>;

const POLICY_FILES = {
  payment: 'payment-methods-by-region.yaml',
  crypto: 'crypto-disclosure-rules.yaml',
  jurisdictionalRisk: 'forbidden-phrases-by-region.yaml',
} as const;

const DEFAULT_POLICY_PATHS = {
  payment: join(process.cwd(), 'rules', 'payment-methods-by-region.yaml'),
  crypto: join(process.cwd(), 'rules', 'crypto-disclosure-rules.yaml'),
  jurisdictionalRisk: join(process.cwd(), 'rules', 'forbidden-phrases-by-region.yaml'),
} as const;

let cachedPaymentRules: PaymentRulesYaml | null = null;
let cachedCryptoRules: CryptoDisclosureYaml | null = null;
let cachedForbiddenPhrasesRules: ForbiddenPhrasesYaml | null = null;

function getPolicyPath(fileName: string, defaultPath: string): string {
  const overrideDir = process.env.RUNTIME_POLICY_RULES_DIR?.trim();
  if (overrideDir) {
    return join(/* turbopackIgnore: true */ overrideDir, fileName);
  }
  return defaultPath;
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
}

function loadPolicy<T>(fileName: string, defaultPath: string, schema: z.ZodType<T>): T {
  const yamlPath = getPolicyPath(fileName, defaultPath);
  let parsedYaml: unknown;

  try {
    parsedYaml = parseYaml(readFileSync(yamlPath, 'utf-8')) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new PolicyArtifactInvalidException(`${fileName} could not be loaded: ${message}`);
  }

  const parsed = schema.safeParse(parsedYaml);
  if (!parsed.success) {
    throw new PolicyArtifactInvalidException(
      `${fileName} failed validation: ${formatIssues(parsed.error)}`
    );
  }

  return parsed.data;
}

export function getPaymentRules(): PaymentRulesYaml {
  cachedPaymentRules ??= loadPolicy(
    POLICY_FILES.payment,
    DEFAULT_POLICY_PATHS.payment,
    PaymentRulesSchema
  );
  return cachedPaymentRules;
}

export function getCryptoDisclosureRules(): CryptoDisclosureYaml {
  cachedCryptoRules ??= loadPolicy(
    POLICY_FILES.crypto,
    DEFAULT_POLICY_PATHS.crypto,
    CryptoDisclosureRulesSchema
  );
  return cachedCryptoRules;
}

export function getForbiddenPhrasesRules(): ForbiddenPhrasesYaml {
  cachedForbiddenPhrasesRules ??= loadPolicy(
    POLICY_FILES.jurisdictionalRisk,
    DEFAULT_POLICY_PATHS.jurisdictionalRisk,
    ForbiddenPhrasesRulesSchema
  );
  return cachedForbiddenPhrasesRules;
}

export function getPolicyRuleVersions(): PolicyRuleVersions {
  return {
    paymentCompatibility: getPaymentRules().version,
    cryptoDisclosure: getCryptoDisclosureRules().version,
    jurisdictionalRisk: getForbiddenPhrasesRules().version,
  };
}

export function parsePolicyRuleVersions(value: unknown): PolicyRuleVersions {
  return PolicyRuleVersionsSchema.parse(value);
}

export function resetRuntimePolicyCacheForTests(): void {
  cachedPaymentRules = null;
  cachedCryptoRules = null;
  cachedForbiddenPhrasesRules = null;
}
