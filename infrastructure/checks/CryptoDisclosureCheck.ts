import type { CampaignBundle } from '../../domain/model/Campaign';
import type { RunBlocker } from '../../domain/model/Run';
import type { ICheck } from './ICheck';
import { getCryptoDisclosureRules } from './runtimePolicy';

const CRYPTO_REGEX = /usdt|btc|bitcoin|кр[иы]пт|crypto|tether|tron|trc20|erc20|stablecoin|ethereum|eth\b|litecoin|ltc\b/i;

function collectAllText(campaign: CampaignBundle): string {
  const parts: string[] = [campaign.termsText];
  for (const asset of campaign.assets) {
    parts.push(asset.text);
  }
  return parts.join('\n');
}

export const CryptoDisclosureCheck: ICheck = {
  id: 'crypto_disclosure',

  async run(campaign: CampaignBundle): Promise<RunBlocker[]> {
    const jurisdictions = campaign.targetJurisdiction ?? [];
    const allText = collectAllText(campaign);
    const hasCryptoMention = CRYPTO_REGEX.test(allText);
    const rules = getCryptoDisclosureRules();
    const blockers: RunBlocker[] = [];

    // Special case: RU with no crypto mention is an info-level warning
    // (100% of operators use crypto there)
    if (!hasCryptoMention && jurisdictions.includes('RU')) {
      blockers.push({
        ruleId: 'crypto-disclosure-004',
        severity: 'info',
        evidence: 'No crypto payment methods mentioned in RU-targeted campaign',
        suggestion:
          'Per 01.tech G GATE Report 2026: 100% of Russian operators use crypto (USDT/TRC20, BTC, ETH) as primary payment. Consider whether this is intentional.',
        ownerHint: 'payments-lead',
      });
    }

    if (!hasCryptoMention) {
      return blockers;
    }

    // Crypto mentions detected — check each targeted jurisdiction
    for (const jur of jurisdictions) {
      const rule = rules.regions[jur];
      if (!rule) {
        continue; // No specific crypto rule for this jurisdiction — skip
      }

      const ruleRef = rule.rule_refs[0] ?? 'Local regulatory requirement';

      if (rule.status === 'forbidden') {
        blockers.push({
          ruleId: 'crypto-disclosure-001',
          severity: 'block',
          evidence: `Crypto mentioned in copy targeting ${jur} where crypto is prohibited`,
          suggestion: `Remove all crypto references from ${jur}-targeted copy. Ref: ${ruleRef}`,
          ownerHint: 'legal',
        });
        continue;
      }

      if (rule.status === 'restricted' || rule.status === 'permitted_with_disclosure') {
        if (rule.required_disclaimer) {
          const disclaimerPresent = allText
            .toLowerCase()
            .includes(rule.required_disclaimer.toLowerCase());

          if (!disclaimerPresent) {
            blockers.push({
              ruleId: 'crypto-disclosure-002',
              severity: 'block',
              evidence: `Crypto mentioned in ${jur}-targeted copy but required disclaimer is absent: "${rule.required_disclaimer}"`,
              suggestion: `Add the required disclaimer verbatim: "${rule.required_disclaimer}". Ref: ${ruleRef}`,
              ownerHint: 'legal',
            });
          }
        } else {
          blockers.push({
            ruleId: 'crypto-disclosure-003',
            severity: 'warn',
            evidence: `Crypto mentioned in ${jur}-targeted copy which has restrictions`,
            suggestion: `Verify crypto usage is compliant for ${jur}. Ref: ${ruleRef}`,
            ownerHint: 'legal',
          });
        }
      }
    }

    return blockers;
  },
};
