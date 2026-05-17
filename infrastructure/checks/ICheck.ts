import type { CampaignBundle } from '../../domain/model/Campaign';
import type { RunBlocker } from '../../domain/model/Run';

export interface ICheck {
  readonly id: string;
  run(campaign: CampaignBundle): Promise<RunBlocker[]>;
}
