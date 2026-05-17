import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { idempotencyKeys } from '../db/schema';
import type { IIdempotencyRepository, IdempotencyRecord } from '../../application/port/IIdempotencyRepository';

export class IdempotencyRepository implements IIdempotencyRepository {
  constructor(private readonly db: Db) {}

  async find(key: string): Promise<IdempotencyRecord | null> {
    const rows = await this.db
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      key: row.key,
      requestHash: row.requestHash,
      responseSnapshot: row.responseSnapshot,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async save(record: Omit<IdempotencyRecord, 'createdAt'>): Promise<void> {
    await this.db
      .insert(idempotencyKeys)
      .values({
        key: record.key,
        requestHash: record.requestHash,
        responseSnapshot: record.responseSnapshot,
      })
      .onConflictDoNothing();
  }
}
