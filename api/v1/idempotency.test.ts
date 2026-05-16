import { describe, it, expect } from 'vitest';
import { hashBody } from './index';

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
    const body = { campaign: { x: 1 }, options: { skipChecks: [] } };
    const copy = JSON.parse(JSON.stringify(body)) as unknown;
    expect(hashBody(body)).toBe(hashBody(copy));
  });
});
