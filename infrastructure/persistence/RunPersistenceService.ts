import { randomUUID } from 'crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '../db/client';
import { campaignVersions, campaigns, idempotencyKeys, runBlockers, runs } from '../db/schema';
import {
  IdempotencyConflictException,
  SystemException,
} from '../../domain/exception/PreflightException';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { Run } from '../../domain/model/Run';
import { decideIdempotency } from './idempotencyDecision';

// The tx type matches what drizzle passes to the transaction callback.
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export interface PersistRunInput<TResponse> {
  idempotencyKey: string;
  requestHash: string;
  campaign: CampaignBundle;
  run: Run;
  readinessState: string;
  buildResponse(input: { campaignId: string; campaignVersion: number; run: Run }): TResponse;
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
      const campaignRecord = await this.findOrCreateCampaign(tx, input.campaign);
      const campaignVersion = await this.createVersion(
        tx,
        campaignRecord.id,
        input.run.blockers,
        input.readinessState
      );
      const runWithMeta: Run = {
        ...input.run,
        campaignId: campaignRecord.id,
        version: campaignVersion,
      };
      await this.saveRun(tx, runWithMeta);

      const response = input.buildResponse({
        campaignId: campaignRecord.id,
        campaignVersion,
        run: runWithMeta,
      });

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

  private async findOrCreateCampaign(tx: Tx, bundle: CampaignBundle): Promise<{ id: string }> {
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
    tx: Tx,
    campaignId: string,
    blockers: Run['blockers'],
    readinessState: string
  ): Promise<number> {
    const existing = await tx
      .select({ n: campaignVersions.n })
      .from(campaignVersions)
      .where(eq(campaignVersions.campaignId, campaignId))
      .orderBy(desc(campaignVersions.n))
      .limit(1);

    const n = existing.length > 0 ? existing[0].n + 1 : 1;

    await tx.insert(campaignVersions).values({
      campaignId,
      n,
      extractedFactsJson: {},
      blockersJson: blockers,
      readinessState,
    });

    return n;
  }

  private async saveRun(tx: Tx, run: Run): Promise<void> {
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
