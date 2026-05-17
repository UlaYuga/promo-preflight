import { randomUUID } from 'crypto';
import { runChecks } from '../../lib/checks/runner';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { Run, RunBlocker } from '../../domain/model/Run';
import type { ICheck } from '../../infrastructure/checks/ICheck';
import { ok } from '../bus/types';
import type { Result } from '../bus/types';
import type { PreflightException } from '../../domain/exception/PreflightException';
import { SystemException } from '../../domain/exception/PreflightException';

export interface RunChecksOptions {
  skipChecks?: string[];
}

export class RunChecksUseCase {
  constructor(
    private readonly newStyleChecks: ICheck[] = []
  ) {}

  async run(
    campaign: CampaignBundle,
    options: RunChecksOptions = {}
  ): Promise<Result<Run, PreflightException>> {
    const createdAt = new Date().toISOString();

    try {
      // Run legacy 8 checks from lib/checks/ — TODO(v2.1): migrate remaining 6 checks into infrastructure/checks/
      const report = runChecks({ bundle: campaign, mode: 'offline', generatedAt: createdAt });

      const legacyBlockers: RunBlocker[] = report.checkResults
        .filter((r) => !(options.skipChecks ?? []).includes(r.checkId))
        .flatMap((r) =>
          r.issues.map((issue) => ({
            ruleId: `${r.checkId}.${issue.issueId}`,
            severity: issue.blocker ? ('block' as const) : issue.severity === 'CRITICAL' ? ('block' as const) : ('warn' as const),
            evidence: issue.evidence.map((e) => `${e.field}: ${e.snippet}`).join('; '),
            suggestion: issue.suggestedFix,
            ownerHint: issue.ownerSuggestion,
          }))
        );

      // Run new-style ICheck implementations
      const newStyleResults = await Promise.all(
        this.newStyleChecks
          .filter((c) => !(options.skipChecks ?? []).includes(c.id))
          .map((c) => c.run(campaign))
      );
      const newStyleBlockers: RunBlocker[] = newStyleResults.flat();

      // The legacy lib runner and the new-style ICheck wrappers can execute
      // the same underlying rule module (e.g. format_qa), so an identical
      // finding may be emitted twice. Collapse byte-identical blockers — a
      // duplicate (same rule, severity, evidence, suggestion, owner) is never
      // a distinct finding. Keeps the first occurrence and preserves order.
      const seen = new Set<string>();
      const allBlockers = [...legacyBlockers, ...newStyleBlockers].filter(
        (b) => {
          const key = `${b.ruleId}|${b.severity}|${b.evidence}|${b.suggestion}|${b.ownerHint ?? ''}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        }
      );

      const verdict: Run['verdict'] =
        allBlockers.some((b) => b.severity === 'block')
          ? 'BLOCK'
          : allBlockers.some((b) => b.severity === 'warn')
          ? 'WARN'
          : 'GO';

      const run: Run = {
        id: randomUUID(),
        verdict,
        blockers: allBlockers,
        status: 'completed',
        createdAt,
        completedAt: new Date().toISOString(),
      };

      return ok(run);
    } catch (e) {
      if (e instanceof Error && 'code' in e) {
        return { ok: false, error: e as PreflightException };
      }
      return { ok: false, error: new SystemException(`RunChecks failed: ${e}`) };
    }
  }
}
