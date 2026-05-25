import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getDb } from '../../../../infrastructure/db/client';
import { POST } from './route';
import { idempotencyKeys } from '../../../../infrastructure/db/schema';
import { hashBody } from '../../../../api/v1/index';

const VALID_IDEMPOTENCY_KEY = '2a099960-d864-4d93-954f-1886bd5e980c';

const VALID_REPLAY_SNAPSHOT = {
  runId: 'run-1',
  verdict: 'GO',
  status: 'completed',
  counts: { block: 0, warn: 0, info: 0 },
  blockers: [],
  createdAt: '2026-05-25T12:00:00.000Z',
  completedAt: '2026-05-25T12:00:01.000Z',
  policyRuleVersions: {
    paymentCompatibility: 4,
    cryptoDisclosure: 5,
    jurisdictionalRisk: 6,
  },
};

const REPLAY_BODY = {
  campaign: {
    metadata: {
      campaignName: 'Replay fixture',
      promoType: 'welcome',
      geo: 'UK',
      locale: 'en-GB',
      currency: 'GBP',
      channelsIncluded: ['email'],
    },
    offer: {},
    assets: [],
    links: [],
    owners: [],
    termsText: 'Play responsibly. 18+ only.',
    targetJurisdiction: ['UK'],
  },
};

function mockCompletedIdempotencySnapshot(snapshot: unknown): string {
  const requestText = JSON.stringify(REPLAY_BODY);
  const db = {
    select: () => ({
      from: (table: unknown) => {
        expect(table).toBe(idempotencyKeys);
        return {
          where: () => ({
            limit: async () => [
              {
                requestHash: hashBody(REPLAY_BODY),
                status: 'completed',
                responseSnapshot: snapshot,
              },
            ],
          }),
        };
      },
    }),
  };
  vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
  process.env.RUNTIME_POLICY_RULES_DIR = '/path/that/does/not/exist';
  return requestText;
}

vi.mock('../../../../infrastructure/db/client', () => ({
  getDb: vi.fn(() => {
    throw new Error('getDb must not be called for rejected requests');
  }),
}));

describe('POST /api/v1/runs request boundary', () => {
  const previousMaxInputChars = process.env.MAX_INPUT_CHARS;
  const previousRuntimePolicyRulesDir = process.env.RUNTIME_POLICY_RULES_DIR;

  afterEach(() => {
    vi.mocked(getDb).mockClear();
    if (previousMaxInputChars === undefined) {
      delete process.env.MAX_INPUT_CHARS;
    } else {
      process.env.MAX_INPUT_CHARS = previousMaxInputChars;
    }
    if (previousRuntimePolicyRulesDir === undefined) {
      delete process.env.RUNTIME_POLICY_RULES_DIR;
    } else {
      process.env.RUNTIME_POLICY_RULES_DIR = previousRuntimePolicyRulesDir;
    }
  });

  it('rejects an oversized request before validating or executing its campaign', async () => {
    process.env.MAX_INPUT_CHARS = '20';
    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': VALID_IDEMPOTENCY_KEY },
        body: JSON.stringify({ invalid: 'this body is deliberately oversized' }),
      })
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: 'PAYLOAD_TOO_LARGE',
    });
  });

  it('rejects a non-UUID Idempotency-Key', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'arbitrary-long-idempotency-key' },
        body: '{}',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'BAD_REQUEST',
      message: 'Idempotency-Key must be a UUID',
    });
  });

  it('allows a UUID Idempotency-Key through header validation', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': VALID_IDEMPOTENCY_KEY },
        body: '{}',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'BAD_REQUEST',
      message: expect.stringContaining('Invalid request body'),
    });
  });

  it('rejects skipChecks before executing checks or writing to the database', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': VALID_IDEMPOTENCY_KEY },
        body: JSON.stringify({
          campaign: {
            metadata: {
              campaignName: 'Mandatory checks contract',
              promoType: 'welcome',
              geo: 'UK',
              locale: 'en-GB',
              currency: 'GBP',
              channelsIncluded: ['email'],
            },
            offer: {},
            assets: [],
            links: [],
            owners: [],
            termsText: 'Play responsibly. 18+ only.',
            targetJurisdiction: ['UK'],
          },
          options: { skipChecks: ['terms_robustness'] },
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'BAD_REQUEST',
      message: expect.stringContaining('skipChecks'),
    });
    expect(getDb).not.toHaveBeenCalled();
  });

  it('replays a completed idempotency snapshot before loading runtime policy YAML', async () => {
    const requestText = mockCompletedIdempotencySnapshot(VALID_REPLAY_SNAPSHOT);

    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': VALID_IDEMPOTENCY_KEY },
        body: requestText,
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(VALID_REPLAY_SNAPSHOT);
  });

  it('fails closed instead of fabricating policy versions for a replay snapshot missing provenance', async () => {
    const legacySnapshot: Record<string, unknown> = { ...VALID_REPLAY_SNAPSHOT };
    delete legacySnapshot.policyRuleVersions;
    const requestText = mockCompletedIdempotencySnapshot(legacySnapshot);

    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': VALID_IDEMPOTENCY_KEY },
        body: requestText,
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: 'SYSTEM_ERROR',
      message: expect.stringContaining('Invalid idempotency response snapshot'),
    });
  });

  it('fails closed instead of returning a replay snapshot with invalid policy versions', async () => {
    const requestText = mockCompletedIdempotencySnapshot({
      ...VALID_REPLAY_SNAPSHOT,
      policyRuleVersions: {
        paymentCompatibility: 0,
        cryptoDisclosure: 5,
        jurisdictionalRisk: 6,
      },
    });

    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': VALID_IDEMPOTENCY_KEY },
        body: requestText,
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: 'SYSTEM_ERROR',
      message: expect.stringContaining('Invalid idempotency response snapshot'),
    });
  });
});
