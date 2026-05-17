import type { RunBlocker } from '../model/Run';

export interface BlockerDiff {
  added: RunBlocker[];
  resolved: RunBlocker[];
  unchanged: RunBlocker[];
}

/**
 * Pure function: computes the diff of blockers between two campaign versions.
 * Blockers are keyed by ruleId.
 */
export function diffBlockers(from: RunBlocker[], to: RunBlocker[]): BlockerDiff {
  const fromMap = new Map(from.map((b) => [b.ruleId, b]));
  const toMap = new Map(to.map((b) => [b.ruleId, b]));

  const added: RunBlocker[] = [];
  const resolved: RunBlocker[] = [];
  const unchanged: RunBlocker[] = [];

  for (const [ruleId, blocker] of toMap) {
    if (fromMap.has(ruleId)) {
      unchanged.push(blocker);
    } else {
      added.push(blocker);
    }
  }

  for (const [ruleId, blocker] of fromMap) {
    if (!toMap.has(ruleId)) {
      resolved.push(blocker);
    }
  }

  return { added, resolved, unchanged };
}
