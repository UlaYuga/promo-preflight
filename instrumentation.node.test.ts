import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  dbExecute: vi.fn(),
  getDb: vi.fn(),
  createAuditSubscriber: vi.fn(() => vi.fn()),
  workerStart: vi.fn(() => Promise.resolve()),
  workerStop: vi.fn(() => Promise.resolve()),
  OutboxWorker: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readdir: mocks.readdir,
  readFile: mocks.readFile,
}));
vi.mock('@infra/audit', () => ({
  createAuditSubscriber: mocks.createAuditSubscriber,
}));
vi.mock('@infra/db/client', () => ({
  getDb: mocks.getDb,
}));
vi.mock('@infra/outbox', () => ({
  OutboxWorker: mocks.OutboxWorker,
}));
vi.mock('@infra/persistence/PgAuditRepository', () => ({
  PgAuditRepository: vi.fn(),
}));
vi.mock('@infra/telegram', () => ({
  telegramSubscriber: vi.fn(),
}));

describe('registerNodeInstrumentation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.OutboxWorker.mockImplementation(function WorkerMock() {
      return {
        start: mocks.workerStart,
        stop: mocks.workerStop,
      };
    });
    mocks.readdir.mockRejectedValue(
      new Error('instrumentation must not read migration files')
    );
    mocks.getDb.mockReturnValue({
      execute: mocks.dbExecute,
      transaction: vi.fn(),
    });
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.restoreAllMocks();
  });

  it('starts the outbox worker without reading or applying migrations', async () => {
    process.env.DATABASE_URL = 'postgres://configured/database';

    const { registerNodeInstrumentation } = await import('./instrumentation.node');
    await registerNodeInstrumentation();

    expect(mocks.readdir).not.toHaveBeenCalled();
    expect(mocks.readFile).not.toHaveBeenCalled();
    expect(mocks.dbExecute).not.toHaveBeenCalled();
    expect(mocks.OutboxWorker).toHaveBeenCalledOnce();
    expect(mocks.workerStart).toHaveBeenCalledOnce();
  });

  it('skips worker startup without describing migration behavior when DATABASE_URL is absent', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { registerNodeInstrumentation } = await import('./instrumentation.node');
    await registerNodeInstrumentation();

    expect(mocks.OutboxWorker).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      '[outbox] DATABASE_URL not set - skipping worker startup.'
    );
    expect(warn.mock.calls.flat().join(' ')).not.toContain('migrat');
  });
});
