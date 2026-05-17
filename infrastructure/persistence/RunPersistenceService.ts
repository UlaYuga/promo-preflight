import { randomUUID } from 'crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { campaignVersions, campaigns, idempotencyKeys, runBlockers, runs } from '../db/schema';
import {
  IdempotencyConflictException,
  SystemException,
} from '../../domain/exception/PreflightException';
import type { IEventPublisher } from '../../application/port/IEventPublisher';
import type { PreflightEvent } from '../../domain/event/PreflightEvent';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { Run } from '../../domain/model/Run';
import { decideIdempotency } from './idempotencyDecision';
import type { Transaction } from './types';

export interface PersistRunInput<TResponse> {
  idempotencyKey: string;
  requestHash: string;
  campaign: CampaignBundle;
  run: Run;
  readinessState: string;
  eventPublisher?: IEventPublisher;
  buildResponse(input: { campaignId: string; campaignVersion: number; run: Run }): TResponse;
  buildEvents?(input: {
    campaignId: string;
    campaignVersion: number;
    campaignVersionId: string;
    run: Run;
  }): PreflightEvent[];
}

export interface PersistRunResult<TResponse> {
  replayed: boolean;
  response: TResponse;
}

/**
 * Persists an entire run workflow in a single database transaction:
 *
 *   1. INSERT idempotency key as 'pending' — claims the slot atomically via PK.
 *      Postgres blocks any concurrent INSERT for the same key until this tx
 *      commits or rolls back, guaranteeing at-most-one run per key.
 *   2. If INSERT conflicts → read the committed row and apply decideIdempotency:
 *        - same hash + completed  → replay stored response
 *        - different hash         → throw IdempotencyConflictException (409)
 *        - same hash + pending    → throw SystemException (503)
 *   3. findOrCreate campaign (isNull guard for null operatorLabel).
 *   4. createVersion.
 *   5. INSERT run + run_blockers.
 *   6. UPDATE idempotency key: responseSnapshot = real response, status = 'completed'.
 *
 * If any step fails the entire transaction rolls back — including the placeholder
 * INSERT — so no stale 'pending' rows are left in idempotency_keys.
 */
export class RunPersistenceService {
  constructor(private readonly db: Db) {}

