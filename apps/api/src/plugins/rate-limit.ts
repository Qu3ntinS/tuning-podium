import { Elysia, status as httpStatus } from "elysia";
import { clientIpFromRequest } from "../lib/client-ip.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= max;
}

export function rateLimitPlugin(opts: {
  max: number;
  windowMs: number;
  prefix: string;
  trustProxy: boolean;
}) {
  return new Elysia({ name: `rate-limit-${opts.prefix}` }).onBeforeHandle(({ request }) => {
    const path = new URL(request.url).pathname;
    if (!path.startsWith(opts.prefix)) return;

    const ip = clientIpFromRequest(request, opts.trustProxy);
    const key = `${opts.prefix}:${ip}`;
    if (!checkRateLimit(key, opts.max, opts.windowMs)) {
      return httpStatus(429, { error: "Too many requests" });
    }
    return;
  });
}
