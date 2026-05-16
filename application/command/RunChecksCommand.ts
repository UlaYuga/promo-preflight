import type { Command } from '../bus/types';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { Run } from '../../domain/model/Run';

export interface RunChecksCommand extends Command<Run> {
  readonly type: 'RunChecks';
  readonly campaign: CampaignBundle;
  readonly options?: { skipChecks?: string[] };
}