  async persistIdempotentRun<TResponse>(
    input: PersistRunInput<TResponse>
  ): Promise<PersistRunResult<TResponse>> {
    return this.db.transaction(async (tx) => {
      // Step 1: claim the idempotency slot with a 'pending' placeholder.
      const claimed = await tx
        .insert(idempotencyKeys)
        .values({
          key: input.idempotencyKey,
          requestHash: input.requestHash,
          responseSnapshot: {},
          status: 'pending',
        })
        .onConflictDoNothing()
        .returning({ key: idempotencyKeys.key });

      if (claimed.length === 0) {
        // Postgres waited for the conflicting tx before signalling DO NOTHING,
        // so the row we read here is in its committed final state.
        const rows = await tx
          .select({
            requestHash: idempotencyKeys.requestHash,
            status: idempotencyKeys.status,
            responseSnapshot: idempotencyKeys.responseSnapshot,
          })
          .from(idempotencyKeys)
          .where(eq(idempotencyKeys.key, input.idempotencyKey))
          .limit(1);

        const decision = decideIdempotency(0, rows[0] ?? null, input.requestHash);

        if (decision.type === 'conflict') {
          throw new IdempotencyConflictException(
            'Idempotency-Key reused with different request body'
          );
        }
        if (decision.type === 'replay') {
          return { replayed: true, response: decision.responseBody as TResponse };
        }
        // 'in_progress': concurrent request still running (or previous crashed).
        throw new SystemException(
          'A concurrent request is already processing this Idempotency-Key; please retry shortly'
        );
      }

      // We own the slot — all writes are inside this transaction.
      //
      // Serialize on (campaignName, operatorLabel) for the duration of this tx.
      // findOrCreateCampaign and createVersion are SELECT-then-INSERT, and
      // READ COMMITTED lets concurrent transactions for the same campaign
      // identity race: each reads "no campaign exists", each inserts, and we
      // end up with N campaign rows for one logical campaign. A transaction-
      // scoped advisory lock (released automatically on COMMIT/ROLLBACK)
      // sidesteps this without a schema migration and without a unique
      // constraint that would reject legitimate duplicate names from
      // different operators.
      const { campaignName, operatorLabel } = input.campaign.metadata;
      const lockKey = JSON.stringify([campaignName, operatorLabel ?? null]);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);

      const campaignRecord = await this.findOrCreateCampaign(tx, input.campaign);
      const campaignVersionRecord = await this.createVersion(
        tx,
        campaignRecord.id,
        input.run.blockers,
        input.readinessState
      );
      const runWithMeta: Run = {
        ...input.run,
        campaignId: campaignRecord.id,
        version: campaignVersionRecord.n,
      };
      await this.saveRun(tx, runWithMeta);

      const response = input.buildResponse({
        campaignId: campaignRecord.id,
        campaignVersion: campaignVersionRecord.n,
        run: runWithMeta,
      });

      if (input.eventPublisher && input.buildEvents) {
        const events = input.buildEvents({
          campaignId: campaignRecord.id,
          campaignVersion: campaignVersionRecord.n,
          campaignVersionId: campaignVersionRecord.id,
          run: runWithMeta,
        });
        await input.eventPublisher.publishAll(events, tx);
      }

      // Step 6: mark completed with the real response snapshot.
      await tx
        .update(idempotencyKeys)
        .set({ responseSnapshot: response as Record<string, unknown>, status: 'completed' })
        .where(eq(idempotencyKeys.key, input.idempotencyKey));

      return { replayed: false, response };
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers — all operate on the transaction client (Tx ≈ Db).
  // ---------------------------------------------------------------------------

  private async findOrCreateCampaign(
    tx: Transaction,
    bundle: CampaignBundle
  ): Promise<{ id: string }> {
    const { campaignName, operatorLabel } = bundle.metadata;

    const existing = await tx
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.campaignName, campaignName),
          // isNull() is required; eq(col, '') would miss NULL rows.
          operatorLabel
            ? eq(campaigns.operatorLabel, operatorLabel)
            : isNull(campaigns.operatorLabel)
        )
      )
      .orderBy(desc(campaigns.createdAt))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const rows = await tx
      .insert(campaigns)
      .values({
        id: randomUUID(),
        campaignName,
        operatorLabel: operatorLabel ?? null,
        promoType: bundle.metadata.promoType,
        geo: bundle.metadata.geo,
        locale: bundle.metadata.locale,
        currency: bundle.metadata.currency,
        launchDate: bundle.metadata.launchDate ?? null,
      })
      .returning({ id: campaigns.id });

    return rows[0];
  }

  private async createVersion(
    tx: Transaction,
    campaignId: string,
    blockers: Run['blockers'],
    readinessState: string
  ): Promise<{ id: string; n: number }> {
    const existing = await tx
      .select({ n: campaignVersions.n })
      .from(campaignVersions)
      .where(eq(campaignVersions.campaignId, campaignId))
      .orderBy(desc(campaignVersions.n))
      .limit(1);

    const n = existing.length > 0 ? existing[0].n + 1 : 1;

    const inserted = await tx
      .insert(campaignVersions)
      .values({
        campaignId,
        n,
        extractedFactsJson: {},
        blockersJson: blockers,
        readinessState,
      })
      .returning({ id: campaignVersions.id, n: campaignVersions.n });

    const row = inserted[0];
    if (!row) {
      throw new SystemException('Failed to create campaign version row');
    }

    return row;
  }

  private async saveRun(tx: Transaction, run: Run): Promise<void> {
    await tx.insert(runs).values({
      id: run.id,
      campaignId: run.campaignId ?? null,
      campaignVersion: run.version ?? null,
      verdict: run.verdict,
      status: run.status,
      createdAt: new Date(run.createdAt),
      completedAt: run.completedAt ? new Date(run.completedAt) : null,
    });

    if (run.blockers.length > 0) {
      await tx.insert(runBlockers).values(
        run.blockers.map((b) => ({
          runId: run.id,
          ruleId: b.ruleId,
          severity: b.severity,
          evidence: b.evidence,
          suggestion: b.suggestion,
          ownerHint: b.ownerHint ?? null,
        }))
      );
    }
  }
}
