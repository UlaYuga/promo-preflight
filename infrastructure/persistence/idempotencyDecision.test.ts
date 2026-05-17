import { describe, it, expect } from 'vitest';
import { decideIdempotency } from './idempotencyDecision';

const HASH = 'abc123';
const OTHER_HASH = 'def456';
const SNAPSHOT = { runId: 'r1', verdict: 'GO' };

describe('decideIdempotency', () => {
  describe('when INSERT succeeded (claimedCount > 0)', () => {
    it('returns claimed', () => {
      expect(decideIdempotency(1, null, HASH)).toEqual({ type: 'claimed' });
    });

    it('ignores existing row and hash when claimed', () => {
      const row = { requestHash: OTHER_HASH, status: 'completed', responseSnapshot: SNAPSHOT };
      expect(decideIdempotency(1, row, HASH)).toEqual({ type: 'claimed' });
    });
  });

  describe('when INSERT conflicted (claimedCount === 0)', () => {
    it('returns in_progress when existing row is null (key disappeared)', () => {
      expect(decideIdempotency(0, null, HASH)).toEqual({ type: 'in_progress' });
    });

    it('returns conflict when request hash differs', () => {
      const row = { requestHash: OTHER_HASH, status: 'completed', responseSnapshot: SNAPSHOT };
      expect(decideIdempotency(0, row, HASH)).toEqual({ type: 'conflict' });
    });

    it('returns replay with stored snapshot when hash matches and status is completed', () => {
      const row = { requestHash: HASH, status: 'completed', responseSnapshot: SNAPSHOT };
      expect(decideIdempotency(0, row, HASH)).toEqual({
        type: 'replay',
        responseBody: SNAPSHOT,
      });
    });

    it('returns in_progress when hash matches but status is pending', () => {
      const row = { requestHash: HASH, status: 'pending', responseSnapshot: {} };
      expect(decideIdempotency(0, row, HASH)).toEqual({ type: 'in_progress' });
    });

    it('returns in_progress for any unknown status value', () => {
      const row = { requestHash: HASH, status: 'unknown_future_state', responseSnapshot: {} };
      expect(decideIdempotency(0, row, HASH)).toEqual({ type: 'in_progress' });
    });
  });

  describe('same-key / same-hash idempotency contract', () => {
    it('always replays when completed, regardless of snapshot content', () => {
      const complexSnapshot = { runId: 'x', counts: { block: 3 }, blockers: [{ ruleId: 'r' }] };
      const row = { requestHash: HASH, status: 'completed', responseSnapshot: complexSnapshot };
      const result = decideIdempotency(0, row, HASH);
      expect(result).toEqual({ type: 'replay', responseBody: complexSnapshot });
    });
  });
});
