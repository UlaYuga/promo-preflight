export type RunStatus = 'started' | 'completed' | 'failed';

export interface RunBlocker {
  ruleId: string;
  severity: 'block' | 'warn' | 'info';
  evidence: string;
  suggestion: string;
  ownerHint?: string;
}

export interface PolicyRuleVersions {
  paymentCompatibility: number;
  cryptoDisclosure: number;
  jurisdictionalRisk: number;
}

export interface Run {
  id: string;
  campaignId?: string;
  version?: number;
  verdict: 'GO' | 'WARN' | 'BLOCK';
  blockers: RunBlocker[];
  status: RunStatus;
  createdAt: string;
  completedAt?: string;
  policyRuleVersions: PolicyRuleVersions;
}
