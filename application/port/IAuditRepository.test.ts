import { describe, expect, it } from 'vitest';
import type { IAuditRepository } from './IAuditRepository';

type AuditRepositoryMethodNames = keyof IAuditRepository;
type ExpectedMethodNames = 'append' | 'list';
type HasOnlyAppendAndList =
  Exclude<AuditRepositoryMethodNames, ExpectedMethodNames> extends never
    ? Exclude<ExpectedMethodNames, AuditRepositoryMethodNames> extends never
      ? true
      : false
    : false;

describe('IAuditRepository contract', () => {
  it('is append-only by interface surface (append + list only)', () => {
    const typeAssertion: HasOnlyAppendAndList = true;
    expect(typeAssertion).toBe(true);
  });
});
