import type { IEventPublisher } from '../../application/port/IEventPublisher';
import type { PreflightEvent } from '../../domain/event/PreflightEvent';
import type { Db } from '../db/client';
import { outbox } from '../db/schema';
import type { Transaction } from '../persistence/types';

type OutboxExecutor = Db | Transaction;

export class OutboxEventPublisher implements IEventPublisher {
  constructor(private readonly db: Db) {}

  async publish(event: PreflightEvent, tx?: Transaction): Promise<void> {
    if (tx) {
      await this.insertOne(tx, event);
      return;
    }

    await this.db.transaction(async (transaction) => {
      await this.insertOne(transaction, event);
    });
  }

  async publishAll(events: PreflightEvent[], tx?: Transaction): Promise<void> {
    if (events.length === 0) {
      return;
    }

    if (tx) {
      for (const event of events) {
        await this.insertOne(tx, event);
      }
      return;
    }

    await this.db.transaction(async (transaction) => {
      for (const event of events) {
        await this.insertOne(transaction, event);
      }
    });
  }

  private async insertOne(executor: OutboxExecutor, event: PreflightEvent): Promise<void> {
    await executor.insert(outbox).values({
      eventType: event.type,
      payload: event as unknown as Record<string, unknown>,
      deliveredAt: null,
    });
  }
}
