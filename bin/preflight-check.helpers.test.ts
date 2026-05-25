import { describe, expect, it } from 'vitest';
import {
  exitCodeForVerdict,
  formatHumanSummary,
  parseCliOptions,
  summarizeRun,
} from './preflight-check.helpers';
import type { Run } from '../domain/model/Run';

describe('parseCliOptions', () => {
  it('defaults format to json', () => {
    expect(parseCliOptions({})).toEqual({ format: 'json', file: undefined });
  });

  it('accepts explicit human format and trims file path', () => {
    expect(parseCliOptions({ format: 'human', file: ' ./campaign.json ' })).toEqual({
      format: 'human',
      file: './campaign.json',
    });
  });

  it('throws on unsupported format', () => {
    expect(() => parseCliOptions({ format: 'yaml' })).toThrow(
      'Invalid --format value: "yaml". Use "json" or "human".'
    );
  });

  it('throws on empty file path', () => {
    expect(() => parseCliOptions({ file: '   ' })).toThrow(
      'Invalid --file value: path must not be empty.'
    );
  });
});

describe('run summary formatting', () => {
  const run: Run = {
    id: 'run-1',
    verdict: 'BLOCK',
    status: 'completed',
    createdAt: '2026-05-17T00:00:00.000Z',
    completedAt: '2026-05-17T00:00:01.000Z',
    policyRuleVersions: {
      paymentCompatibility: 1,
      cryptoDisclosure: 1,
      jurisdictionalRisk: 1,
    },
    blockers: [
      {
        ruleId: 'rule.block',
        severity: 'block',
        evidence: 'missing clause',
        suggestion: 'add clause',
      },
      {
        ruleId: 'rule.warn',
        severity: 'warn',
        evidence: 'risky wording',
        suggestion: 'rewrite copy',
      },
      {
        ruleId: 'rule.info',
        severity: 'info',
        evidence: 'nice-to-have',
        suggestion: 'consider update',
      },
    ],
  };

  it('summarizes counts from blockers list', () => {
    expect(summarizeRun(run)).toEqual({
      verdict: 'BLOCK',
      counts: {
        blockers: 1,
        warnings: 1,
        info: 1,
        total: 3,
      },
      blockers: run.blockers,
    });
  });

  it('formats human summary with findings', () => {
    const output = formatHumanSummary(summarizeRun(run));
    expect(output).toContain('Verdict: BLOCK');
    expect(output).toContain('Counts: blockers=1, warnings=1, info=1, total=3');
    expect(output).toContain('- [block] rule.block: add clause (evidence: missing clause)');
  });

  it('formats no findings state', () => {
    const output = formatHumanSummary(
      summarizeRun({ ...run, verdict: 'GO', blockers: [] })
    );
    expect(output).toContain('Verdict: GO');
    expect(output).toContain('No findings.');
  });
});

describe('exitCodeForVerdict', () => {
  it('maps verdicts to expected exit codes', () => {
    expect(exitCodeForVerdict('GO')).toBe(0);
    expect(exitCodeForVerdict('WARN')).toBe(1);
    expect(exitCodeForVerdict('BLOCK')).toBe(2);
  });
});
