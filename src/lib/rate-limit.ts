// In-memory sliding-window rate limiter.
//
// LIMITATIONS:
// - State lives in process memory: cold starts on Vercel reset counters,
//   and multiple serverless instances don't share state.
// - Good enough to stop a single attacker hammering one box; not enough
//   for distributed brute force at scale. Swap for @upstash/ratelimit
//   when you outgrow this.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the Map doesn't grow unbounded.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k);
  }
}, 60_000);
// Don't keep the event loop alive just for cleanup.
if (typeof cleanup.unref === "function") cleanup.unref();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
      remaining: 0,
    };
  }

  bucket.count++;
  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: limit - bucket.count,
  };
}

export function getClientIp(req: Request | { headers: Headers }): string {
  const h = "headers" in req ? req.headers : new Headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") || "unknown";
}

import { NextResponse } from "next/server";

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: "For mange forsøk. Prøv igjen senere." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}
