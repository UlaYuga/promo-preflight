import { describe, it, expect } from 'vitest';
import { diffBlockers } from './DiffService';
import type { RunBlocker } from '../model/Run';

const b = (ruleId: string, severity: RunBlocker['severity'] = 'block'): RunBlocker => ({
  ruleId,
  severity,
  evidence: 'e',
  suggestion: 's',
});

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

  it('correctly classifies added, resolved, and unchanged', () => {
    const from = [b('keep'), b('gone')];
    const to = [b('keep'), b('new')];
    const result = diffBlockers(from, to);
    expect(result.unchanged.map((x) => x.ruleId)).toEqual(['keep']);
    expect(result.added.map((x) => x.ruleId)).toEqual(['new']);
    expect(result.resolved.map((x) => x.ruleId)).toEqual(['gone']);
  });

  it('returns empty diff for identical sets', () => {
    const blockers = [b('a'), b('b', 'warn')];
    const result = diffBlockers(blockers, blockers);
    expect(result.added).toHaveLength(0);
    expect(result.resolved).toHaveLength(0);
    expect(result.unchanged).toHaveLength(2);
  });
});
