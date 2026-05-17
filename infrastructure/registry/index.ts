import { Bus } from '../../application/bus/Bus';
import { HandlerRegistry } from '../../application/bus/HandlerRegistry';
import { handler as runChecksHandler } from '../handler/checks/RunChecksHandler';

export function createRegistry(): HandlerRegistry {
  const registry = new HandlerRegistry();
  registry.register(runChecksHandler);
  return registry;
}

export function createBus(): Bus {
  return new Bus(createRegistry());
}
