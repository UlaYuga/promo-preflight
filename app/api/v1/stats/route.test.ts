import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/v1/stats', () => {
  it('returns zeroed stats when DATABASE_URL is not configured', async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const response = await GET();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        totalRuns: 0,
        totalEvents: 0,
        lastEventAt: null,
        runP95LatencyMs: null,
      });
    } finally {
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
    }
  });
});
