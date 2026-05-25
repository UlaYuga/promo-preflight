import { NextRequest } from 'next/server';
import { getDb } from '../../../../../infrastructure/db/client';
import { RunRepository } from '../../../../../infrastructure/persistence/RunRepository';
import { RunNotFoundException } from '../../../../../domain/exception/PreflightException';
import { countBlockers, errorResponse } from '../../../../../api/v1/index';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  const db = getDb();
  const runRepo = new RunRepository(db);
  const run = await runRepo.findById(id);

  if (!run) {
    return errorResponse(new RunNotFoundException(`Run not found: ${id}`));
  }

  const counts = countBlockers(run.blockers);
  return Response.json({
    runId: run.id,
    campaignId: run.campaignId,
    campaignVersion: run.version,
    verdict: run.verdict,
    status: run.status,
    counts,
    blockers: run.blockers,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
    policyRuleVersions: run.policyRuleVersions,
  });
}
