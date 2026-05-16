import type { Run } from '../../domain/model/Run';

export interface IRunRepository {
  save(run: Run): Promise<void>;
  findById(id: string): Promise<Run | null>;
}
