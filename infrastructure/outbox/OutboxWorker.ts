import { sql } from 'drizzle-orm';
import type { PreflightEvent } from '../../domain/event/PreflightEvent';
import { PreflightEventSchema } from '../../domain/event/PreflightEvent';
import type { Db } from '../db/client';
import type { Transaction } from '../persistence/types';

export type OutboxSubscriber = (event: PreflightEvent) => Promise<void>;

interface OutboxRow extends Record<string, unknown> {
  id: string;
  payload: unknown;
}

export interface OutboxWorkerOptions {
  pollIntervalMs: number;
  maxAttempts: number;
  batchSize?: number;
  logger?: Pick<Console, 'error'>;
}

const DEFAULT_BATCH_SIZE = 10;

export class OutboxWorker {
  private readonly pollIntervalMs: number;
  private readonly maxAttempts: number;
  private readonly batchSize: number;
  private readonly logger: Pick<Console, 'error'>;

  private shouldStop = false;
  private loopPromise: Promise<void> | null = null;
  private sleepTimer: NodeJS.Timeout | null = null;
  private sleepResolver: (() => void) | null = null;

  constructor(
    private readonly db: Db,
    private readonly subscribers: readonly OutboxSubscriber[],
    opts: OutboxWorkerOptions
  ) {
    this.pollIntervalMs = normalizeInterval(opts.pollIntervalMs);
    this.maxAttempts = normalizeMaxAttempts(opts.maxAttempts);
    this.batchSize = opts.batchSize ?? DEFAULT_BATCH_SIZE;
    this.logger = opts.logger ?? console;
  }

  async start(): Promise<void> {
    if (this.loopPromise) {
      return this.loopPromise;
    }

    this.shouldStop = false;
    this.loopPromise = this.runLoop().finally(() => {
      this.loopPromise = null;
      this.resolveSleep();
    });

    return this.loopPromise;
  }

  async stop(): Promise<void> {
    this.shouldStop = true;
    this.resolveSleep();

    if (this.loopPromise) {
      await this.loopPromise;
    }
  }

  protected async processBatch(): Promise<void> {
    await this.withTransaction(async (tx) => {
      const rows = await this.claimBatch(tx);

      for (const row of rows) {
        await this.processRow(tx, row);
      }
    });
  }

  protected async withTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  protected async claimBatch(tx: Transaction): Promise<OutboxRow[]> {
    const result = await tx.execute<OutboxRow>(sql`
      select id, payload
      from outbox
      where delivered_at is null
        and attempts < ${this.maxAttempts}
      order by created_at asc
      limit ${this.batchSize}
      for update skip locked
    `);

    return result.rows;
  }

  protected async markDelivered(tx: Transaction, id: string): Promise<void> {
    await tx.execute(sql`
      update outbox
      set delivered_at = now(), last_error = null
      where id = ${id}
    `);
  }

  protected async markFailed(tx: Transaction, id: string, errorMessage: string): Promise<void> {
    await tx.execute(sql`
      update outbox
      set attempts = attempts + 1,
          last_error = ${errorMessage}
      where id = ${id}
    `);
  }

  private async runLoop(): Promise<void> {
    while (!this.shouldStop) {
      try {
        await this.processBatch();
      } catch (error) {
        const message = toErrorMessage(error);
        this.logger.error(`[OutboxWorker] Batch failed: ${message}`);
      }

      if (this.shouldStop) {
        break;
      }

      await this.sleep();
    }
  }

  private async processRow(tx: Transaction, row: OutboxRow): Promise<void> {
    try {
      const parsed = PreflightEventSchema.parse(row.payload);
      await this.deliverToSubscribers(parsed);
      await this.markDelivered(tx, row.id);
    } catch (error) {
      await this.markFailed(tx, row.id, toErrorMessage(error));
    }
  }

  private async deliverToSubscribers(event: PreflightEvent): Promise<void> {
    for (const subscriber of this.subscribers) {
      await subscriber(event);
    }
  }

  private async sleep(): Promise<void> {
    if (this.pollIntervalMs <= 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.sleepResolver = resolve;
      this.sleepTimer = setTimeout(() => {
        this.sleepTimer = null;
        const resolver = this.sleepResolver;
        this.sleepResolver = null;
        resolver?.();
      }, this.pollIntervalMs);
    });
  }

  private resolveSleep(): void {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }

    if (this.sleepResolver) {
      const resolver = this.sleepResolver;
      this.sleepResolver = null;
      resolver();
    }
  }
}

function normalizeInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 1000;
  }

  return Math.max(0, Math.trunc(value));
}

function normalizeMaxAttempts(value: number): number {
  if (!Number.isFinite(value)) {
    return 5;
  }

  return Math.max(1, Math.trunc(value));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
