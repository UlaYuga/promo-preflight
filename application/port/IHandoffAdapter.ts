import type { PreflightEvent } from '../../domain/event/PreflightEvent';

export interface IHandoffAdapter {
  notify(event: PreflightEvent): Promise<void>;
}
