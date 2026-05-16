export type Severity = 'block' | 'warn' | 'info';

export const SEVERITIES: readonly Severity[] = ['block', 'warn', 'info'] as const;

export function isSeverity(value: string): value is Severity {
  return (SEVERITIES as readonly string[]).includes(value);
}
