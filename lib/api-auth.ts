import { createHash, timingSafeEqual } from 'node:crypto';

const BEARER_PREFIX = /^Bearer ([^\s]+)$/i;

export function isProtectedApiPath(pathname: string): boolean {
  return pathname === '/api/v1' || pathname.startsWith('/api/v1/');
}

export function hasValidApiAuthorization(
  authorization: string | null,
  configuredKey: string | undefined
): boolean {
  const match = authorization?.match(BEARER_PREFIX);
  if (!match || !configuredKey) {
    return false;
  }

  const providedDigest = createHash('sha256').update(match[1]).digest();
  const configuredDigest = createHash('sha256').update(configuredKey).digest();
  return timingSafeEqual(providedDigest, configuredDigest);
}

export function unauthorizedResponse(): Response {
  return Response.json(
    {
      error: 'UNAUTHORIZED',
      message: 'Valid bearer token required',
    },
    { status: 401 }
  );
}
