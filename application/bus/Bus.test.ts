import { describe, it, expect } from 'vitest';
import { Bus } from './Bus';
import { HandlerRegistry } from './HandlerRegistry';
import { ok } from './types';
import type { Command, CommandHandler, HandlerContext, Query, QueryHandler, Result } from './types';
import type { PreflightException } from '../../domain/exception/PreflightException';

// --- Fake command for AddNumbers ---
interface AddNumbersCommand extends Command<number> {
  readonly type: 'AddNumbers';
  readonly a: number;
  readonly b: number;
}

const addNumbersHandler: CommandHandler<AddNumbersCommand, number> = {
  commandType: 'AddNumbers',
  async execute(cmd): Promise<Result<number, PreflightException>> {
    return ok(cmd.a + cmd.b);
  },
};

// --- Fake query for GetString ---
interface GetStringQuery extends Query<string> {
  readonly type: 'GetString';
  readonly value: string;
}

const getStringHandler: QueryHandler<GetStringQuery, string> = {
  queryType: 'GetString',
  async execute(q: GetStringQuery, _ctx: HandlerContext): Promise<string> {
    return q.value.toUpperCase();
  },
};

describe('Bus', () => {
  it('registers a command handler and dispatches', async () => {
    const registry = new HandlerRegistry();
    registry.register(addNumbersHandler);
    const bus = new Bus(registry);

    const result = await bus.dispatch<number>({ type: 'AddNumbers', a: 3, b: 4 } as AddNumbersCommand);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(7);
    }
  });

  it('returns ok:false when no handler registered for command type', async () => {
    const registry = new HandlerRegistry();
    const bus = new Bus(registry);

    const result = await bus.dispatch({ type: 'UnknownCommand' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NO_HANDLER');
    }
  });

  it('queries return T directly', async () => {
    const registry = new HandlerRegistry();
    registry.register(getStringHandler);
    const bus = new Bus(registry);

    const result = await bus.query<string>({ type: 'GetString', value: 'hello' } as GetStringQuery);

    expect(result).toBe('HELLO');
  });

  it('HandlerRegistry.fromGlob populates registry from glob modules', () => {
    const registry = HandlerRegistry.fromGlob({
      'path/to/add': { handler: addNumbersHandler },
      'path/to/str': { handler: getStringHandler },
    });

    expect(() => registry.getCommandHandler('AddNumbers')).not.toThrow();
    expect(() => registry.getQueryHandler('GetString')).not.toThrow();
    expect(() => registry.getCommandHandler('Missing')).toThrow();
  });
});
