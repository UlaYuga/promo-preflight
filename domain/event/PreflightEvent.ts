import type { RunBlocker } from '../model/Run';

export const PREFLIGHT_EVENT_TYPES = [
  'RunStarted',
  'RunCompleted',
  'RunFailed',
  'BlockerRaised',
  'CampaignVersionCreated',
] as const;

export type PreflightEventType = (typeof PREFLIGHT_EVENT_TYPES)[number];

export interface PreflightEventBase<TType extends PreflightEventType> {
  readonly eventId: string;
  readonly type: TType;
  readonly occurredAt: string;
}

export interface RunStartedEvent extends PreflightEventBase<'RunStarted'> {
  readonly runId: string;
  readonly campaignId?: string;
  readonly campaignVersion?: number;
}

export interface RunCompletedEvent extends PreflightEventBase<'RunCompleted'> {
  readonly runId: string;
  readonly campaignId: string;
  readonly campaignVersion: number;
  readonly verdict: 'GO' | 'WARN' | 'BLOCK';
  readonly blockerCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
}

export interface RunFailedEvent extends PreflightEventBase<'RunFailed'> {
  readonly runId?: string;
  readonly campaignId?: string;
  readonly reason: string;
}

export interface BlockerRaisedEvent extends PreflightEventBase<'BlockerRaised'> {
  readonly runId: string;
  readonly campaignId: string;
  readonly campaignVersion: number;
  readonly ruleId: string;
  readonly severity: RunBlocker['severity'];
  readonly evidence: string;
  readonly suggestion: string;
  readonly ownerHint?: string;
}

export interface CampaignVersionCreatedEvent
  extends PreflightEventBase<'CampaignVersionCreated'> {
  readonly campaignId: string;
  readonly campaignVersion: number;
  readonly runId?: string;
}

export type PreflightEvent =
  | RunStartedEvent
  | RunCompletedEvent
  | RunFailedEvent
  | BlockerRaisedEvent
  | CampaignVersionCreatedEvent;

export type RunStartedEventInput = Omit<RunStartedEvent, 'type'>;
export type RunCompletedEventInput = Omit<RunCompletedEvent, 'type'>;
export type RunFailedEventInput = Omit<RunFailedEvent, 'type'>;
export type BlockerRaisedEventInput = Omit<BlockerRaisedEvent, 'type'>;
export type CampaignVersionCreatedEventInput = Omit<
  CampaignVersionCreatedEvent,
  'type'
>;

export function createRunStartedEvent(
  input: RunStartedEventInput
): RunStartedEvent {
  return {
    type: 'RunStarted',
    ...input,
  };
}

export function createRunCompletedEvent(
  input: RunCompletedEventInput
): RunCompletedEvent {
  return {
    type: 'RunCompleted',
    ...input,
  };
}

export function createRunFailedEvent(input: RunFailedEventInput): RunFailedEvent {
  return {
    type: 'RunFailed',
    ...input,
  };
}

export function createBlockerRaisedEvent(
  input: BlockerRaisedEventInput
): BlockerRaisedEvent {
  return {
    type: 'BlockerRaised',
    ...input,
  };
}

export function createCampaignVersionCreatedEvent(
  input: CampaignVersionCreatedEventInput
): CampaignVersionCreatedEvent {
  return {
    type: 'CampaignVersionCreated',
    ...input,
  };
}
