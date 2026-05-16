import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '../../../../infrastructure/db/client';
import { CampaignRepository } from '../../../../infrastructure/persistence/CampaignRepository';
import { RunRepository } from '../../../../infrastructure/persistence/RunRepository';
import { IdempotencyRepository } from '../../../../infrastructure/persistence/IdempotencyRepository';
import { Bus } from '../../../../application/bus/Bus';
import { HandlerRegistry } from '../../../../application/bus/HandlerRegistry';
import { handler as runChecksHandler } from '../../../../infrastructure/handler/checks/RunChecksHandler';
import { CampaignBundleSchema } from '../../../../domain/model/Campaign';
import { IdempotencyConflictException } from '../../../../domain/exception/PreflightException';
import { hashBody, countBlockers, errorResponse, badRequest } from '../../../../api/v1/index';
import type { RunResponse } from '../../../../api/v1/index';
import type { RunChecksCommand } from '../../../../application/command/RunChecksCommand';
import type { Run } from '../../../../domain/model/Run';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<Response> {
  // T-019: Require Idempotency-Key
  const idempotencyKey = req.headers.get('idempotency-key');
  if (!idempotencyKey) {
    return badRequest('Missing required header: Idempotency-Key');
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return badRequest('Request body must be valid JSON');
  }

  // Validate outer shape
  const outerParse = z
    .object({
      campaign: z.record(z.string(), z.unknown()),
      options: z.object({ skipChecks: z.array(z.string()).optional() }).optional(),
    })
    .safeParse(rawBody);

  if (!outerParse.success) {
    return badRequest(`Invalid request body: ${outerParse.error.message}`);
  }

  // Validate campaign bundle
  const campaignParse = CampaignBundleSchema.safeParse(outerParse.data.campaign);
  if (!campaignParse.success) {
    return badRequest(`Invalid campaign bundle: ${campaignParse.error.message}`);
  }

  const campaign = campaignParse.data;
  const options = outerParse.data.options ?? {};
  const bodyHash = hashBody(rawBody);

  const db = getDb();
  const idempotencyRepo = new IdempotencyRepository(db);

  // T-019: Check existing idempotency record
  const existingIdempotency = await idempotencyRepo.find(idempotencyKey);
  if (existingIdempotency) {
    if (existingIdempotency.requestHash !== bodyHash) {
      const conflict = new IdempotencyConflictException(
        'Idempotency-Key reused with different request body'
      );
      return errorResponse(conflict);
    }
    // Same key + same body → return stored response
    return Response.json(existingIdempotency.responseSnapshot, { status: 200 });
  }

  // Run checks via Bus
  const registry = new HandlerRegistry();
  registry.register(runChecksHandler);
  const bus = new Bus(registry);

  const command: RunChecksCommand = {
    type: 'RunChecks',
    campaign,
    options,
  };

  const result = await bus.dispatch<Run>(command);

  if (!result.ok) {
    return errorResponse(result.error);
  }

  const run = result.value;

  // Persist campaign + version + run
  const campaignRepo = new CampaignRepository(db);
  const runRepo = new RunRepository(db);

  const campaignRecord = await campaignRepo.findOrCreate(campaign);
  const verdictStr = run.verdict;
  const readinessState =
    verdictStr === 'BLOCK' ? 'BLOCKED' : verdictStr === 'WARN' ? 'READY_WITH_WARNINGS' : 'READY';
  const versionN = await campaignRepo.createVersion(
    campaignRecord.id,
    run.blockers,
    readinessState
  );

  const runWithMeta = {
    ...run,
    campaignId: campaignRecord.id,
    version: versionN,
  };

  await runRepo.save(runWithMeta);

  const counts = countBlockers(run.blockers);
  const responseBody: RunResponse = {
    runId: run.id,
    campaignId: campaignRecord.id,
    campaignVersion: versionN,
    verdict: run.verdict,
    status: run.status,
    counts,
    blockers: run.blockers,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
  };

  // T-019: Persist idempotency record
  await idempotencyRepo.save({
    key: idempotencyKey,
    requestHash: bodyHash,
    responseSnapshot: responseBody,
  });

  return Response.json(responseBody, { status: 200 });
}
