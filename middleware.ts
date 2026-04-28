import { NextRequest } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = getClientIp(req);

  // Throttle credentials login attempts: 10 per IP per 15 minutes.
  if (path === "/api/auth/callback/credentials" && req.method === "POST") {
    const result = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!result.ok) return rateLimitResponse(result);
  }
}

export const config = {
  matcher: ["/api/auth/callback/:path*"],
};
