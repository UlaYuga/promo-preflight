import { describe, it, expect } from 'vitest';
import { JurisdictionalRiskCheck } from './JurisdictionalRiskCheck';
import type { CampaignBundle } from '../../domain/model/Campaign';
import { sampleCampaignBundle } from '../../schemas/fixtures';

function makeBundle(
  jurisdiction: string[],
  termsText: string,
  assetText?: string
): CampaignBundle {
  const base = {
    ...sampleCampaignBundle,
    targetJurisdiction: jurisdiction as CampaignBundle['targetJurisdiction'],
    termsText,
    assets: assetText
      ? [{ channel: 'email' as const, fieldName: 'body', text: assetText }]
      : [],
  };
  return base as CampaignBundle;
}

describe('JurisdictionalRiskCheck', () => {
  it('UK campaign with "risk-free" → BLOCK', async () => {
    const campaign = makeBundle(
      ['UK'],
      'This is a risk-free offer. 18+. BeGambleAware.'
    );
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    const blocks = blockers.filter((b) => b.severity === 'block' && b.evidence.includes('risk-free'));
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].ruleId).toContain('UK');
  });

  it('UK campaign without "18+" anywhere → BLOCK', async () => {
    const campaign = makeBundle(
      ['UK'],
      'Welcome bonus 100%. BeGambleAware. Terms apply.'
    );
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    const missing18 = blockers.filter(
      (b) => b.severity === 'block' && b.evidence.includes('18+')
    );
    expect(missing18.length).toBeGreaterThan(0);
  });

  it('BR campaign without "Jogue com responsabilidade" → BLOCK', async () => {
    const campaign = makeBundle(
      ['BR'],
      'Bônus de boas-vindas. 18+. Termos e condições aplicam-se.'
    );
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    const missing = blockers.filter(
      (b) => b.severity === 'block' && b.evidence.includes('Jogue com responsabilidade')
    );
    expect(missing.length).toBeGreaterThan(0);
  });

  it('RU campaign with mandatory "18+" present → no block from mandatory check', async () => {
    const campaign = makeBundle(
      ['RU'],
      'Акция доступна для игроков 18+. Лицензия ФНС №12345. Минимальный депозит 500 руб.'
    );
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    const mandatoryBlocks = blockers.filter(
      (b) => b.severity === 'block' && b.ruleId.includes('mandatory')
    );
    expect(mandatoryBlocks).toHaveLength(0);
  });

  it('ES campaign with "Juega con responsabilidad" → no warn for that mandatory', async () => {
    const campaign = makeBundle(
      ['ES'],
      'Bono de bienvenida. Juega con responsabilidad. 18+. Términos y condiciones.'
    );
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    const responsibilityWarn = blockers.filter(
      (b) => b.evidence.includes('Juega con responsabilidad')
    );
    expect(responsibilityWarn).toHaveLength(0);
  });

  it('Multi-jurisdiction [BR, UK] → applies both rule sets', async () => {
    const campaign = makeBundle(
      ['BR', 'UK'],
      'Welcome bonus offer. Terms apply.' // missing: 18+, BeGambleAware, Jogue com responsabilidade
    );
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    const brMissing = blockers.some((b) => b.evidence.includes('Jogue com responsabilidade'));
    const ukMissing18 = blockers.some((b) => b.evidence.includes('18+') && b.ruleId.includes('UK'));
    expect(brMissing).toBe(true);
    expect(ukMissing18).toBe(true);
  });

  it('DE campaign missing "Glücksspiel kann süchtig machen" → BLOCK', async () => {
    const campaign = makeBundle(
      ['DE'],
      'Willkommensbonus 100%. 18+. AGB gelten.'
    );
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    const missing = blockers.filter(
      (b) => b.severity === 'block' && b.evidence.includes('Glücksspiel kann süchtig machen')
    );
    expect(missing.length).toBeGreaterThan(0);
  });

  it('BR campaign with "garantido" → BLOCK', async () => {
    const campaign = makeBundle(
      ['BR'],
      'Ganhe bônus garantido! Jogue com responsabilidade. 18+.'
    );
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    const blocks = blockers.filter(
      (b) => b.severity === 'block' && b.evidence.includes('garantido')
    );
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('Campaign with no targetJurisdiction → returns empty array', async () => {
    const campaign = {
      ...sampleCampaignBundle,
      targetJurisdiction: undefined,
    } as unknown as CampaignBundle;
    const blockers = await JurisdictionalRiskCheck.run(campaign);
    expect(blockers).toHaveLength(0);
  });
});
