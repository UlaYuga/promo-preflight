import { describe, it, expect } from 'vitest';
import { hashBody, RunsPostBodySchema } from './index';

describe('hashBody', () => {
  it('produces the same hash for the same body', () => {
    const body = { campaign: { metadata: { campaignName: 'Test' } } };
    expect(hashBody(body)).toBe(hashBody(body));
  });

  it('produces different hashes for different bodies', () => {
    const a = { campaign: { metadata: { campaignName: 'A' } } };
    const b = { campaign: { metadata: { campaignName: 'B' } } };
    expect(hashBody(a)).not.toBe(hashBody(b));
  });

  it('is stable across re-serialization of same object', () => {
    const body = { campaign: { x: 1 } };
    const copy = JSON.parse(JSON.stringify(body)) as unknown;
    expect(hashBody(body)).toBe(hashBody(copy));
  });
});

describe('RunsPostBodySchema', () => {
  it('rejects client options that attempt to exclude mandatory checks', () => {
    const parsed = RunsPostBodySchema.safeParse({
      campaign: {},
      options: { skipChecks: ['terms_robustness'] },
    });

    expect(parsed.success).toBe(false);
  });
});
