import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

const POLICY_RULE_VERSIONS = {
  paymentCompatibility: 1,
  cryptoDisclosure: 2,
  jurisdictionalRisk: 3,
};

vi.mock('../../../../../infrastructure/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock('../../../../../infrastructure/persistence/RunRepository', () => ({
  RunRepository: class {
    async findById(id: string) {
      return {
        id,
        campaignId: 'campaign-1',
        version: 7,
        verdict: 'GO',
        status: 'completed',
        blockers: [],
        createdAt: '2026-05-25T12:00:00.000Z',
        completedAt: '2026-05-25T12:00:01.000Z',
        policyRuleVersions: POLICY_RULE_VERSIONS,
      };
    }
  },
}));

describe('GET /api/v1/runs/:id', () => {
  it('returns persisted policy provenance with the historical run', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/v1/runs/run-1'),
      { params: Promise.resolve({ id: 'run-1' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      runId: 'run-1',
      policyRuleVersions: POLICY_RULE_VERSIONS,
    });
  });
});
