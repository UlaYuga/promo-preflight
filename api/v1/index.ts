// Shared types and utilities for /api/v1 route handlers.
import { z } from 'zod';
import { createHash } from 'crypto';
import type { PreflightException } from '../../domain/exception/PreflightException';
import type { RunBlocker } from '../../domain/model/Run';

// ---------------------------------------------------------------------------
// Request/response Zod schemas
// ---------------------------------------------------------------------------

export const RunsPostBodySchema = z.object({
  campaign: z.record(z.string(), z.unknown()),
  options: z.object({}).strict().optional(),
});

export const RunResponseSchema = z.object({
  runId: z.string(),
  campaignId: z.string().optional(),
  campaignVersion: z.number().optional(),
  verdict: z.enum(['GO', 'WARN', 'BLOCK']),
  status: z.string(),
  counts: z.object({
    block: z.number(),
    warn: z.number(),
    info: z.number(),
  }),
  blockers: z.array(
    z.object({
      ruleId: z.string(),
      severity: z.enum(['block', 'warn', 'info']),
      evidence: z.string(),
      suggestion: z.string(),
      ownerHint: z.string().optional(),
    })
  ),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});

export type RunResponse = z.infer<typeof RunResponseSchema>;

export const StatsResponseSchema = z.object({
  totalRuns: z.number(),
  totalEvents: z.number(),
  lastEventAt: z.string().nullable(),
  runP95LatencyMs: z.number().nullable(),
});

export type StatsResponse = z.infer<typeof StatsResponseSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function hashBody(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

export function countBlockers(blockers: RunBlocker[]) {
  return {
    block: blockers.filter((b) => b.severity === 'block').length,
    warn: blockers.filter((b) => b.severity === 'warn').length,
    info: blockers.filter((b) => b.severity === 'info').length,
  };
}

export function errorResponse(ex: PreflightException): Response {
  return Response.json(
    { error: ex.code, message: ex.message },
    { status: ex.httpStatus }
  );
}

export function badRequest(message: string): Response {
  return Response.json({ error: 'BAD_REQUEST', message }, { status: 400 });
}

export function payloadTooLarge(message: string): Response {
  return Response.json(
    { error: 'PAYLOAD_TOO_LARGE', message },
    { status: 413 }
  );
}
