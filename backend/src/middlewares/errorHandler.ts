import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Unhandled API Error:", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_SERVER_ERROR";

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
};
