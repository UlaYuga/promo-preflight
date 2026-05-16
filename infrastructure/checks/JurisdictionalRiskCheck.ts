import { readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { RunBlocker } from '../../domain/model/Run';
import type { ICheck } from './ICheck';

interface PhraseRule {
  phrase: string;
  rule_ref: string;
  severity: 'block' | 'warn';
}

interface MandatoryRule {
  text: string;
  rule_ref: string;
  severity: 'block' | 'warn';
}

interface RegionPhraseRules {
  forbidden: PhraseRule[];
  mandatory: MandatoryRule[];
}

interface ForbiddenPhrasesYaml {
  version: number;
  regions: Record<string, RegionPhraseRules>;
}

function loadRules(): ForbiddenPhrasesYaml {
  const yamlPath = join(process.cwd(), 'rules', 'forbidden-phrases-by-region.yaml');
  const content = readFileSync(yamlPath, 'utf-8');
  return parseYaml(content) as ForbiddenPhrasesYaml;
}

let cachedRules: ForbiddenPhrasesYaml | null = null;

function getRules(): ForbiddenPhrasesYaml {
  if (!cachedRules) {
    cachedRules = loadRules();
  }
  return cachedRules;
}

function collectAllText(campaign: CampaignBundle): string {
  const parts: string[] = [campaign.termsText];
  for (const asset of campaign.assets) {
    parts.push(asset.text);
  }
  return parts.join('\n');
}

function buildWordBoundaryRegex(phrase: string): RegExp {
  // Skip placeholder phrases (used for manual-review triggers in YAML)
  if (phrase.startsWith('#')) return /(?!)/; // never matches
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i');
}

export const JurisdictionalRiskCheck: ICheck = {
  id: 'jurisdictional_risk',

  async run(campaign: CampaignBundle): Promise<RunBlocker[]> {
    const jurisdictions = campaign.targetJurisdiction ?? [];
    if (jurisdictions.length === 0) {
      return [];
    }

    const rules = getRules();
    const allText = collectAllText(campaign);
    const blockers: RunBlocker[] = [];

    for (const jur of jurisdictions) {
      const regionRules = rules.regions[jur];
      if (!regionRules) {
        continue; // No specific phrase rules for this jurisdiction
      }

      // Check forbidden phrases
      for (const forbidden of regionRules.forbidden) {
        const regex = buildWordBoundaryRegex(forbidden.phrase);
        if (regex.test(allText)) {
          blockers.push({
            ruleId: `juris-risk-forbidden-${jur}`,
            severity: forbidden.severity,
            evidence: `Forbidden phrase "${forbidden.phrase}" found in ${jur}-targeted copy`,
            suggestion: `Remove the phrase "${forbidden.phrase}" from all campaign materials. Ref: ${forbidden.rule_ref}`,
            ownerHint: 'legal',
          });
        }
      }

      // Check mandatory texts
      for (const mandatory of regionRules.mandatory) {
        const present = allText.toLowerCase().includes(mandatory.text.toLowerCase());
        if (!present) {
          blockers.push({
            ruleId: `juris-risk-mandatory-${jur}`,
            severity: mandatory.severity,
            evidence: `Mandatory text "${mandatory.text}" not found in ${jur}-targeted copy`,
            suggestion: `Add required text "${mandatory.text}" to campaign materials. Ref: ${mandatory.rule_ref}`,
            ownerHint: 'legal',
          });
        }
      }
    }

    return blockers;
  },
};
