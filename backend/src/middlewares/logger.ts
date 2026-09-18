import { Request, Response, NextFunction } from "express";

// Keys to mask in logging and error reports
const SENSITIVE_KEYS = new Set([
  "password",
  "confirm_password",
  "token",
  "refresh_token",
  "authorization",
  "cookie",
  "otp",
  "secret",
  "pin",
  "cvv",
  "card_number"
]);

/**
 * Recursively clones and masks sensitive values in objects.
 */
export function sanitizeData(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Production-ready application request logger middleware.
 * Tracks requestId, method, path, response status, and duration.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime();
  
  // Assign or reuse Request ID
  const incomingId = req.headers["x-request-id"] as string;
  const requestId = incomingId || `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  (req as any).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  // Intercept finish to compute elapsed time
  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const durationMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(1);
    const timestamp = new Date().toISOString();
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Color/severity prefix based on HTTP status
    let statusMarker = "INFO";
    if (statusCode >= 500) {
      statusMarker = "ERROR";
    } else if (statusCode >= 400) {
      statusMarker = "WARN";
    }

    console.log(
      `[${timestamp}] [${statusMarker}] [${requestId}] ${method} ${url} ${statusCode} - ${durationMs}ms`
    );
  });

  next();
};
