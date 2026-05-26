import { NextRequest, NextResponse } from "next/server";
import {
  hasValidApiAuthorization,
  isProtectedApiPath,
  unauthorizedResponse
} from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const WINDOW_SECONDS = parseInt(
  process.env.RATE_LIMIT_WINDOW_SECONDS ?? "60",
  10
);
const MAX_REQUESTS = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS ?? "20",
  10
);

function getRateLimitClientIp(request: NextRequest): string {
  // Railway Public Networking sets X-Real-IP to the client's remote IP.
  // Do not enforce limits using X-Forwarded-For, which callers can spoof.
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = getRateLimitClientIp(request);
  const result = checkRateLimit(ip, WINDOW_SECONDS, MAX_REQUESTS);

  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfterSeconds),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Window": String(WINDOW_SECONDS)
        }
      }
    );
  }

  if (
    isProtectedApiPath(request.nextUrl.pathname) &&
    !hasValidApiAuthorization(
      request.headers.get("authorization"),
      process.env.PREFLIGHT_API_KEY
    )
  ) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*"
};
