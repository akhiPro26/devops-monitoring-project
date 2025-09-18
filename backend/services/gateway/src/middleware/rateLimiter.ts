import rateLimit from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<any>,
    }),
    windowMs,
    max,
    message: {
      success: false,
      error: message || "Too many requests, please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Add skip successful requests option for better performance
    skipSuccessfulRequests: false,
    // Add skip failed requests option
    skipFailedRequests: false,
  })
}

// Pre-configured rate limiters
export const authLimiter = createRateLimiter(
  100, // 15 minutes
  200, // 5 attempts
  "Too many authentication attempts"
)

export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 100 requests
  "API rate limit exceeded"
)

export const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 10 requests
  "Rate limit exceeded for this endpoint"
)