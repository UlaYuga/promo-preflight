import type { CampaignBundle } from '../../domain/model/Campaign';
import type { RunBlocker } from '../../domain/model/Run';

export interface CampaignRecord {
  id: string;
  campaignName: string;
  operatorLabel: string | null;
  promoType: string;
  geo: string;
  locale: string;
  currency: string;
  launchDate: string | null;
  createdAt: string;
}

export interface CampaignVersionRecord {
  id: string;
  campaignId: string;
  n: number;
  createdAt: string;
  blockers: RunBlocker[];
  readinessState: string;
}

export interface ICampaignRepository {
  /** Find existing campaign by name + operatorLabel, or create a new one. */
  findOrCreate(bundle: CampaignBundle): Promise<CampaignRecord>;

  findById(id: string): Promise<CampaignRecord | null>;

  list(): Promise<CampaignRecord[]>;

  /** Persist a new version with its run's blockers. Returns the version number. */
  createVersion(
    campaignId: string,
    blockers: RunBlocker[],
    readinessState: string
  ): Promise<number>;

  listVersions(campaignId: string): Promise<CampaignVersionRecord[]>;

  /** Returns blockers for two specific version numbers (used for diff). */
  getVersionBlockers(
    campaignId: string,
    versionN: number
  ): Promise<RunBlocker[] | null>;
}
