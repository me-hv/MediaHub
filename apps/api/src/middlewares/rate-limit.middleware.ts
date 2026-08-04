import { MiddlewareHandler } from 'hono';
import { logger } from '../utils/logger';
import type { AppEnv } from '../app';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

export function createRateLimiter(limit: number, windowMs = 60000): MiddlewareHandler<AppEnv> {
  const store: RateLimitStore = {};

  return async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[ip].count += 1;
    }

    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, limit - store[ip].count).toString());

    if (store[ip].count > limit) {
      logger.warn({ ip, limit }, 'Rate limit exceeded');
      const requestId = c.get('requestId') || 'req-unknown';
      return c.json(
        {
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again in a minute.',
          timestamp: new Date().toISOString(),
          requestId,
        },
        429
      );
    }

    await next();
  };
}
