import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

const POLICY_RULE_VERSIONS = {
  paymentCompatibility: 1,
  cryptoDisclosure: 2,
  jurisdictionalRisk: 3,
};

vi.mock('../../../../../../infrastructure/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock('../../../../../../infrastructure/persistence/CampaignRepository', () => ({
  CampaignRepository: class {
    async findById(id: string) {
      return {
        id,
        campaignName: 'Campaign',
        operatorLabel: 'Ops',
        promoType: 'welcome',
        geo: 'UK',
        locale: 'en-GB',
        currency: 'GBP',
        launchDate: null,
        createdAt: '2026-05-25T12:00:00.000Z',
      };
    }

    async listVersions(id: string) {
      return [
        {
          id: 'version-1',
          campaignId: id,
          n: 1,
          createdAt: '2026-05-25T12:00:00.000Z',
          blockers: [],
          readinessState: 'READY',
          runId: 'run-1',
          policyRuleVersions: POLICY_RULE_VERSIONS,
        },
      ];
    }
  },
}));

describe('GET /api/v1/campaigns/:id/versions', () => {
  it('returns persisted policy provenance for each saved campaign version', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/v1/campaigns/campaign-1/versions'),
      { params: Promise.resolve({ id: 'campaign-1' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      campaignId: 'campaign-1',
      versions: [
        {
          runId: 'run-1',
          policyRuleVersions: POLICY_RULE_VERSIONS,
        },
      ],
    });
  });
});
