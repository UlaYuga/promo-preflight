import { describe, expect, it } from 'vitest';
import {
  createBlockerRaisedEvent,
  createCampaignVersionCreatedEvent,
  createRunCompletedEvent,
  createRunFailedEvent,
  createRunStartedEvent,
  PREFLIGHT_EVENT_TYPES,
} from './PreflightEvent';

const occurredAt = '2026-05-16T10:00:00.000Z';

describe('PreflightEvent', () => {
  it('creates a RunStarted event with run routing fields', () => {
    expect(
      createRunStartedEvent({
        eventId: 'evt-1',
        occurredAt,
        runId: 'run-1',
        campaignId: 'campaign-1',
        campaignVersion: 3,
      })
    ).toEqual({
      eventId: 'evt-1',
      type: 'RunStarted',
      occurredAt,
      runId: 'run-1',
      campaignId: 'campaign-1',
      campaignVersion: 3,
    });
  });

  it('creates a RunCompleted event with verdict and severity counts', () => {
    expect(
      createRunCompletedEvent({
        eventId: 'evt-2',
        occurredAt,
        runId: 'run-1',
        campaignId: 'campaign-1',
        campaignVersion: 3,
        verdict: 'BLOCK',
        blockerCount: 4,
        warningCount: 2,
        infoCount: 1,
      })
    ).toMatchObject({
      type: 'RunCompleted',
      verdict: 'BLOCK',
      blockerCount: 4,
      warningCount: 2,
      infoCount: 1,
    });
  });

  it('creates a RunFailed event with optional campaign context', () => {
    expect(
      createRunFailedEvent({
        eventId: 'evt-3',
        occurredAt,
        runId: 'run-1',
        campaignId: 'campaign-1',
        reason: 'check engine failed',
      })
    ).toEqual({
      eventId: 'evt-3',
      type: 'RunFailed',
      occurredAt,
      runId: 'run-1',
      campaignId: 'campaign-1',
      reason: 'check engine failed',
    });
  });

  it('creates a BlockerRaised event with rule and owner payload for notifications', () => {
    expect(
      createBlockerRaisedEvent({
        eventId: 'evt-4',
        occurredAt,
        runId: 'run-1',
        campaignId: 'campaign-1',
        campaignVersion: 3,
        ruleId: 'payment-compat-001',
        severity: 'block',
        evidence: 'Credit card is forbidden in UK',
        suggestion: 'Remove credit card for UK traffic.',
        ownerHint: 'risk',
      })
    ).toEqual({
      eventId: 'evt-4',
      type: 'BlockerRaised',
      occurredAt,
      runId: 'run-1',
      campaignId: 'campaign-1',
      campaignVersion: 3,
      ruleId: 'payment-compat-001',
      severity: 'block',
      evidence: 'Credit card is forbidden in UK',
      suggestion: 'Remove credit card for UK traffic.',
      ownerHint: 'risk',
    });
  });

  it('creates a CampaignVersionCreated event for version-diff subscribers', () => {
    expect(
      createCampaignVersionCreatedEvent({
        eventId: 'evt-5',
        occurredAt,
        campaignId: 'campaign-1',
        campaignVersion: 4,
        runId: 'run-2',
      })
    ).toEqual({
      eventId: 'evt-5',
      type: 'CampaignVersionCreated',
      occurredAt,
      campaignId: 'campaign-1',
      campaignVersion: 4,
      runId: 'run-2',
    });
  });

  it('exports the stable event type list', () => {
    expect(PREFLIGHT_EVENT_TYPES).toEqual([
      'RunStarted',
      'RunCompleted',
      'RunFailed',
      'BlockerRaised',
      'CampaignVersionCreated',
    ]);
  });
});
