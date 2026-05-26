import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

describe('API authentication proxy', () => {
  const previousApiKey = process.env.PREFLIGHT_API_KEY;

  beforeEach(() => {
    process.env.PREFLIGHT_API_KEY = 'configured-api-key';
  });

  afterEach(() => {
    if (previousApiKey === undefined) {
      delete process.env.PREFLIGHT_API_KEY;
    } else {
      process.env.PREFLIGHT_API_KEY = previousApiKey;
    }
  });

  it('returns 401 for a protected API request without authorization', async () => {
    const response = proxy(
      new NextRequest('http://localhost/api/v1/stats', {
        headers: { 'x-real-ip': 'auth-missing' },
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'UNAUTHORIZED',
      message: 'Valid bearer token required',
    });
  });

  it('returns 401 without disclosing a wrong configured API key', async () => {
    const response = proxy(
      new NextRequest('http://localhost/api/v1/audit', {
        headers: {
          authorization: 'Bearer wrong-key',
          'x-real-ip': 'auth-invalid',
        },
      })
    );

    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain('configured-api-key');
  });

  it('throttles repeated unauthorized protected API requests from one IP', () => {
    const request = () =>
      proxy(
        new NextRequest('http://localhost/api/v1/audit', {
          headers: {
            authorization: 'Bearer wrong-rate-limited-key',
            'x-real-ip': 'auth-rate-limit-invalid-bearer',
          },
        })
      );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect(request().status).toBe(401);
    }

    expect(request().status).toBe(429);
  });

  it('does not allow rotating x-forwarded-for to bypass a client limit', () => {
    const request = (forwardedFor: string) =>
      proxy(
        new NextRequest('http://localhost/api/v1/audit', {
          headers: {
            authorization: 'Bearer wrong-rate-limited-key',
            'x-real-ip': 'railway-client-address',
            'x-forwarded-for': forwardedFor,
          },
        })
      );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect(request(`forged-${attempt}`).status).toBe(401);
    }

    expect(request('forged-after-limit').status).toBe(429);
  });

  it('fails closed when no API key is configured', () => {
    delete process.env.PREFLIGHT_API_KEY;

    const response = proxy(
      new NextRequest('http://localhost/api/v1/runs', {
        headers: {
          authorization: 'Bearer any-client-value',
          'x-real-ip': 'auth-unconfigured',
        },
      })
    );

    expect(response.status).toBe(401);
  });

  it('allows a request with the configured bearer API key', () => {
    const response = proxy(
      new NextRequest('http://localhost/api/v1/campaigns', {
        headers: {
          authorization: 'Bearer configured-api-key',
          'x-real-ip': 'auth-valid',
        },
      })
    );

    expect(response.status).not.toBe(401);
  });

  it.each(['/api/health', '/api/ready'])(
    'does not require bearer auth for %s',
    (path) => {
      delete process.env.PREFLIGHT_API_KEY;

      const response = proxy(
        new NextRequest(`http://localhost${path}`, {
          headers: { 'x-real-ip': `public-${path}` },
        })
      );

      expect(response.status).not.toBe(401);
    }
  );
});
