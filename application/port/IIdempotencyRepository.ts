export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  responseSnapshot: unknown;
  createdAt: string;
}

export interface IIdempotencyRepository {
  find(key: string): Promise<IdempotencyRecord | null>;
  save(record: Omit<IdempotencyRecord, 'createdAt'>): Promise<void>;
}
