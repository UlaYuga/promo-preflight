import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { Bus } from '../../application/bus/Bus';
import { HandlerRegistry } from '../../application/bus/HandlerRegistry';
import type { RunChecksCommand } from '../../application/command/RunChecksCommand';
import { handler as runChecksHandler } from '../../infrastructure/handler/checks/RunChecksHandler';
import type { Run } from '../../domain/model/Run';
import type { CampaignBundle } from '../../domain/model/Campaign';
import { sampleCampaignBundle } from '../../schemas/fixtures';
import {
  getPolicyRuleVersions,
  resetRuntimePolicyCacheForTests,
} from './runtimePolicy';

const originalRulesDir = process.env.RUNTIME_POLICY_RULES_DIR;

function writePolicyFile(dir: string, fileName: string, content: string): void {
  writeFileSync(join(dir, fileName), content);
}

function writeValidPolicyFiles(dir: string): void {
  writePolicyFile(
    dir,
    'payment-methods-by-region.yaml',
    `version: 41
regions:
  UK:
    allowed: [debit_card]
    grey: []
    forbidden: [credit_card]
    rule_refs: ["payment policy"]
`
  );
  writePolicyFile(
    dir,
    'crypto-disclosure-rules.yaml',
    `version: 42
regions:
  UK:
    status: forbidden
    rule_refs: ["crypto policy"]
`
  );
  writePolicyFile(
    dir,
    'forbidden-phrases-by-region.yaml',
    `version: 43
regions:
  UK:
    forbidden:
      - phrase: "risk-free"
        rule_ref: "phrase policy"
        severity: block
    mandatory:
      - text: "18+"
        rule_ref: "age policy"
        severity: block
`
  );
}

function makeBus(): Bus {
  const registry = new HandlerRegistry();
  registry.register(runChecksHandler);
  return new Bus(registry);
}

function makeCampaign(): CampaignBundle {
  return {
    ...sampleCampaignBundle,
    targetJurisdiction: ['UK'],
    paymentMethods: ['debit_card'],
    termsText: '18+. BeGambleAware.org. Wagering 35x. Max bet £5 during bonus.',
  } as CampaignBundle;
}

describe('runtime policy artifacts', () => {
  afterEach(() => {
    if (originalRulesDir === undefined) {
      delete process.env.RUNTIME_POLICY_RULES_DIR;
    } else {
      process.env.RUNTIME_POLICY_RULES_DIR = originalRulesDir;
    }
    resetRuntimePolicyCacheForTests();
  });

  it('fails closed when a runtime YAML artifact is malformed', async () => {
    const rulesDir = mkdtempSync(join(tmpdir(), 'preflight-policy-rules-'));
    mkdirSync(rulesDir, { recursive: true });
    writeValidPolicyFiles(rulesDir);
    writePolicyFile(
      rulesDir,
      'payment-methods-by-region.yaml',
      `version: 41
regions:
  UK:
    allowed: [debit_card]
    grey: []
    forbidden: [credit_card]
`
    );
    process.env.RUNTIME_POLICY_RULES_DIR = rulesDir;

    const result = await makeBus().dispatch<Run>({
      type: 'RunChecks',
      campaign: makeCampaign(),
    } as RunChecksCommand);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('POLICY_ARTIFACT_INVALID');
    expect(result.error.message).toContain('payment-methods-by-region.yaml');
  });

  it('extracts policy versions from the validated runtime YAML artifacts', () => {
    const rulesDir = mkdtempSync(join(tmpdir(), 'preflight-policy-rules-'));
    mkdirSync(rulesDir, { recursive: true });
    writeValidPolicyFiles(rulesDir);
    process.env.RUNTIME_POLICY_RULES_DIR = rulesDir;

    expect(getPolicyRuleVersions()).toEqual({
      paymentCompatibility: 41,
      cryptoDisclosure: 42,
      jurisdictionalRisk: 43,
    });
  });
});
