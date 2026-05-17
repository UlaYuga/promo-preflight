import { describe, expect, it } from 'vitest';
import type { IAuditRepository, AuditListFilter, AuditListResult } from '../port/IAuditRepository';
import {
  ListAuditLogQueryHandler,
  decodeAuditCursor,
  encodeAuditCursor,
} from './ListAuditLogQuery';

describe('ListAuditLogQuery', () => {
  it('encodes and decodes cursor round-trip', () => {
    const cursor = { createdAt: '2026-05-16T10:00:00.000Z', id: 'a-b-c' };
    const encoded = encodeAuditCursor(cursor);
    const decoded = decodeAuditCursor(encoded);

    expect(decoded).toEqual(cursor);
  });

  it('rejects malformed cursor payload', () => {
    expect(() => decodeAuditCursor('not-base64')).toThrow();
  });

  it('delegates list query to repository with filter intact', async () => {
    const expectedResult: AuditListResult = {
      items: [],
      nextCursor: 'next-cursor',
    };
    let receivedFilter: AuditListFilter | null = null;

    const repository: IAuditRepository = {
      async append(): Promise<void> {
        throw new Error('append should not be called in this test');
      },
      async list(filter): Promise<AuditListResult> {
        receivedFilter = filter;
        return expectedResult;
      },
    };

    const handler = new ListAuditLogQueryHandler(repository);
    const filter: AuditListFilter = {
      eventType: 'RunCompleted',
      limit: 20,
      cursor: 'cursor-1',
    };
    const result = await handler.execute(
      {
        type: 'ListAuditLog',
        filter,
      },
      {}
    );

    expect(receivedFilter).toEqual(filter);
    expect(result).toEqual(expectedResult);
  });
});
