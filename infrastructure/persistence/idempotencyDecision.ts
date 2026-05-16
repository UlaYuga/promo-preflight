/**
 * Pure function — decides what to do given the result of an idempotency key
 * INSERT attempt. Extracted so the control-flow can be unit-tested without a
 * live database.
 */

export type IdempotencyDecision =
  | { type: 'claimed' }
  | { type: 'replay'; responseBody: unknown }
  | { type: 'conflict' }
  | { type: 'in_progress' };

export interface ExistingIdempotencyRow {
  requestHash: string;
  status: string;
  responseSnapshot: unknown;
}

/**
 * @param claimedCount  Number of rows returned by INSERT … ON CONFLICT DO NOTHING.
 *                      1 means we claimed the slot; 0 means the key already existed.
 * @param existing      The row read after a conflict (null only when claimedCount > 0).
 * @param bodyHash      SHA-256 of the current request body.
 */
export function decideIdempotency(
  claimedCount: number,
  existing: ExistingIdempotencyRow | null,
  bodyHash: string
): IdempotencyDecision {
  if (claimedCount > 0) {
    return { type: 'claimed' };
  }

  // Key existed before our INSERT — read what was there.
  if (!existing) {
    // Should never happen: ON CONFLICT fired but row is invisible.
    // Treat as in-progress (caller can surface a 503).
    return { type: 'in_progress' };
  }

  if (existing.requestHash !== bodyHash) {
    return { type: 'conflict' };
  }

  if (existing.status === 'completed') {
    return { type: 'replay', responseBody: existing.responseSnapshot };
  }

  // status === 'pending': the owning transaction hasn't committed yet
  // (concurrent request still in flight, or previous attempt crashed).
  return { type: 'in_progress' };
}
