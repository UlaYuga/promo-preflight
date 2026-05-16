import { readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { InvalidCampaignException } from '../../domain/exception/PreflightException';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { RunBlocker } from '../../domain/model/Run';
import type { ICheck } from './ICheck';

interface RegionRules {
  allowed: string[];
  grey: string[];
  forbidden: string[];
  rule_refs: string[];
  notes?: string;
}

interface PaymentRulesYaml {
  version: number;
  regions: Record<string, RegionRules>;
}

function loadRules(): PaymentRulesYaml {
  const yamlPath = join(process.cwd(), 'rules', 'payment-methods-by-region.yaml');
  const content = readFileSync(yamlPath, 'utf-8');
  return parseYaml(content) as PaymentRulesYaml;
}

let cachedRules: PaymentRulesYaml | null = null;

function getRules(): PaymentRulesYaml {
  if (!cachedRules) {
    cachedRules = loadRules();
  }
  return cachedRules;
}

export const PaymentCompatibilityCheck: ICheck = {
  id: 'payment_compat',

  async run(campaign: CampaignBundle): Promise<RunBlocker[]> {
    const jurisdictions = campaign.targetJurisdiction;
    const methods = campaign.paymentMethods ?? [];

    if (!jurisdictions || jurisdictions.length === 0) {
      return [];
    }

    const rules = getRules();
    const blockers: RunBlocker[] = [];

    for (const jur of jurisdictions) {
      const regionRules = rules.regions[jur];
      if (!regionRules) {
        throw new InvalidCampaignException(
          `Unknown target jurisdiction "${jur}". No payment rules configured.`
        );
      }

      for (const method of methods) {
        const methodNorm = method.toLowerCase().replace(/[-\s]/g, '_');

        const isForbidden =
          regionRules.forbidden.includes(methodNorm) ||
          (regionRules.forbidden.includes('any_crypto') && isCrypto(methodNorm));

        const isGrey =
          !isForbidden &&
          (regionRules.grey.includes(methodNorm) ||
            (regionRules.grey.includes('any_crypto') && isCrypto(methodNorm)));

        if (isForbidden) {
          const ruleRef = regionRules.rule_refs[0] ?? 'Jurisdictional payment regulation';
          blockers.push({
            ruleId: 'payment-compat-001',
            severity: 'block',
            evidence: `Payment method "${method}" is forbidden in ${jur}`,
            suggestion: buildForbiddenSuggestion(method, jur, regionRules),
            ownerHint: 'payments-lead',
          });
          void ruleRef;
        } else if (isGrey) {
          blockers.push({
            ruleId: 'payment-compat-002',
            severity: 'warn',
            evidence: `Payment method "${method}" is in a grey/restricted zone for ${jur}`,
            suggestion: `Verify legal status of "${method}" for ${jur} with your compliance team. Ref: ${regionRules.rule_refs[0] ?? 'local regulation'}`,
            ownerHint: 'payments-lead',
          });
        }
      }

      // Special: RU campaigns mentioning only fiat without any crypto
      if (jur === 'RU' && methods.length > 0 && !methods.some(isCrypto)) {
        blockers.push({
          ruleId: 'payment-compat-003',
          severity: 'warn',
          evidence: `RU-targeted campaign lists no crypto payment methods`,
          suggestion: `100% of Russian operators use crypto (USDT/TRC20, BTC, ETH) as primary channel per 01.tech G GATE Report 2026. Consider adding crypto options or documenting why fiat-only is intended.`,
          ownerHint: 'payments-lead',
        });
      }
    }

    return blockers;
  },
};

function isCrypto(method: string): boolean {
  return /usdt|btc|bitcoin|eth|ethereum|ltc|litecoin|trx|tron|tether|crypto|stablecoin|erc20|trc20/.test(method);
}

function buildForbiddenSuggestion(method: string, jur: string, rules: RegionRules): string {
  const alternatives = rules.allowed.slice(0, 3).join(', ') || 'no approved alternatives listed';
  return `Remove "${method}" from ${jur}-targeted copy. Allowed methods: ${alternatives}. Ref: ${rules.rule_refs[0] ?? 'local regulation'}`;
}
