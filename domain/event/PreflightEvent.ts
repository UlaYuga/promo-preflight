import { z } from 'zod';

export const PREFLIGHT_EVENT_TYPES = [
  'RunStarted',
  'BlockerRaised',
  'BlockerResolved',
  'RunCompleted',
  'OwnerOverridden',
  'VersionDiffed',
] as const;

export type PreflightEventType = (typeof PREFLIGHT_EVENT_TYPES)[number];

const BaseEventSchema = z
  .object({
    id: z.string(),
    occurredAt: z.string(),
  })
  .strict();

const RunCountsSchema = z
  .object({
    blockers: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
  })
  .strict();

const VersionDiffCountsSchema = z
  .object({
    resolved: z.number().int().nonnegative(),
    new: z.number().int().nonnegative(),
    stillOpen: z.number().int().nonnegative(),
  })
  .strict();

export const RunStartedSchema = BaseEventSchema.extend({
  type: z.literal('RunStarted'),
  runId: z.string(),
  campaignId: z.string(),
  versionId: z.string(),
}).strict();

export const BlockerRaisedSchema = BaseEventSchema.extend({
  type: z.literal('BlockerRaised'),
  runId: z.string(),
  ruleId: z.string(),
  severity: z.enum(['block', 'warn', 'info']),
  ownerHint: z.string().nullable(),
}).strict();

export const BlockerResolvedSchema = BaseEventSchema.extend({
  type: z.literal('BlockerResolved'),
  runId: z.string(),
  ruleId: z.string(),
  resolvedBy: z.string().nullable(),
}).strict();

export const RunCompletedSchema = BaseEventSchema.extend({
  type: z.literal('RunCompleted'),
  runId: z.string(),
  verdict: z.enum(['GO', 'WARN', 'BLOCK']),
  counts: RunCountsSchema,
}).strict();

export const OwnerOverriddenSchema = BaseEventSchema.extend({
  type: z.literal('OwnerOverridden'),
  runId: z.string(),
  ruleId: z.string(),
  fromOwner: z.string().nullable(),
  toOwner: z.string(),
}).strict();

export const VersionDiffedSchema = BaseEventSchema.extend({
  type: z.literal('VersionDiffed'),
  campaignId: z.string(),
  fromVersion: z.number().int(),
  toVersion: z.number().int(),
  counts: VersionDiffCountsSchema,
}).strict();

export const PreflightEventSchema = z.discriminatedUnion('type', [
  RunStartedSchema,
  BlockerRaisedSchema,
  BlockerResolvedSchema,
  RunCompletedSchema,
  OwnerOverriddenSchema,
  VersionDiffedSchema,
]);

export type RunStarted = z.infer<typeof RunStartedSchema>;
export type BlockerRaised = z.infer<typeof BlockerRaisedSchema>;
export type BlockerResolved = z.infer<typeof BlockerResolvedSchema>;
export type RunCompleted = z.infer<typeof RunCompletedSchema>;
export type OwnerOverridden = z.infer<typeof OwnerOverriddenSchema>;
export type VersionDiffed = z.infer<typeof VersionDiffedSchema>;

export type PreflightEvent =
  | RunStarted
  | BlockerRaised
  | BlockerResolved
  | RunCompleted
  | OwnerOverridden
  | VersionDiffed;

export function assertExhaustive(event: never): never {
  void event;
  throw new Error('Non-exhaustive PreflightEvent handling');
}
