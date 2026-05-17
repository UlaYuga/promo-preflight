import { describe, expect, it } from 'vitest';
import type { PreflightEvent } from '../../domain/event/PreflightEvent';
import { OutboxWorker, type OutboxSubscriber } from './OutboxWorker';
import type { Transaction } from '../persistence/types';
import type { Db } from '../db/client';

type MemoryOutboxRow = {
  id: string;
  payload: unknown;
  attempts: number;
  deliveredAt: Date | null;
  lastError: string | null;
};

class InMemoryOutboxWorker extends OutboxWorker {
  constructor(
    private readonly rows: MemoryOutboxRow[],
    subscribers: readonly OutboxSubscriber[],
    private readonly maxAttemptsLimit: number,
    pollIntervalMs = 0
  ) {
    super(createNoopDb(), subscribers, {
      pollIntervalMs,
      maxAttempts: maxAttemptsLimit,
      logger: { error: () => {} },
    });
  }

  async runSingleBatch(): Promise<void> {
    await this.processBatch();
  }

  getRow(id: string): MemoryOutboxRow {
    const row = this.rows.find((candidate) => candidate.id === id);
    if (!row) {
      throw new Error(`Row ${id} not found`);
    }
    return row;
  }

  protected override async withTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    return fn({} as Transaction);
  }

  protected override async claimBatch(): Promise<Array<{ id: string; payload: unknown }>> {
    return this.rows
      .filter((row) => row.deliveredAt === null && row.attempts < this.maxAttemptsLimit)
      .slice(0, 10)
      .map((row) => ({ id: row.id, payload: row.payload }));
  }

  protected override async markDelivered(_tx: Transaction, id: string): Promise<void> {
    const row = this.getRow(id);
    row.deliveredAt = new Date();
    row.lastError = null;
  }

  protected override async markFailed(
    _tx: Transaction,
    id: string,
    errorMessage: string
  ): Promise<void> {
    const row = this.getRow(id);
    row.attempts += 1;
    row.lastError = errorMessage;
  }
}

describe('OutboxWorker', () => {
  it('delivers a row only after all subscribers succeed', async () => {
    const event = validEvent('evt-1');
    const rows: MemoryOutboxRow[] = [
      {
        id: 'row-1',
        payload: event,
        attempts: 0,
        deliveredAt: null,
        lastError: null,
      },
    ];

    let shouldFail = true;
    const subscribers: OutboxSubscriber[] = [
      async () => {},
      async () => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('subscriber failed');
        }
      },
    ];

    const worker = new InMemoryOutboxWorker(rows, subscribers, 5);

    await worker.runSingleBatch();
    expect(worker.getRow('row-1').deliveredAt).toBeNull();
    expect(worker.getRow('row-1').attempts).toBe(1);
    expect(worker.getRow('row-1').lastError).toContain('subscriber failed');

    await worker.runSingleBatch();
    expect(worker.getRow('row-1').deliveredAt).toBeInstanceOf(Date);
    expect(worker.getRow('row-1').attempts).toBe(1);
    expect(worker.getRow('row-1').lastError).toBeNull();
  });

  it('increments attempts and stores last_error when a subscriber fails', async () => {
    const rows: MemoryOutboxRow[] = [
      {
        id: 'row-2',
        payload: validEvent('evt-2'),
        attempts: 0,
        deliveredAt: null,
        lastError: null,
      },
    ];

    const subscribers: OutboxSubscriber[] = [
      async () => {
        throw new Error('telegram unavailable');
      },
    ];

    const worker = new InMemoryOutboxWorker(rows, subscribers, 5);

    await worker.runSingleBatch();

    const row = worker.getRow('row-2');
    expect(row.attempts).toBe(1);
    expect(row.lastError).toContain('telegram unavailable');
    expect(row.deliveredAt).toBeNull();
  });

  it('skips rows that reached maxAttempts', async () => {
    const rows: MemoryOutboxRow[] = [
      {
        id: 'row-3',
        payload: validEvent('evt-3'),
        attempts: 5,
        deliveredAt: null,
        lastError: 'previous error',
      },
    ];

    let called = 0;
    const subscribers: OutboxSubscriber[] = [
      async () => {
        called += 1;
      },
    ];

    const worker = new InMemoryOutboxWorker(rows, subscribers, 5);

    await worker.runSingleBatch();

    const row = worker.getRow('row-3');
    expect(called).toBe(0);
    expect(row.attempts).toBe(5);
    expect(row.deliveredAt).toBeNull();
    expect(row.lastError).toBe('previous error');
  });

  it('increments attempts for invalid payload', async () => {
    const rows: MemoryOutboxRow[] = [
      {
        id: 'row-4',
        payload: { type: 'RunCompleted', id: 'broken-event' },
        attempts: 0,
        deliveredAt: null,
        lastError: null,
      },
    ];

    const worker = new InMemoryOutboxWorker(rows, [async () => {}], 5);

    await worker.runSingleBatch();

    const row = worker.getRow('row-4');
    expect(row.attempts).toBe(1);
    expect(row.deliveredAt).toBeNull();
    expect(typeof row.lastError).toBe('string');
    expect((row.lastError ?? '').length).toBeGreaterThan(0);
  });

  it('stop() exits loop after current in-flight batch', async () => {
    const rows: MemoryOutboxRow[] = [
      {
        id: 'row-5',
        payload: validEvent('evt-5'),
        attempts: 0,
        deliveredAt: null,
        lastError: null,
      },
    ];

    let enteredSubscriber = false;
    let releaseSubscriber: (() => void) | null = null;
    const subscriberEntered = new Promise<void>((resolve) => {
      releaseSubscriber = resolve;
    });

    const subscribers: OutboxSubscriber[] = [
      async () => {
        enteredSubscriber = true;
        releaseSubscriber?.();
        await sleep(30);
      },
    ];

    const worker = new InMemoryOutboxWorker(rows, subscribers, 5000);

    const startPromise = worker.start();
    await subscriberEntered;
    await worker.stop();
    await startPromise;

    expect(enteredSubscriber).toBe(true);
    expect(worker.getRow('row-5').deliveredAt).toBeInstanceOf(Date);
    expect(worker.getRow('row-5').attempts).toBe(0);
  });
});

function createNoopDb(): Db {
  return {
    transaction: async <T>(cb: (tx: Transaction) => Promise<T>): Promise<T> => {
      return cb({} as Transaction);
    },
  } as unknown as Db;
}

function validEvent(id: string): PreflightEvent {
  return {
    id,
    type: 'RunCompleted',
    occurredAt: '2026-05-16T10:00:00.000Z',
    runId: `run-${id}`,
    verdict: 'GO',
    counts: {
      blockers: 0,
      warnings: 0,
      passed: 1,
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
