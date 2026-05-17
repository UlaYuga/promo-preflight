import { NoHandlerException } from '../../domain/exception/PreflightException';
import type { CommandHandler, QueryHandler, Command, Query } from './types';

type AnyCommandHandler = CommandHandler<Command<unknown>, unknown>;
type AnyQueryHandler = QueryHandler<Query<unknown>, unknown>;

export class HandlerRegistry {
  private commands = new Map<string, AnyCommandHandler>();
  private queries = new Map<string, AnyQueryHandler>();

  register(handler: AnyCommandHandler | AnyQueryHandler): void {
    if ('commandType' in handler) {
      this.commands.set(handler.commandType, handler as AnyCommandHandler);
    } else {
      this.queries.set(handler.queryType, handler as AnyQueryHandler);
    }
  }

  getCommandHandler(type: string): AnyCommandHandler {
    const handler = this.commands.get(type);
    if (!handler) {
      throw new NoHandlerException(`No command handler registered for type: "${type}"`);
    }
    return handler;
  }

  getQueryHandler(type: string): AnyQueryHandler {
    const handler = this.queries.get(type);
    if (!handler) {
      throw new NoHandlerException(`No query handler registered for type: "${type}"`);
    }
    return handler;
  }

  static fromGlob(
    modules: Record<string, { handler: AnyCommandHandler | AnyQueryHandler }>
  ): HandlerRegistry {
    const registry = new HandlerRegistry();
    for (const mod of Object.values(modules)) {
      registry.register(mod.handler);
    }
    return registry;
  }
}
