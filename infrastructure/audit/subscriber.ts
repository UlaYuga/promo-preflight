import type { IAuditRepository } from '../../application/port/IAuditRepository';
import type { PreflightEvent } from '../../domain/event/PreflightEvent';

export type AuditSubscriber = (event: PreflightEvent) => Promise<void>;

export function createAuditSubscriber(
  auditRepository: IAuditRepository,
  actor = 'system'
): AuditSubscriber {
  return async (event: PreflightEvent): Promise<void> => {
    await auditRepository.append(event, actor);
  };
}

export async function appendAuditEvent(
  auditRepository: IAuditRepository,
  event: PreflightEvent,
  actor?: string
): Promise<void> {
  await auditRepository.append(event, actor);
}
