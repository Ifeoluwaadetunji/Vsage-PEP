import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only initialize if we have the token (prevents crashes during build/dev without keys)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

// Dummy ratelimiter for when redis is not configured
const dummyLimiter = {
  limit: async () => ({ success: true, limit: 100, remaining: 99, reset: 0 }),
};

export const loginRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/login",
}) : dummyLimiter;

export const mfaRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/mfa",
}) : dummyLimiter;

export const sendRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  analytics: true,
  prefix: "@upstash/ratelimit/send",
}) : dummyLimiter;

export const uploadRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 d"),
  analytics: true,
  prefix: "@upstash/ratelimit/upload",
}) : dummyLimiter;

export const downloadRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  analytics: true,
  prefix: "@upstash/ratelimit/download",
}) : dummyLimiter;
