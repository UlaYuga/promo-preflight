import { Bus } from '../application/bus/Bus';
import { HandlerRegistry } from '../application/bus/HandlerRegistry';
import { handler as runChecksHandler } from '../infrastructure/handler/checks/RunChecksHandler';
import type { CampaignBundleInput } from '../schemas/index';
import type { RunChecksCommand } from '../application/command/RunChecksCommand';
import type { Run } from '../domain/model/Run';

// Demo fixture: UK + RU multi-jurisdiction, deliberately broken to showcase
// new-style checks alongside legacy checks.
const demoCampaign: CampaignBundleInput = {
  metadata: {
    campaignName: 'Demo — Multi-jurisdiction compliance check',
    operatorLabel: 'Northstar Demo',
    promoType: 'welcome',
    geo: 'UK + RU',
    locale: 'en-GB',
    currency: 'GBP',
    launchDate: '2026-06-01',
    channelsIncluded: ['email', 'push', 'landing'],
  },
  offer: {
    minDeposit: 20,
    bonusPercentage: 100,
    maxBonus: 200,
    wageringRequirement: '35x bonus',
    maxBet: 5,
  },
  targetJurisdiction: ['UK', 'RU'],
  paymentMethods: ['credit_card', 'usdt_trc20', 'pix'],
  termsText: `
    Welcome bonus 100% up to £200. This is a risk-free guaranteed win offer.
    Deposit with credit card, USDT or Pix. Wagering 35x applies.
    Terms and conditions apply. Offer valid for new players only.
  `.trim(),
  assets: [
    {
      channel: 'email',
      fieldName: 'subject',
      text: 'Get your risk-free bonus — guaranteed wins!',
    },
    {
      channel: 'landing',
      fieldName: 'hero',
      text: 'Claim 100% match up to £200. Pay via USDT or credit card.',
    },
  ],
  links: [
    {
      label: 'CTA',
      url: 'https://demo.example.com/welcome?utm_source=email&utm_medium=push',
      requiresUtm: true,
    },
  ],
  owners: [{ role: 'product', name: 'Demo Owner', status: 'pending' }],
};

const registry = new HandlerRegistry();
registry.register(runChecksHandler);
const bus = new Bus(registry);

const command: RunChecksCommand = {
  type: 'RunChecks',
  campaign: demoCampaign as RunChecksCommand['campaign'],
};

void (async () => {
  console.log('=== demo-bus: full check suite (legacy + new-style checks) ===\n');

  const result = await bus.dispatch<Run>(command);

  if (!result.ok) {
    console.error('Run failed:', result.error.message);
    process.exit(1);
  }

  const run = result.value;
  console.log(`Run ID:   ${run.id}`);
  console.log(`Verdict:  ${run.verdict}`);
  console.log(`Blockers: ${run.blockers.length}\n`);

  const byCheck = new Map<string, typeof run.blockers>();
  for (const b of run.blockers) {
    const key = b.ruleId.split('.')[0];
    if (!byCheck.has(key)) byCheck.set(key, []);
    byCheck.get(key)!.push(b);
  }

  for (const [check, blockers] of byCheck) {
    console.log(`── ${check} (${blockers.length})`);
    for (const b of blockers) {
      const sev = b.severity.toUpperCase().padEnd(5);
      console.log(`   [${sev}] ${b.evidence.slice(0, 90)}`);
    }
  }

  const newChecks = ['payment-compat', 'crypto-disclosure', 'juris-risk'];
  const covered = newChecks.filter((id) =>
    run.blockers.some((b) => b.ruleId.startsWith(id))
  );
  console.log(`\nNew-style checks with blockers: ${covered.join(', ') || 'none'}`);
  if (covered.length < newChecks.length) {
    console.warn('⚠ Some new-style checks produced no blockers on this fixture.');
  } else {
    console.log('✓ All three new-style checks fired.');
  }
})();
