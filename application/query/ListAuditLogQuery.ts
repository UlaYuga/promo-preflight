import { z } from 'zod';
import type { Query, QueryHandler, HandlerContext } from '../bus/types';
import type { IAuditRepository, AuditListFilter, AuditListResult } from '../port/IAuditRepository';

export interface AuditCursor {
  createdAt: string;
  id: string;
}

const AuditCursorSchema = z
  .object({
    createdAt: z.string().datetime(),
    id: z.string().min(1),
  })
  .strict();

export interface ListAuditLogQuery extends Query<AuditListResult> {
  readonly type: 'ListAuditLog';
  readonly filter: AuditListFilter;
}

export class ListAuditLogQueryHandler
  implements QueryHandler<ListAuditLogQuery, AuditListResult>
{
  readonly queryType = 'ListAuditLog';

  constructor(private readonly auditRepository: IAuditRepository) {}

  async execute(query: ListAuditLogQuery, _ctx: HandlerContext): Promise<AuditListResult> {
    void _ctx;
    return this.auditRepository.list(query.filter);
  }
}

export function encodeAuditCursor(cursor: AuditCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeAuditCursor(cursor: string): AuditCursor {
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid cursor encoding');
  }

  const parsed = AuditCursorSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error('Invalid cursor payload');
  }

  return parsed.data;
}
