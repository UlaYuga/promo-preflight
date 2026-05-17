import type { Db } from '../db/client';

export type Transaction = Parameters<Parameters<Db['transaction']>[0]>[0];
