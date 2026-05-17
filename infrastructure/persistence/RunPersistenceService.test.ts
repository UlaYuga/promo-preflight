import { describe, expect, it, vi } from 'vitest';
import { RunPersistenceService } from './RunPersistenceService';
import type { Db } from '../db/client';
import {
  campaignVersions,
  campaigns,
  idempotencyKeys,
  runBlockers,
  runs,
} from '../db/schema';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { Run } from '../../domain/model/Run';
import type { IEventPublisher } from '../../application/port/IEventPublisher';
import type { PreflightEvent } from '../../domain/event/PreflightEvent';

const CAMPAIGN: CampaignBundle = {
  metadata: {
    campaignName: 'Persistence fixture',
    operatorLabel: 'Ops',
    promoType: 'welcome',
    geo: 'MGA generic',
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

const BASE_RUN: Run = {
  id: 'run-1',
  verdict: 'GO',
  blockers: [],
  status: 'completed',
  createdAt: '2026-05-16T10:00:00.000Z',
  completedAt: '2026-05-16T10:00:01.000Z',
};

describe('RunPersistenceService', () => {
  it('publishes events within tx after campaign/version metadata is attached to run', async () => {
    const callOrder: string[] = [];
    let insertedRunCampaignId: string | null = null;
    let insertedRunVersion: number | null = null;

    const tx = {
      execute: async () => {
        callOrder.push('advisory_lock');
      },
      insert: (table: unknown) => {
        if (table === idempotencyKeys) {
          return {
            values: () => ({
              onConflictDoNothing: () => ({
                returning: async () => {
                  callOrder.push('idempotency.claim');
                  return [{ key: 'idem-1' }];
                },
              }),
            }),
          };
        }
        if (table === campaigns) {
          return {
            values: () => ({
              returning: async () => {
                callOrder.push('campaign.insert');
                return [{ id: 'campaign-1' }];
              },
            }),
          };
        }
        if (table === campaignVersions) {
          return {
            values: () => ({
              returning: async () => {
                callOrder.push('version.insert');
                return [{ id: 'version-1', n: 1 }];
              },
            }),
          };
        }
        if (table === runs) {
          return {
            values: async (value: {
              campaignId: string | null;
              campaignVersion: number | null;
            }) => {
              callOrder.push('run.insert');
              insertedRunCampaignId = value.campaignId;
              insertedRunVersion = value.campaignVersion;
            },
          };
        }
        if (table === runBlockers) {
          return {
            values: async () => {
              callOrder.push('run_blockers.insert');
            },
          };
        }

        throw new Error('Unexpected insert table');
      },
      select: () => ({
        from: (table: unknown) => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => {
                if (table === campaigns) {
                  callOrder.push('campaign.select');
                  return [];
                }
                if (table === campaignVersions) {
                  callOrder.push('version.select');
                  return [];
                }
                throw new Error('Unexpected select table');
              },
            }),
            limit: async () => [],
          }),
        }),
      }),
      update: (table: unknown) => {
        if (table !== idempotencyKeys) {
          throw new Error('Unexpected update table');
        }
        return {
          set: () => ({
            where: async () => {
              callOrder.push('idempotency.complete');
            },
          }),
        };
      },
    };

    const db: Db = {
      transaction: async (callback: (transactionClient: unknown) => Promise<unknown>) =>
        callback(tx),
    } as unknown as Db;

    const service = new RunPersistenceService(db);
    const eventPublisher: IEventPublisher = {
      publish: async () => {},
      publishAll: vi.fn(async (_events: PreflightEvent[], txArg?: unknown) => {
        callOrder.push('events.publishAll');
        expect(txArg).toBe(tx);
        expect(insertedRunCampaignId).toBe('campaign-1');
        expect(insertedRunVersion).toBe(1);
      }),
    };

    const result = await service.persistIdempotentRun({
      idempotencyKey: 'idem-1',
      requestHash: 'hash-1',
      campaign: CAMPAIGN,
      run: BASE_RUN,
      readinessState: 'GO',
      eventPublisher,
      buildResponse: ({ campaignId, campaignVersion, run }) => {
        expect(campaignId).toBe('campaign-1');
        expect(campaignVersion).toBe(1);
        expect(run.campaignId).toBe('campaign-1');
        expect(run.version).toBe(1);
        return { campaignId, campaignVersion, runId: run.id };
      },
      buildEvents: ({ campaignId, campaignVersion, campaignVersionId, run }) => {
        expect(campaignId).toBe('campaign-1');
        expect(campaignVersion).toBe(1);
        expect(campaignVersionId).toBe('version-1');
        expect(run.campaignId).toBe('campaign-1');
        expect(run.version).toBe(1);

        return [
          {
            id: 'event-1',
            occurredAt: '2026-05-16T10:00:02.000Z',
            type: 'RunStarted',
            runId: run.id,
            campaignId,
            versionId: campaignVersionId,
          },
        ];
      },
    });

    expect(result.replayed).toBe(false);
    expect(result.response).toEqual({
      campaignId: 'campaign-1',
      campaignVersion: 1,
      runId: 'run-1',
    });
    expect(eventPublisher.publishAll).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual([
      'idempotency.claim',
      'advisory_lock',
      'campaign.select',
      'campaign.insert',
      'version.select',
      'version.insert',
      'run.insert',
      'events.publishAll',
      'idempotency.complete',
    ]);
  });
});
