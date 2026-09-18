import { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs: number;       // Window size in milliseconds
  max: number;            // Max requests per window
  message?: string;       // Custom rejection message
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const clients = new Map<string, ClientRecord>();
  const {
    windowMs,
    max,
    message = "Too many requests. Please try again later."
  } = options;

  // Periodic cleanup to avoid memory leak
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(key);
      }
    }
  }, Math.min(windowMs, 60000));
  interval.unref?.();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.ip || req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown");

    const now = Date.now();
    const record = clients.get(key);

    if (!record || now > record.resetTime) {
      clients.set(key, { count: 1, resetTime: now + windowMs });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        success: false,
        message,
        code: "TOO_MANY_REQUESTS",
        retryAfter
      });
      return;
    }

    next();
  };
};

// Preset limiters for critical authentication routes
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per 15 min (generous enough for shopkeeper, blocks brute-force)
  message: "Too many login attempts. Please wait a few minutes before trying again."
});

export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                   // 10 registrations per hour per IP
  message: "Too many account registrations from this IP. Please try again later."
});

export const otpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 OTP requests per 15 minutes
  message: "Too many OTP requests. Please wait 15 minutes before requesting again."
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 password reset attempts per 15 minutes
  message: "Too many password reset attempts. Please wait 15 minutes."
});
