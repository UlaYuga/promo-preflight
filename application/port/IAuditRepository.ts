import type { PreflightEvent } from '../../domain/event/PreflightEvent';

export interface AuditEntry {
  id: string;
  eventType: string;
  payload: PreflightEvent;
  actor: string | null;
  createdAt: string;
}

export interface AuditListFilter {
  eventType?: string;
  limit: number;
  cursor?: string;
}

export interface AuditListResult {
  items: AuditEntry[];
  nextCursor: string | null;
}

/**
 * Append-only audit contract.
 * No update/delete methods by design.
 */
export interface IAuditRepository {
  append(event: PreflightEvent, actor?: string): Promise<void>;
  list(filter: AuditListFilter): Promise<AuditListResult>;
}
