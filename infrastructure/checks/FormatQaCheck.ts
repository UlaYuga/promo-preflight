import { runCheck } from '../../lib/checks/runner';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { RunBlocker } from '../../domain/model/Run';
import type { ICheck } from './ICheck';

export const FormatQaCheck: ICheck = {
  id: 'format_qa',

  async run(campaign: CampaignBundle): Promise<RunBlocker[]> {
    const result = runCheck('format_qa', {
      bundle: campaign,
      generatedAt: new Date().toISOString(),
    });

    return result.issues
      .filter((issue) => issue.blocker || issue.severity === 'HIGH' || issue.severity === 'CRITICAL')
      .map((issue) => ({
        ruleId: `format_qa.${issue.issueId}`,
        severity: issue.blocker ? 'block' : 'warn',
        evidence: issue.evidence.map((e) => `${e.field}: ${e.snippet}`).join('; '),
        suggestion: issue.suggestedFix,
        ownerHint: issue.ownerSuggestion,
      }));
  },
};
