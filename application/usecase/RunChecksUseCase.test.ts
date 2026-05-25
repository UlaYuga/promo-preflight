import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { RunChecksUseCase } from './RunChecksUseCase';
import type { RunChecksCommand } from '../command/RunChecksCommand';
import type { CampaignBundle } from '../../domain/model/Campaign';
import type { RunBlocker } from '../../domain/model/Run';
import type { ICheck } from '../../infrastructure/checks/ICheck';
import { SystemException } from '../../domain/exception/PreflightException';

const CLEAN_CAMPAIGN: CampaignBundle = {
  metadata: {
    campaignName: 'Clean orchestration fixture',
    operatorLabel: 'Ops',
    promoType: 'welcome',
    geo: 'MGA generic',
    locale: 'en-GB',
    currency: 'GBP',
    channelsIncluded: ['email'],
  },
  offer: {
    minDeposit: 20,
    bonusPercentage: 100,
    maxBonus: 200,
    wageringRequirement: '20x bonus amount',
    maxBet: 5,
    eligibleGames: 'Slots only',
    contribution: 'Slots contribute 100%',
    cooldown: 'Once per week',
    eligibilityRules: 'New users only',
  },
  termsText:
    'New users only. Wagering 20x bonus amount. Max bet applies. Valid until June 30 2026. ' +
    'One per household and one per IP and one per payment. Eligible games: slots only. ' +
    'Contribution is 100%. Cooldown once per week. Play responsibly, 18+ only. Withdrawal subject to policy.',
  assets: [],
  links: [],
  owners: [
    { role: 'product', status: 'approved' },
    { role: 'crm', status: 'approved' },
    { role: 'legal', status: 'approved' },
    { role: 'risk', status: 'approved' },
    { role: 'localization', status: 'approved' },
    { role: 'analytics', status: 'approved' },
  ],
  targetJurisdiction: ['UK'],
  paymentMethods: ['debit_card'],
};

function makeCheck(id: string, blockers: RunBlocker[]): ICheck {
  return {
    id,
    run: vi.fn(async () => blockers),
  };
}

