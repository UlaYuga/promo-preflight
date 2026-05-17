import {
  type PreflightEvent,
  PreflightEventSchema,
} from '../domain/event/PreflightEvent';

const occurredAt = new Date().toISOString();

const events: PreflightEvent[] = [
  {
    id: 'evt-demo-1',
    type: 'RunStarted',
    occurredAt,
    runId: 'run-demo-1',
    campaignId: 'campaign-demo-1',
    versionId: 'v1',
  },
  {
    id: 'evt-demo-2',
    type: 'BlockerRaised',
    occurredAt,
    runId: 'run-demo-1',
    ruleId: 'payment-compat-001',
    severity: 'block',
    ownerHint: 'risk',
  },
  {
    id: 'evt-demo-3',
    type: 'BlockerResolved',
    occurredAt,
    runId: 'run-demo-1',
    ruleId: 'payment-compat-001',
    resolvedBy: 'qa-owner',
  },
  {
    id: 'evt-demo-4',
    type: 'RunCompleted',
    occurredAt,
    runId: 'run-demo-1',
    verdict: 'WARN',
    counts: {
      blockers: 1,
      warnings: 2,
      passed: 8,
    },
  },
  {
    id: 'evt-demo-5',
    type: 'OwnerOverridden',
    occurredAt,
    runId: 'run-demo-1',
    ruleId: 'payment-compat-001',
    fromOwner: 'ops',
    toOwner: 'risk',
  },
  {
    id: 'evt-demo-6',
    type: 'VersionDiffed',
    occurredAt,
    campaignId: 'campaign-demo-1',
    fromVersion: 1,
    toVersion: 2,
    counts: {
      resolved: 3,
      new: 1,
      stillOpen: 2,
    },
  },
];

const parsedEvents = events.map((event) => PreflightEventSchema.parse(event));
console.log(JSON.stringify(parsedEvents, null, 2));
