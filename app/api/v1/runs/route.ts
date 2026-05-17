import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getDb } from '../../../../infrastructure/db/client';
import { RunPersistenceService } from '../../../../infrastructure/persistence/RunPersistenceService';
import { Bus } from '../../../../application/bus/Bus';
import { HandlerRegistry } from '../../../../application/bus/HandlerRegistry';
import { handler as runChecksHandler } from '../../../../infrastructure/handler/checks/RunChecksHandler';
import type { PreflightEvent } from '../../../../domain/event/PreflightEvent';
import { CampaignBundleSchema } from '../../../../domain/model/Campaign';
import { hashBody, countBlockers, errorResponse, badRequest } from '../../../../api/v1/index';
import type { RunResponse } from '../../../../api/v1/index';
import type { RunChecksCommand } from '../../../../application/command/RunChecksCommand';
import type { Run } from '../../../../domain/model/Run';
import { OutboxEventPublisher } from '../../../../infrastructure/outbox';

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

  const verdictStr = run.verdict;
  const readinessState =
    verdictStr === 'BLOCK' ? 'BLOCKED' : verdictStr === 'WARN' ? 'READY_WITH_WARNINGS' : 'READY';

  try {
    const persistence = new RunPersistenceService(db);
    const eventPublisher = new OutboxEventPublisher(db);
    const persisted = await persistence.persistIdempotentRun<RunResponse>({
      idempotencyKey,
      requestHash: bodyHash,
      campaign,
      run,
      readinessState,
      eventPublisher,
      buildResponse: ({ campaignId, campaignVersion, run: savedRun }) => ({
        runId: savedRun.id,
        campaignId,
        campaignVersion,
        verdict: savedRun.verdict,
        status: savedRun.status,
        counts: countBlockers(savedRun.blockers),
        blockers: savedRun.blockers,
        createdAt: savedRun.createdAt,
        completedAt: savedRun.completedAt,
      }),
      buildEvents: ({ campaignId, campaignVersionId, run: savedRun }) =>
        buildRunEvents(campaignId, campaignVersionId, savedRun),
    });

    return Response.json(persisted.response, { status: 200 });
  } catch (e) {
    if (e instanceof Error && 'code' in e) {
      return errorResponse(e as Parameters<typeof errorResponse>[0]);
    }
    throw e;
  }
}

function buildRunEvents(campaignId: string, versionId: string, run: Run): PreflightEvent[] {
  const occurredAt = new Date().toISOString();
  const runCounts = countBlockers(run.blockers);

  const events: PreflightEvent[] = [
    {
      id: randomUUID(),
      type: 'RunStarted',
      occurredAt,
      runId: run.id,
      campaignId,
      versionId,
    },
    ...run.blockers.map(
      (blocker): PreflightEvent => ({
        id: randomUUID(),
        type: 'BlockerRaised',
        occurredAt,
        runId: run.id,
        ruleId: blocker.ruleId,
        severity: blocker.severity,
        ownerHint: blocker.ownerHint ?? null,
      })
    ),
    {
      id: randomUUID(),
      type: 'RunCompleted',
      occurredAt: run.completedAt ?? occurredAt,
      runId: run.id,
      verdict: run.verdict,
      counts: {
        blockers: runCounts.block,
        warnings: runCounts.warn,
        passed: 0,
      },
    },
  ];

  return events;
}
