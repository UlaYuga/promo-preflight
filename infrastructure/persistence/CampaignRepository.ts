import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { Db } from '../db/client';
import { campaigns, campaignVersions, runs } from '../db/schema';
import type { ICampaignRepository, CampaignRecord, CampaignVersionRecord } from '../../application/port/ICampaignRepository';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { RunBlocker } from '../../domain/model/Run';
import { isUuid } from './uuid';
import { parsePolicyRuleVersions } from '../policyRuleVersions';

export class CampaignRepository implements ICampaignRepository {
  constructor(private readonly db: Db) {}

  async findOrCreate(bundle: CampaignBundle): Promise<CampaignRecord> {
    const { campaignName, operatorLabel } = bundle.metadata;

    const existing = await this.db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.campaignName, campaignName),
          operatorLabel
            ? eq(campaigns.operatorLabel, operatorLabel)
            : eq(campaigns.operatorLabel, '')
        )
      )
      .orderBy(desc(campaigns.createdAt))
      .limit(1);

    if (existing.length > 0) {
      return this.toRecord(existing[0]);
    }

    const id = randomUUID();
    const rows = await this.db
      .insert(campaigns)
      .values({
        id,
        campaignName,
        operatorLabel: operatorLabel ?? null,
        promoType: bundle.metadata.promoType,
        geo: bundle.metadata.geo,
        locale: bundle.metadata.locale,
        currency: bundle.metadata.currency,
        launchDate: bundle.metadata.launchDate ?? null,
      })
      .returning();

    return this.toRecord(rows[0]);
  }

  async findById(id: string): Promise<CampaignRecord | null> {
    if (!isUuid(id)) return null;
    const rows = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);
    return rows.length > 0 ? this.toRecord(rows[0]) : null;
  }

  async list(): Promise<CampaignRecord[]> {
    const rows = await this.db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));
    return rows.map((r) => this.toRecord(r));
  }

  async createVersion(
    campaignId: string,
    blockers: RunBlocker[],
    readinessState: string
  ): Promise<number> {
    const existing = await this.db
      .select({ n: campaignVersions.n })
      .from(campaignVersions)
      .where(eq(campaignVersions.campaignId, campaignId))
      .orderBy(desc(campaignVersions.n))
      .limit(1);

    const n = existing.length > 0 ? existing[0].n + 1 : 1;

    await this.db.insert(campaignVersions).values({
      campaignId,
      n,
      extractedFactsJson: {},
      blockersJson: blockers,
      readinessState,
    });

    return n;
  }

  async listVersions(campaignId: string): Promise<CampaignVersionRecord[]> {
    const rows = await this.db
      .select({
        version: campaignVersions,
        runId: runs.id,
        policyRuleVersionsJson: runs.policyRuleVersionsJson,
      })
      .from(campaignVersions)
      .leftJoin(
        runs,
        and(
          eq(runs.campaignId, campaignVersions.campaignId),
          eq(runs.campaignVersion, campaignVersions.n)
        )
      )
      .where(eq(campaignVersions.campaignId, campaignId))
      .orderBy(desc(campaignVersions.n));
    return rows.map((r) => this.toVersionRecord(r));
  }

  async getVersionBlockers(
    campaignId: string,
    versionN: number
  ): Promise<RunBlocker[] | null> {
    const rows = await this.db
      .select({ blockersJson: campaignVersions.blockersJson })
      .from(campaignVersions)
      .where(
        and(
          eq(campaignVersions.campaignId, campaignId),
          eq(campaignVersions.n, versionN)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return rows[0].blockersJson as RunBlocker[];
  }

  private toRecord(row: typeof campaigns.$inferSelect): CampaignRecord {
    return {
      id: row.id,
      campaignName: row.campaignName,
      operatorLabel: row.operatorLabel,
      promoType: row.promoType,
      geo: row.geo,
      locale: row.locale,
      currency: row.currency,
      launchDate: row.launchDate,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionRecord(
    row:
      | typeof campaignVersions.$inferSelect
      | {
          version: typeof campaignVersions.$inferSelect;
          runId: string | null;
          policyRuleVersionsJson: unknown;
        }
  ): CampaignVersionRecord {
    const versionRow = 'version' in row ? row.version : row;
    return {
      id: versionRow.id,
      campaignId: versionRow.campaignId,
      n: versionRow.n,
      createdAt: versionRow.createdAt.toISOString(),
      blockers: (versionRow.blockersJson ?? []) as RunBlocker[],
      readinessState: versionRow.readinessState,
      ...('version' in row && row.runId && row.policyRuleVersionsJson
        ? {
            runId: row.runId,
            policyRuleVersions: parsePolicyRuleVersions(row.policyRuleVersionsJson),
          }
        : {}),
    };
  }
}
