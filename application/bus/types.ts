import type { PreflightException } from '../../domain/exception/PreflightException';

export interface Command<R = unknown> {
  readonly type: string;
  readonly _result?: R;
}

export interface Query<R = unknown> {
  readonly type: string;
  readonly _result?: R;
}

export type Result<T, E = PreflightException> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface HandlerContext {
  // injected per-request: db client, logger, idempotency key — extended in T-014
}

export interface CommandHandler<C extends Command<R>, R> {
  readonly commandType: C['type'];
  execute(command: C, ctx: HandlerContext): Promise<Result<R, PreflightException>>;
}

export interface QueryHandler<Q extends Query<R>, R> {
  readonly queryType: Q['type'];
  execute(query: Q, ctx: HandlerContext): Promise<R>;
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E extends PreflightException>(error: E): Result<never, E> {
  return { ok: false, error };
}
