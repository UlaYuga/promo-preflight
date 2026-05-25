import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { getDb } from '../db/client';
import { idempotencyKeys, runs } from '../db/schema';
import { RunPersistenceService } from './RunPersistenceService';
import { RunRepository } from './RunRepository';
import { CampaignRepository } from './CampaignRepository';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { Run } from '../../domain/model/Run';

const databaseUrl = process.env.DATABASE_URL?.trim();

const CAMPAIGN: CampaignBundle = {
  metadata: {
    campaignName: `Policy provenance ${randomUUID()}`,
    operatorLabel: 'Ops',
    promoType: 'welcome',
    geo: 'UK',
    locale: 'en-GB',
    currency: 'GBP',
    channelsIncluded: ['email'],
  },
  offer: {
    minDeposit: 20,
    bonusPercentage: 100,
    maxBonus: 200,
    wageringRequirement: '20x bonus amount',
    maxBet: 5,
    eligibilityRules: 'New users only',
  },
  termsText: 'New users only. Wagering 20x bonus amount. 18+.',
  assets: [],
  links: [],
  owners: [],
  targetJurisdiction: ['UK'],
  paymentMethods: ['debit_card'],
};

const POLICY_RULE_VERSIONS = {
  paymentCompatibility: 11,
  cryptoDisclosure: 12,
  jurisdictionalRisk: 13,
};

function makeRun(id: string): Run {
  return {
    id,
    verdict: 'GO',
    blockers: [],
    status: 'completed',
    createdAt: '2026-05-16T10:00:00.000Z',
    completedAt: '2026-05-16T10:00:01.000Z',
    policyRuleVersions: POLICY_RULE_VERSIONS,
  };
}

describe.skipIf(!databaseUrl)('policy rule versions persistence', () => {
  it('persists provenance on runs and replays the same snapshot for idempotency', async () => {
    const db = getDb();
    const service = new RunPersistenceService(db);
    const runId = randomUUID();
    const idempotencyKey = randomUUID();

    const first = await service.persistIdempotentRun({
      idempotencyKey,
      requestHash: 'hash-1',
      campaign: CAMPAIGN,
      run: makeRun(runId),
      readinessState: 'READY',
      buildResponse: ({ run }) => ({
        runId: run.id,
        policyRuleVersions: run.policyRuleVersions,
      }),
    });

    const replay = await service.persistIdempotentRun({
      idempotencyKey,
      requestHash: 'hash-1',
      campaign: CAMPAIGN,
      run: makeRun(randomUUID()),
      readinessState: 'READY',
      buildResponse: ({ run }) => ({
        runId: run.id,
        policyRuleVersions: {
          paymentCompatibility: 99,
          cryptoDisclosure: 99,
          jurisdictionalRisk: 99,
        },
      }),
    });

    const saved = await new RunRepository(db).findById(runId);

    expect(first.response.policyRuleVersions).toEqual(POLICY_RULE_VERSIONS);
    expect(replay.replayed).toBe(true);
    expect(replay.response).toEqual(first.response);
    expect(saved?.policyRuleVersions).toEqual(POLICY_RULE_VERSIONS);

    await db.delete(idempotencyKeys).where(sql`${idempotencyKeys.key} = ${idempotencyKey}`);
    await db.delete(runs).where(sql`${runs.id} = ${runId}`);
  });

  it('returns persisted provenance in campaign versions evidence', async () => {
    const db = getDb();
    const service = new RunPersistenceService(db);
    const runId = randomUUID();

    const result = await service.persistIdempotentRun({
      idempotencyKey: randomUUID(),
      requestHash: 'hash-2',
      campaign: {
        ...CAMPAIGN,
        metadata: { ...CAMPAIGN.metadata, campaignName: `Policy versions ${randomUUID()}` },
      },
      run: makeRun(runId),
      readinessState: 'READY',
      buildResponse: ({ campaignId, campaignVersion, run }) => ({
        campaignId,
        campaignVersion,
        runId: run.id,
      }),
    });

    const versions = await new CampaignRepository(db).listVersions(result.response.campaignId);

    expect(versions[0]).toMatchObject({
      n: result.response.campaignVersion,
      runId,
      policyRuleVersions: POLICY_RULE_VERSIONS,
    });
  });
});
