import { describe, it, expect } from 'vitest';
import { Bus } from '../../../application/bus/Bus';
import { HandlerRegistry } from '../../../application/bus/HandlerRegistry';
import { handler as runChecksHandler } from './RunChecksHandler';
import type { RunChecksCommand } from '../../../application/command/RunChecksCommand';
import type { Run } from '../../../domain/model/Run';
import type { CampaignBundleInput } from '../../../schemas/index';

function makeBus(): Bus {
  const registry = new HandlerRegistry();
  registry.register(runChecksHandler);
  return new Bus(registry);
}

const BASE_CAMPAIGN: CampaignBundleInput = {
  metadata: {
    campaignName: 'Integration test campaign',
    promoType: 'welcome',
    geo: 'UK',
    locale: 'en-GB',
    currency: 'GBP',
    channelsIncluded: ['email'],
  },
  offer: { bonusPercentage: 100, maxBonus: 200, wageringRequirement: '35x bonus', maxBet: 5 },
  termsText: '18+. BeGambleAware.org. Terms apply. Wagering 35x on bonus.',
  assets: [],
  links: [],
  owners: [],
};

describe('RunChecksHandler integration (Bus.dispatch → new-style checks)', () => {
  it('dispatches RunChecksCommand and returns a Run with correct shape', async () => {
    const bus = makeBus();
    const result = await bus.dispatch<Run>({
      type: 'RunChecks',
      campaign: BASE_CAMPAIGN as RunChecksCommand['campaign'],
    } as RunChecksCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('completed');
    expect(result.value.verdict).toMatch(/^(GO|WARN|BLOCK)$/);
    expect(Array.isArray(result.value.blockers)).toBe(true);
  });

  it('payment_compat: UK campaign with forbidden credit_card → BLOCK via Bus', async () => {
    const bus = makeBus();
    const result = await bus.dispatch<Run>({
      type: 'RunChecks',
      campaign: {
        ...BASE_CAMPAIGN,
        targetJurisdiction: ['UK'],
        paymentMethods: ['credit_card'],
      } as RunChecksCommand['campaign'],
    } as RunChecksCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const paymentBlocks = result.value.blockers.filter(
      (b) => b.ruleId === 'payment-compat-001' && b.severity === 'block'
    );
    expect(paymentBlocks.length).toBeGreaterThan(0);
    expect(paymentBlocks[0].evidence).toContain('credit_card');
  });

  it('crypto_disclosure: AL campaign with BTC mention → BLOCK via Bus', async () => {
    const bus = makeBus();
    const result = await bus.dispatch<Run>({
      type: 'RunChecks',
      campaign: {
        ...BASE_CAMPAIGN,
        targetJurisdiction: ['AL'],
        termsText: 'Pay via BTC or bank transfer. 18+.',
      } as RunChecksCommand['campaign'],
    } as RunChecksCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cryptoBlocks = result.value.blockers.filter(
      (b) => b.ruleId === 'crypto-disclosure-001' && b.severity === 'block'
    );
    expect(cryptoBlocks.length).toBeGreaterThan(0);
    expect(cryptoBlocks[0].evidence).toContain('AL');
  });

  it('jurisdictional_risk: UK campaign with "risk-free" phrase → BLOCK via Bus', async () => {
    const bus = makeBus();
    const result = await bus.dispatch<Run>({
      type: 'RunChecks',
      campaign: {
        ...BASE_CAMPAIGN,
        targetJurisdiction: ['UK'],
        termsText: 'Risk-free welcome bonus. 18+. BeGambleAware.org.',
      } as RunChecksCommand['campaign'],
    } as RunChecksCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const phraseBlocks = result.value.blockers.filter(
      (b) => b.ruleId === 'juris-risk-forbidden-UK' && b.severity === 'block'
    );
    expect(phraseBlocks.length).toBeGreaterThan(0);
    expect(phraseBlocks[0].evidence).toContain('risk-free');
  });

  it('clean campaign produces verdict GO or WARN (no new-style blocks)', async () => {
    const bus = makeBus();
    const result = await bus.dispatch<Run>({
      type: 'RunChecks',
      campaign: {
        ...BASE_CAMPAIGN,
        targetJurisdiction: ['UK'],
        paymentMethods: ['debit_card'],
        termsText: '18+. BeGambleAware.org. Wagering 35x. Max bet £5 during bonus.',
      } as RunChecksCommand['campaign'],
    } as RunChecksCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const newStyleBlocks = result.value.blockers.filter(
      (b) =>
        b.severity === 'block' &&
        (b.ruleId.startsWith('payment-compat') ||
          b.ruleId.startsWith('crypto-disclosure') ||
          b.ruleId.startsWith('juris-risk'))
    );
    expect(newStyleBlocks).toHaveLength(0);
  });
});
