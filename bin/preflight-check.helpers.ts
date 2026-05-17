import type { Run, RunBlocker } from '../domain/model/Run';

export const EXIT_CODE = {
  GO: 0,
  WARN: 1,
  BLOCK: 2,
  INVALID_INPUT: 3,
  INTERNAL_ERROR: 4,
} as const;

export type CliFormat = 'json' | 'human';

export interface CliOptions {
  file?: string;
  format: CliFormat;
}

export interface RunSummary {
  verdict: Run['verdict'];
  counts: {
    blockers: number;
    warnings: number;
    info: number;
    total: number;
  };
  blockers: RunBlocker[];
}

export function parseCliOptions(values: { file?: string; format?: string }): CliOptions {
  const format = values.format ?? 'json';
  if (format !== 'json' && format !== 'human') {
    throw new Error(`Invalid --format value: "${format}". Use "json" or "human".`);
  }

  const file = values.file?.trim();
  if (file === '') {
    throw new Error('Invalid --file value: path must not be empty.');
  }

  return {
    file,
    format,
  };
}

export function summarizeRun(run: Run): RunSummary {
  let blockers = 0;
  let warnings = 0;
  let info = 0;

  for (const blocker of run.blockers) {
    if (blocker.severity === 'block') {
      blockers += 1;
    } else if (blocker.severity === 'warn') {
      warnings += 1;
    } else {
      info += 1;
    }
  }

  return {
    verdict: run.verdict,
    counts: {
      blockers,
      warnings,
      info,
      total: run.blockers.length,
    },
    blockers: run.blockers,
  };
}

export function formatHumanSummary(summary: RunSummary): string {
  const lines: string[] = [];

  lines.push(`Verdict: ${summary.verdict}`);
  lines.push(
    `Counts: blockers=${summary.counts.blockers}, warnings=${summary.counts.warnings}, info=${summary.counts.info}, total=${summary.counts.total}`
  );

  if (summary.blockers.length === 0) {
    lines.push('No findings.');
    return lines.join('\n');
  }

  lines.push('Findings:');
  for (const finding of summary.blockers) {
    lines.push(
      `- [${finding.severity}] ${finding.ruleId}: ${finding.suggestion} (evidence: ${finding.evidence})`
    );
  }

  return lines.join('\n');
}

export function exitCodeForVerdict(verdict: Run['verdict']): number {
  if (verdict === 'GO') return EXIT_CODE.GO;
  if (verdict === 'WARN') return EXIT_CODE.WARN;
  return EXIT_CODE.BLOCK;
}
