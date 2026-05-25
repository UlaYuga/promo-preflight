import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { runs, runBlockers } from '../db/schema';
import type { IRunRepository } from '../../application/port/IRunRepository';
import type { Run, RunBlocker } from '../../domain/model/Run';
import { isUuid } from './uuid';
import { parsePolicyRuleVersions } from '../policyRuleVersions';

export class RunRepository implements IRunRepository {
  constructor(private readonly db: Db) {}

  async save(run: Run): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(runs).values({
        id: run.id,
        campaignId: run.campaignId ?? null,
        campaignVersion: run.version ?? null,
        verdict: run.verdict,
        status: run.status,
        policyRuleVersionsJson: run.policyRuleVersions,
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
    });
  }

  async findById(id: string): Promise<Run | null> {
    if (!isUuid(id)) return null;
    const runRows = await this.db
      .select()
      .from(runs)
      .where(eq(runs.id, id))
      .limit(1);

    if (runRows.length === 0) return null;
    const row = runRows[0];

    const blockerRows = await this.db
      .select()
      .from(runBlockers)
      .where(eq(runBlockers.runId, id));

    const blockers: RunBlocker[] = blockerRows.map((b) => ({
      ruleId: b.ruleId,
      severity: b.severity as RunBlocker['severity'],
      evidence: b.evidence,
      suggestion: b.suggestion,
      ownerHint: b.ownerHint ?? undefined,
    }));

    return {
      id: row.id,
      campaignId: row.campaignId ?? undefined,
      version: row.campaignVersion ?? undefined,
      verdict: row.verdict as Run['verdict'],
      blockers,
      status: row.status as Run['status'],
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      policyRuleVersions: parsePolicyRuleVersions(row.policyRuleVersionsJson),
    };
  }
}
