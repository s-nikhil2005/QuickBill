import { Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../types";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.membership) {
      res.status(403).json({
        success: false,
        message: "No business membership context found.",
        code: "MEMBERSHIP_REQUIRED"
      });
      return;
    }

    const userRole = req.membership.role;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Action requires one of [${allowedRoles.join(", ")}], but you have role '${userRole}'.`,
        code: "INSUFFICIENT_ROLE_PERMISSIONS"
      });
      return;
    }

    next();
  };
};
