import { describe, it, expect } from 'vitest';
import { CryptoDisclosureCheck } from './CryptoDisclosureCheck';
import type { CampaignBundle } from '../../domain/model/Campaign';
import { sampleCampaignBundle } from '../../schemas/fixtures';

function makeBundle(overrides: Partial<CampaignBundle>): CampaignBundle {
  return { ...sampleCampaignBundle, ...overrides } as CampaignBundle;
}

const VOLATILITY_DISCLAIMER = 'цена криптовалюты колеблется';

describe('CryptoDisclosureCheck', () => {
  it('RU campaign with USDT mention + volatility disclaimer in T&C → no BLOCK', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['RU'],
      termsText: `Оплата возможна через USDT. Внимание: ${VOLATILITY_DISCLAIMER}. Минимальный возраст 18+. Лицензия ФНС №12345.`,
    });
    const blockers = await CryptoDisclosureCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks).toHaveLength(0);
  });

  it('RU campaign with USDT mention WITHOUT disclaimer → BLOCK', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['RU'],
      termsText: 'Оплата возможна через USDT. 18+. Лицензия ФНС №12345.',
    });
    const blockers = await CryptoDisclosureCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].ruleId).toBe('crypto-disclosure-002');
    expect(blocks[0].evidence).toContain('RU');
  });

  it('AL campaign mentioning BTC → BLOCK', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['AL'],
      termsText: 'Deposit with BTC or credit card. Min deposit 10 EUR.',
    });
    const blockers = await CryptoDisclosureCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].ruleId).toBe('crypto-disclosure-001');
  });

  it('IN campaign mentioning crypto → BLOCK', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['IN'],
      termsText: 'Pay using UPI or USDT. 18+ only.',
    });
    const blockers = await CryptoDisclosureCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].ruleId).toBe('crypto-disclosure-001');
  });

  it('BR campaign mentioning crypto → BLOCK (crypto forbidden for BR gaming)', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['BR'],
      termsText: 'Deposite via Pix ou BTC. Jogue com responsabilidade. 18+.',
    });
    const blockers = await CryptoDisclosureCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].ruleId).toBe('crypto-disclosure-001');
  });

  it('RU campaign with NO crypto mention → info-level warn about adoption gap', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['RU'],
      termsText: 'Пополнение через банковский перевод. 18+. Лицензия ФНС.',
    });
    const blockers = await CryptoDisclosureCheck.run(campaign);
    const infos = blockers.filter((b) => b.severity === 'info');
    expect(infos.length).toBeGreaterThan(0);
    expect(infos[0].ruleId).toBe('crypto-disclosure-004');
  });

  it('UK campaign mentioning crypto → BLOCK', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['UK'],
      termsText: 'Deposit via debit card or USDT. 18+. BeGambleAware.org.',
    });
    const blockers = await CryptoDisclosureCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks.length).toBeGreaterThan(0);
  });
});
