import { describe, it, expect } from 'vitest';
import { PaymentCompatibilityCheck } from './PaymentCompatibilityCheck';
import type { CampaignBundle } from '../../domain/model/Campaign';
import { sampleCampaignBundle } from '../../schemas/fixtures';

function makeBundle(overrides: Partial<CampaignBundle>): CampaignBundle {
  return { ...sampleCampaignBundle, ...overrides } as CampaignBundle;
}

describe('PaymentCompatibilityCheck', () => {
  it('BR campaign mentioning Pix → no blocker', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['BR'],
      paymentMethods: ['pix'],
    });
    const blockers = await PaymentCompatibilityCheck.run(campaign);
    expect(blockers.filter((b) => b.severity === 'block')).toHaveLength(0);
  });

  it('IN campaign mentioning UPI → BLOCK', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['IN'],
      paymentMethods: ['upi'],
    });
    const blockers = await PaymentCompatibilityCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].ruleId).toBe('payment-compat-001');
    expect(blocks[0].evidence).toContain('upi');
  });

  it('RU campaign mentioning only fiat → WARN about missing crypto', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['RU'],
      paymentMethods: ['bank_transfer'],
    });
    const blockers = await PaymentCompatibilityCheck.run(campaign);
    const warns = blockers.filter((b) => b.severity === 'warn' && b.ruleId === 'payment-compat-003');
    expect(warns.length).toBeGreaterThan(0);
  });

  it('AL campaign mentioning any crypto → BLOCK', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['AL'],
      paymentMethods: ['usdt_trc20'],
    });
    const blockers = await PaymentCompatibilityCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].evidence).toContain('AL');
  });

  it('Unknown jurisdiction → throws InvalidCampaignException', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['UK'],
      paymentMethods: ['pix'],
    });
    // Patch: use an invalid jurisdiction string via type cast
    (campaign as { targetJurisdiction: string[] }).targetJurisdiction = ['XX'];
    await expect(PaymentCompatibilityCheck.run(campaign as CampaignBundle)).rejects.toThrow(
      'Unknown target jurisdiction'
    );
  });

  it('Campaign with no targetJurisdiction → returns empty array', async () => {
    const campaign = makeBundle({
      targetJurisdiction: undefined,
      paymentMethods: ['upi'],
    });
    const blockers = await PaymentCompatibilityCheck.run(campaign);
    expect(blockers).toHaveLength(0);
  });

  it('UK campaign with credit card → BLOCK (banned by UKGC)', async () => {
    const campaign = makeBundle({
      targetJurisdiction: ['UK'],
      paymentMethods: ['credit_card'],
    });
    const blockers = await PaymentCompatibilityCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block');
    expect(blocks.length).toBeGreaterThan(0);
  });
});
