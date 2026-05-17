import { describe, expect, it } from 'vitest';
import {
  assertExhaustive,
  type PreflightEvent,
  PreflightEventSchema,
  PREFLIGHT_EVENT_TYPES,
} from './PreflightEvent';

const occurredAt = '2026-05-16T10:00:00.000Z';

describe('PreflightEvent', () => {
  const events: PreflightEvent[] = [
    {
      id: 'evt-1',
      type: 'RunStarted',
      occurredAt,
      runId: 'run-1',
      campaignId: 'campaign-1',
      versionId: 'v3',
    },
    {
      id: 'evt-2',
      type: 'BlockerRaised',
      occurredAt,
      runId: 'run-1',
      ruleId: 'payment-compat-001',
      severity: 'block',
      ownerHint: 'risk',
    },
    {
      id: 'evt-3',
      type: 'BlockerResolved',
      occurredAt,
      runId: 'run-1',
      ruleId: 'payment-compat-001',
      resolvedBy: 'qa-owner',
    },
    {
      id: 'evt-4',
      type: 'RunCompleted',
      occurredAt,
      runId: 'run-1',
      verdict: 'BLOCK',
      counts: {
        blockers: 1,
        warnings: 2,
        passed: 8,
      },
    },
    {
      id: 'evt-5',
      type: 'OwnerOverridden',
      occurredAt,
      runId: 'run-1',
      ruleId: 'payment-compat-001',
      fromOwner: 'ops',
      toOwner: 'risk',
    },
    {
      id: 'evt-6',
      type: 'VersionDiffed',
      occurredAt,
      campaignId: 'campaign-1',
      fromVersion: 2,
      toVersion: 3,
      counts: {
        resolved: 4,
        new: 2,
        stillOpen: 1,
      },
    },
  ];

  const summarizeEvent = (event: PreflightEvent): string => {
    switch (event.type) {
      case 'RunStarted':
        return event.versionId;
      case 'BlockerRaised':
        return event.severity;
      case 'BlockerResolved':
        return event.ruleId;
      case 'RunCompleted':
        return event.verdict;
      case 'OwnerOverridden':
        return event.toOwner;
      case 'VersionDiffed':
        return `${event.fromVersion}->${event.toVersion}`;
      default:
        return assertExhaustive(event);
    }
  };

  it('exports the canonical event type list', () => {
    expect(PREFLIGHT_EVENT_TYPES).toEqual([
      'RunStarted',
      'BlockerRaised',
      'BlockerResolved',
      'RunCompleted',
      'OwnerOverridden',
      'VersionDiffed',
    ]);
  });

  it('covers all six event payload shapes', () => {
    expect(events).toHaveLength(6);
    expect(events.map((event) => event.type)).toEqual(PREFLIGHT_EVENT_TYPES);
  });

  it('uses assertExhaustive in a switch helper', () => {
    expect(summarizeEvent(events[0])).toBe('v3');
    expect(summarizeEvent(events[1])).toBe('block');
    expect(summarizeEvent(events[2])).toBe('payment-compat-001');
    expect(summarizeEvent(events[3])).toBe('BLOCK');
    expect(summarizeEvent(events[4])).toBe('risk');
    expect(summarizeEvent(events[5])).toBe('2->3');
  });

  it('uses id instead of eventId on all events', () => {
    for (const event of events) {
      expect(event).toHaveProperty('id');
      expect(event).not.toHaveProperty('eventId');
      expect(event.occurredAt).toBe(occurredAt);
    }
  });

  it('parses valid events with PreflightEventSchema', () => {
    for (const event of events) {
      expect(PreflightEventSchema.parse(event)).toEqual(event);
    }
  });

  it('fails on invalid event discriminator', () => {
    const invalidTypeEvent = {
      id: 'evt-7',
      type: 'UnknownEvent',
      occurredAt,
    };

    expect(() => PreflightEventSchema.parse(invalidTypeEvent)).toThrow();
  });

  it('fails on invalid payload for known discriminator', () => {
    const invalidPayload = {
      id: 'evt-8',
      type: 'RunCompleted',
      occurredAt,
      runId: 'run-1',
      verdict: 'GO',
      counts: {
        blockers: 1,
        warnings: 2,
      },
    };

    expect(() => PreflightEventSchema.parse(invalidPayload)).toThrow();
  });
});
