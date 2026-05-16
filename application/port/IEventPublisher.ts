import type { PreflightEvent } from '../../domain/event/PreflightEvent';
import type { Transaction } from '../../infrastructure/persistence/types';

export interface IEventPublisher {
  publish(event: PreflightEvent, tx?: Transaction): Promise<void>;
  publishAll(events: PreflightEvent[], tx?: Transaction): Promise<void>;
}
