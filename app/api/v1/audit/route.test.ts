import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { encodeAuditCursor } from '../../../../application/query/ListAuditLogQuery';
import { GET, parseAuditListFilter } from './route';

describe('GET /api/v1/audit query parsing', () => {
  it('uses default limit when omitted', () => {
    const parsed = parseAuditListFilter(new URLSearchParams());
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.filter.limit).toBe(50);
      expect(parsed.filter.eventType).toBeUndefined();
      expect(parsed.filter.cursor).toBeUndefined();
    }
  });

  it('parses limit, type, and cursor for pagination/filtering', () => {
    const cursor = encodeAuditCursor({
      createdAt: '2026-05-16T12:00:00.000Z',
      id: 'cursor-id',
    });
    const parsed = parseAuditListFilter(
      new URLSearchParams({
        limit: '25',
        type: 'RunCompleted',
        cursor,
      })
    );

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.filter.limit).toBe(25);
      expect(parsed.filter.eventType).toBe('RunCompleted');
      expect(parsed.filter.cursor).toBe(cursor);
    }
  });

  it('rejects limit above max boundary', () => {
    const parsed = parseAuditListFilter(new URLSearchParams({ limit: '201' }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toContain('limit');
    }
  });

  it('rejects unsupported event type', () => {
    const parsed = parseAuditListFilter(new URLSearchParams({ type: 'UnknownType' }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toContain('type');
    }
  });

  it('rejects invalid cursor', () => {
    const parsed = parseAuditListFilter(new URLSearchParams({ cursor: 'invalid' }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toContain('cursor');
    }
  });

  it('returns an empty feed when DATABASE_URL is not configured', async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const response = await GET(
        new NextRequest('http://localhost/api/v1/audit?limit=1')
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        items: [],
        nextCursor: null,
      });
    } finally {
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
    }
  });
});
