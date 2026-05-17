export interface Blocker {
  ruleId: string;
  severity: 'block' | 'warn' | 'info';
  evidence: string;
  suggestion: string;
  ownerHint?: string;
}
