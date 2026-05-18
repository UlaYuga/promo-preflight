import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PREFLIGHT_EVENT_TYPES } from '../../../../domain/event/PreflightEvent';
import type { AuditListFilter } from '../../../../application/port/IAuditRepository';
import type { ListAuditLogQuery } from '../../../../application/query/ListAuditLogQuery';
import { ListAuditLogQueryHandler, decodeAuditCursor } from '../../../../application/query/ListAuditLogQuery';
import { badRequest } from '../../../../api/v1/index';
import { getDb } from '../../../../infrastructure/db/client';
import { PgAuditRepository } from '../../../../infrastructure/persistence/PgAuditRepository';

export const runtime = 'nodejs';

const EVENT_TYPE_SCHEMA = z.enum(PREFLIGHT_EVENT_TYPES);
const LIMIT_DEFAULT = 50;
const LIMIT_MAX = 200;

export type ParsedAuditFilter =
  | { ok: true; filter: AuditListFilter }
  | { ok: false; message: string };

export function parseAuditListFilter(searchParams: URLSearchParams): ParsedAuditFilter {
  const raw = {
    limit: searchParams.get('limit'),
    type: searchParams.get('type'),
    cursor: searchParams.get('cursor'),
  };

  let limit = LIMIT_DEFAULT;
  if (raw.limit !== null) {
    const parsedLimit = Number(raw.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > LIMIT_MAX) {
      return { ok: false, message: `Query param \`limit\` must be an integer between 1 and ${LIMIT_MAX}` };
    }
    limit = parsedLimit;
  }

  let eventType: string | undefined;
  if (raw.type !== null) {
    const parsedType = EVENT_TYPE_SCHEMA.safeParse(raw.type);
    if (!parsedType.success) {
      return {
        ok: false,
        message: `Query param \`type\` must be one of: ${PREFLIGHT_EVENT_TYPES.join(', ')}`,
      };
    }
    eventType = parsedType.data;
  }

  let cursor: string | undefined;
  if (raw.cursor !== null) {
    if (raw.cursor.length === 0) {
      return { ok: false, message: 'Query param `cursor` must be a non-empty string' };
    }
    try {
      decodeAuditCursor(raw.cursor);
    } catch {
      return { ok: false, message: 'Query param `cursor` is invalid' };
    }
    cursor = raw.cursor;
  }

  return {
    ok: true,
    filter: {
      limit,
      eventType,
      cursor,
    },
  };
}

export async function GET(req: NextRequest): Promise<Response> {
  const parsed = parseAuditListFilter(req.nextUrl.searchParams);
  if (!parsed.ok) {
    return badRequest(parsed.message);
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ items: [], nextCursor: null });
  }

  const db = getDb();
  const auditRepository = new PgAuditRepository(db);
  const queryHandler = new ListAuditLogQueryHandler(auditRepository);
  const query: ListAuditLogQuery = {
    type: 'ListAuditLog',
    filter: parsed.filter,
  };

  const result = await queryHandler.execute(query, {});
  return Response.json(result);
}
