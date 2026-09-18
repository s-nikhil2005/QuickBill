import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../config/db";
import { AuthenticatedRequest, IUser } from "../types";

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token && req.query.token) {
      token = String(req.query.token);
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
        code: "UNAUTHORIZED"
      });
      return;
    }

    const secret = process.env.JWT_SECRET || "quickbill_default_jwt_secret";
    const decoded = jwt.verify(token, secret) as { userId: number };

    const [rows]: any = await db.query(
      "SELECT id, name, email, phone, avatar_url, is_active FROM users WHERE id = ? LIMIT 1",
      [decoded.userId]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "User account not found or deactivated.",
        code: "USER_NOT_FOUND"
      });
      return;
    }

    const user: IUser = rows[0];
    if (!user.is_active) {
      res.status(403).json({
        success: false,
        message: "Your account is deactivated.",
        code: "ACCOUNT_DEACTIVATED"
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please log in again.",
      code: "INVALID_TOKEN",
      error: err.message
    });
  }
};

export default authenticateUser;
