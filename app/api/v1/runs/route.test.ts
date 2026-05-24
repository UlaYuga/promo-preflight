import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const VALID_IDEMPOTENCY_KEY = '2a099960-d864-4d93-954f-1886bd5e980c';

describe('POST /api/v1/runs request boundary', () => {
  const previousMaxInputChars = process.env.MAX_INPUT_CHARS;

  afterEach(() => {
    if (previousMaxInputChars === undefined) {
      delete process.env.MAX_INPUT_CHARS;
    } else {
      process.env.MAX_INPUT_CHARS = previousMaxInputChars;
    }
  });

  it('rejects an oversized request before validating or executing its campaign', async () => {
    process.env.MAX_INPUT_CHARS = '20';
    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': VALID_IDEMPOTENCY_KEY },
        body: JSON.stringify({ invalid: 'this body is deliberately oversized' }),
      })
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: 'PAYLOAD_TOO_LARGE',
    });
  });

  it('rejects a non-UUID Idempotency-Key', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'arbitrary-long-idempotency-key' },
        body: '{}',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'BAD_REQUEST',
      message: 'Idempotency-Key must be a UUID',
    });
  });

  it('allows a UUID Idempotency-Key through header validation', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/v1/runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': VALID_IDEMPOTENCY_KEY },
        body: '{}',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'BAD_REQUEST',
      message: expect.stringContaining('Invalid request body'),
    });
  });
});
