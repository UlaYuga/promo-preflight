import { describe, expect, it } from 'vitest';
import { RunResponseSchema } from './index';

describe('RunResponseSchema policy provenance contract', () => {
  it('requires policyRuleVersions for the mandatory runtime policy artifacts', () => {
    const parsed = RunResponseSchema.safeParse({
      runId: 'run-1',
      verdict: 'GO',
      status: 'completed',
      counts: { block: 0, warn: 0, info: 0 },
      blockers: [],
      createdAt: '2026-05-25T12:00:00.000Z',
      completedAt: '2026-05-25T12:00:01.000Z',
      policyRuleVersions: {
        paymentCompatibility: 1,
        cryptoDisclosure: 1,
        jurisdictionalRisk: 1,
      },
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects a run response that drops policy provenance', () => {
    const parsed = RunResponseSchema.safeParse({
      runId: 'run-1',
      verdict: 'GO',
      status: 'completed',
      counts: { block: 0, warn: 0, info: 0 },
      blockers: [],
      createdAt: '2026-05-25T12:00:00.000Z',
      completedAt: '2026-05-25T12:00:01.000Z',
    });

    expect(parsed.success).toBe(false);
  });
});
