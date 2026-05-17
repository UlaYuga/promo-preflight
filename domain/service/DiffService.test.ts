import { describe, it, expect } from 'vitest';
import { diffBlockers } from './DiffService';
import type { RunBlocker } from '../model/Run';

type BlockerInput = {
  ruleId: string;
  severity?: RunBlocker['severity'];
  evidence?: string;
  suggestion?: string;
  ownerHint?: string;
};

const b = (
  input: string | BlockerInput,
  severityFromArgs?: RunBlocker['severity']
): RunBlocker => {
  const normalized: BlockerInput =
    typeof input === 'string'
      ? { ruleId: input, severity: severityFromArgs }
      : input;
  const severity = normalized.severity ?? 'block';

  return {
    ruleId: normalized.ruleId,
    severity,
    evidence: normalized.evidence ?? `evidence:${normalized.ruleId}`,
    suggestion: normalized.suggestion ?? `suggestion:${normalized.ruleId}`,
    ownerHint: normalized.ownerHint,
  };
};

describe('diffBlockers', () => {
  it('returns all added when from is empty', () => {
    const result = diffBlockers([], [b('a'), b('b')]);
    expect(result.added.map((x) => x.ruleId)).toEqual(['a', 'b']);
    expect(result.resolved).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
  });

  it('returns all resolved when to is empty', () => {
    const result = diffBlockers([b('a'), b('b')], []);
    expect(result.resolved.map((x) => x.ruleId)).toEqual(['a', 'b']);
    expect(result.added).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
  });

  it('returns empty arrays when both runs are empty', () => {
    const result = diffBlockers([], []);
    expect(result.added).toEqual([]);
    expect(result.resolved).toEqual([]);
    expect(result.unchanged).toEqual([]);
  });

  it('correctly classifies added, resolved, and unchanged', () => {
    const from = [b('keep'), b('gone')];
    const to = [b('keep'), b('new')];
    const result = diffBlockers(from, to);
    expect(result.unchanged.map((x) => x.ruleId)).toEqual(['keep']);
    expect(result.added.map((x) => x.ruleId)).toEqual(['new']);
    expect(result.resolved.map((x) => x.ruleId)).toEqual(['gone']);
  });

  it('returns unchanged for identical sets', () => {
    const blockers = [b('a'), b('b', 'warn')];
    const result = diffBlockers(blockers, blockers);
    expect(result.added).toHaveLength(0);
    expect(result.resolved).toHaveLength(0);
    expect(result.unchanged).toHaveLength(2);
  });

  it('treats same ruleId with different evidence as unchanged (ruleId-only identity)', () => {
    const from = [b({ ruleId: 'terms', evidence: 'old snippet' })];
    const to = [b({ ruleId: 'terms', evidence: 'new snippet' })];
    const result = diffBlockers(from, to);
    expect(result.unchanged).toEqual(to);
    expect(result.added).toEqual([]);
    expect(result.resolved).toEqual([]);
  });

  it('treats same ruleId and same evidence as unchanged', () => {
    const blocker = b({ ruleId: 'geo', evidence: 'country missing' });
    const result = diffBlockers([blocker], [blocker]);
    expect(result.unchanged).toEqual([blocker]);
    expect(result.added).toEqual([]);
    expect(result.resolved).toEqual([]);
  });

  it('treats same ruleId with severity changes as unchanged', () => {
    const from = [b({ ruleId: 'risk', severity: 'warn' })];
    const to = [b({ ruleId: 'risk', severity: 'block' })];
    const result = diffBlockers(from, to);
    expect(result.unchanged).toEqual(to);
    expect(result.added).toEqual([]);
    expect(result.resolved).toEqual([]);
  });

  it('ignores ownerHint and suggestion differences for the same ruleId', () => {
    const from = [
      b({
        ruleId: 'links',
        suggestion: 'Ask CRM',
        ownerHint: 'crm',
      }),
    ];
    const to = [
      b({
        ruleId: 'links',
        suggestion: 'Ask analytics',
        ownerHint: 'analytics',
      }),
    ];
    const result = diffBlockers(from, to);
    expect(result.unchanged).toEqual(to);
    expect(result.added).toEqual([]);
    expect(result.resolved).toEqual([]);
  });

  it('handles mixed overlap with 10+ blockers and exact counts', () => {
    const from = [
      b({ ruleId: 'r1' }),
      b({ ruleId: 'r2' }),
      b({ ruleId: 'r3' }),
      b({ ruleId: 'r4' }),
      b({ ruleId: 'r5' }),
      b({ ruleId: 'r6' }),
      b({ ruleId: 'r7' }),
      b({ ruleId: 'r8' }),
      b({ ruleId: 'r9' }),
      b({ ruleId: 'r10' }),
      b({ ruleId: 'r11' }),
      b({ ruleId: 'r12' }),
    ];
    const to = [
      b({ ruleId: 'r3' }),
      b({ ruleId: 'r4' }),
      b({ ruleId: 'r5' }),
      b({ ruleId: 'r6' }),
      b({ ruleId: 'r7' }),
      b({ ruleId: 'r8' }),
      b({ ruleId: 'r13' }),
      b({ ruleId: 'r14' }),
      b({ ruleId: 'r15' }),
      b({ ruleId: 'r16' }),
      b({ ruleId: 'r17' }),
    ];
    const result = diffBlockers(from, to);
    expect(result.unchanged.map((x) => x.ruleId)).toEqual([
      'r3',
      'r4',
      'r5',
      'r6',
      'r7',
      'r8',
    ]);
    expect(result.resolved.map((x) => x.ruleId)).toEqual([
      'r1',
      'r2',
      'r9',
      'r10',
      'r11',
      'r12',
    ]);
    expect(result.added.map((x) => x.ruleId)).toEqual([
      'r13',
      'r14',
      'r15',
      'r16',
      'r17',
    ]);
  });

  it('collapses duplicate ruleIds in from run (map last-write-wins)', () => {
    const from = [
      b({ ruleId: 'dup', evidence: 'first from' }),
      b({ ruleId: 'dup', evidence: 'second from' }),
    ];
    const result = diffBlockers(from, []);
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0]).toEqual(b({ ruleId: 'dup', evidence: 'second from' }));
  });

  it('collapses duplicate ruleIds in to run and keeps the last unchanged value', () => {
    const to = [
      b({ ruleId: 'dup', evidence: 'first to' }),
      b({ ruleId: 'dup', evidence: 'second to' }),
    ];
    const result = diffBlockers([b({ ruleId: 'dup', evidence: 'from' })], to);
    expect(result.unchanged).toHaveLength(1);
    expect(result.unchanged[0]).toEqual(b({ ruleId: 'dup', evidence: 'second to' }));
    expect(result.added).toEqual([]);
    expect(result.resolved).toEqual([]);
  });
});
