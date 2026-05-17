import { and, desc, eq, lt, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type {
  IAuditRepository,
  AuditEntry,
  AuditListFilter,
  AuditListResult,
} from '../../application/port/IAuditRepository';
import { decodeAuditCursor, encodeAuditCursor } from '../../application/query/ListAuditLogQuery';
import { PreflightEventSchema } from '../../domain/event/PreflightEvent';
import type { Db } from '../db/client';
import { auditLog } from '../db/schema';

const MIN_LIMIT = 1;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export class PgAuditRepository implements IAuditRepository {
  constructor(private readonly db: Db) {}

  async append(event: AuditEntry['payload'], actor?: string): Promise<void> {
    await this.db.insert(auditLog).values({
      eventType: event.type,
      payload: event as unknown as Record<string, unknown>,
      actor: actor ?? 'system',
    });
  }

  async list(filter: AuditListFilter): Promise<AuditListResult> {
    const limit = normalizeLimit(filter.limit);
    const conditions: SQL<unknown>[] = [];

    if (filter.eventType) {
      conditions.push(eq(auditLog.eventType, filter.eventType));
    }

    if (filter.cursor) {
      const cursor = decodeAuditCursor(filter.cursor);
      const cursorTime = new Date(cursor.createdAt);

      conditions.push(
        or(
          lt(auditLog.createdAt, cursorTime),
          and(eq(auditLog.createdAt, cursorTime), lt(auditLog.id, cursor.id))
        ) as SQL<unknown>
      );
    }

    const baseQuery = this.db
      .select({
        id: auditLog.id,
        eventType: auditLog.eventType,
        payload: auditLog.payload,
        actor: auditLog.actor,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog);

    const rows = await (conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery)
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    const items: AuditEntry[] = pageRows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      payload: PreflightEventSchema.parse(row.payload),
      actor: row.actor,
      createdAt: row.createdAt.toISOString(),
    }));

    const lastItem = items[items.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? encodeAuditCursor({ createdAt: lastItem.createdAt, id: lastItem.id })
        : null;

    return { items, nextCursor };
  }
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  const normalized = Math.trunc(limit);
  if (normalized < MIN_LIMIT) {
    return MIN_LIMIT;
  }
  if (normalized > MAX_LIMIT) {
    return MAX_LIMIT;
  }
  return normalized;
}
