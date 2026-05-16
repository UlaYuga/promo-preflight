import { Bus } from '../application/bus/Bus';
import { HandlerRegistry } from '../application/bus/HandlerRegistry';
import { handler as runChecksHandler } from '../infrastructure/handler/checks/RunChecksHandler';
import { sampleCampaignBundle } from '../schemas/fixtures';
import type { RunChecksCommand } from '../application/command/RunChecksCommand';

const registry = new HandlerRegistry();
registry.register(runChecksHandler);
const bus = new Bus(registry);

const command: RunChecksCommand = {
  type: 'RunChecks',
  campaign: sampleCampaignBundle as RunChecksCommand['campaign'],
};

import type { Run } from '../domain/model/Run';

void (async () => {
  console.log('Running demo-bus with offline fixture...\n');

  const result = await bus.dispatch<Run>(command);

  if (result.ok) {
    const run = result.value;
    console.log(`Run ID:    ${run.id}`);
    console.log(`Verdict:   ${run.verdict}`);
    console.log(`Status:    ${run.status}`);
    console.log(`Blockers:  ${run.blockers.length}`);
    console.log('\nBlockers detail:');
    for (const b of run.blockers) {
      console.log(`  [${b.severity.toUpperCase()}] ${b.ruleId}`);
      console.log(`    Evidence:   ${b.evidence}`);
      console.log(`    Suggestion: ${b.suggestion}`);
    }
  } else {
    console.error('Run failed:', result.error.message);
    process.exit(1);
  }
})();
