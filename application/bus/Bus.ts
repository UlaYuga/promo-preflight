import { SystemException, PreflightException } from '../../domain/exception/PreflightException';
import type { PreflightException as PreflightExceptionType } from '../../domain/exception/PreflightException';
import { HandlerRegistry } from './HandlerRegistry';
import type { Command, Query, Result, HandlerContext } from './types';
import { err } from './types';

export class Bus {
  constructor(private readonly registry: HandlerRegistry) {}

  async dispatch<R>(
    command: Command<R>,
    ctx: HandlerContext = {}
  ): Promise<Result<R, PreflightExceptionType>> {
    try {
      const handler = this.registry.getCommandHandler(command.type);
      return handler.execute(command, ctx) as Promise<Result<R, PreflightExceptionType>>;
    } catch (e) {
      if (e instanceof PreflightException) {
        return err(e);
      }
      return err(new SystemException(`Unexpected error dispatching "${command.type}": ${e}`));
    }
  }

  async query<R>(
    q: Query<R>,
    ctx: HandlerContext = {}
  ): Promise<R> {
    const handler = this.registry.getQueryHandler(q.type);
    return handler.execute(q, ctx) as Promise<R>;
  }
}