function makeLegacyBlockingCampaign(): CampaignBundle {
  return {
    ...CLEAN_CAMPAIGN,
    termsText:
      'Wagering 20x bonus amount. Max bet applies. Valid until June 30 2026. ' +
      'Play responsibly, 18+ only. Withdrawal subject to policy.',
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('RunChecksUseCase', () => {
  it('returns GO for a clean campaign when there are no new-style issues', async () => {
    const useCase = new RunChecksUseCase([]);
    const result = await useCase.run(CLEAN_CAMPAIGN);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verdict).toBe('GO');
    expect(result.value.blockers).toHaveLength(0);
  });

  it('returns legacy-only WARN when campaign has legacy warnings without new-style checks', async () => {
    const useCase = new RunChecksUseCase([]);
    const result = await useCase.run(makeLegacyBlockingCampaign());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verdict).toBe('WARN');
    expect(result.value.blockers.some((b) => b.ruleId.startsWith('terms_robustness.'))).toBe(true);
  });

  it('returns BLOCK when a new-style check returns a block issue', async () => {
    const useCase = new RunChecksUseCase([
      makeCheck('new-block', [
        {
          ruleId: 'new.block',
          severity: 'block',
          evidence: 'block evidence',
          suggestion: 'fix block',
          ownerHint: 'risk',
        },
      ]),
    ]);
    const result = await useCase.run(CLEAN_CAMPAIGN);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verdict).toBe('BLOCK');
  });

  it('returns WARN when only new-style warn issues exist', async () => {
    const useCase = new RunChecksUseCase([
      makeCheck('new-warn', [
        {
          ruleId: 'new.warn',
          severity: 'warn',
          evidence: 'warn evidence',
          suggestion: 'fix warn',
          ownerHint: 'crm',
        },
      ]),
    ]);
    const result = await useCase.run(CLEAN_CAMPAIGN);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verdict).toBe('WARN');
  });

  it('returns BLOCK when both new-style block and warn issues are present', async () => {
    const useCase = new RunChecksUseCase([
      makeCheck('new-mixed', [
        {
          ruleId: 'new.block',
          severity: 'block',
          evidence: 'block evidence',
          suggestion: 'fix block',
          ownerHint: 'legal',
        },
        {
          ruleId: 'new.warn',
          severity: 'warn',
          evidence: 'warn evidence',
          suggestion: 'fix warn',
          ownerHint: 'product',
        },
      ]),
    ]);
    const result = await useCase.run(CLEAN_CAMPAIGN);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verdict).toBe('BLOCK');
  });

  it('executes mandatory supplemental checks without an exclusion contract', async () => {
    type CommandHasOptions = 'options' extends keyof RunChecksCommand ? true : false;
    expectTypeOf<CommandHasOptions>().toEqualTypeOf<false>();
    expectTypeOf<Parameters<RunChecksUseCase['run']>>().toEqualTypeOf<
      [campaign: CampaignBundle]
    >();

    const supplementalCheck = makeCheck('payment_compat', [
      {
        ruleId: 'payment_compat.mandatory',
        severity: 'block',
        evidence: 'block evidence',
        suggestion: 'fix block',
        ownerHint: 'risk',
      },
    ]);
    const useCase = new RunChecksUseCase([
      supplementalCheck,
    ]);
    const result = await useCase.run(CLEAN_CAMPAIGN);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(supplementalCheck.run).toHaveBeenCalledTimes(1);
    expect(result.value.verdict).toBe('BLOCK');
    expect(result.value.blockers.some((b) => b.ruleId === 'payment_compat.mandatory')).toBe(true);
  });

  it('includes mandatory legacy check findings in a run', async () => {
    const useCase = new RunChecksUseCase([]);
    const result = await useCase.run(makeLegacyBlockingCampaign());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verdict).toBe('WARN');
    expect(result.value.blockers.some((b) => b.ruleId.startsWith('terms_robustness.'))).toBe(true);
  });

  it('executes all new-style checks once for a single run', async () => {
    const started: string[] = [];
    const first = deferred<RunBlocker[]>();

    const slowCheck: ICheck = {
      id: 'slow',
      run: vi.fn(async () => {
        started.push('slow');
        return first.promise;
      }),
    };
    const fastCheck: ICheck = {
      id: 'fast',
      run: vi.fn(async () => {
        started.push('fast');
        return [];
      }),
    };

    const useCase = new RunChecksUseCase([slowCheck, fastCheck]);
    const runPromise = useCase.run(CLEAN_CAMPAIGN);
    await Promise.resolve();

    expect(started).toEqual(['slow', 'fast']);
    expect(slowCheck.run).toHaveBeenCalledTimes(1);
    expect(fastCheck.run).toHaveBeenCalledTimes(1);

    first.resolve([]);
    const result = await runPromise;
    expect(result.ok).toBe(true);
  });

  it('wraps unexpected new-style check errors into SystemException result', async () => {
    const throwingCheck: ICheck = {
      id: 'throws',
      run: vi.fn(async () => {
        throw new Error('unexpected failure');
      }),
    };
    const useCase = new RunChecksUseCase([throwingCheck]);
    const result = await useCase.run(CLEAN_CAMPAIGN);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(SystemException);
    expect(result.error.message).toContain('RunChecks failed: Error: unexpected failure');
  });

  it('returns completed run metadata with id, createdAt, completedAt, and status', async () => {
    const useCase = new RunChecksUseCase([]);
    const result = await useCase.run(CLEAN_CAMPAIGN);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(result.value.status).toBe('completed');
    expect(Number.isNaN(Date.parse(result.value.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(result.value.completedAt ?? ''))).toBe(false);
  });

  it('preserves new-style blocker mapping fields exactly', async () => {
    const blocker: RunBlocker = {
      ruleId: 'rule-123',
      severity: 'warn',
      evidence: 'evidence body',
      suggestion: 'suggestion body',
      ownerHint: 'analytics',
    };
    const useCase = new RunChecksUseCase([makeCheck('mapper', [blocker])]);
    const result = await useCase.run(CLEAN_CAMPAIGN);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.blockers).toContainEqual(blocker);
  });
});
