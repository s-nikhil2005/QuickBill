import { Response, NextFunction } from "express";
import db from "../config/db";
import { AuthenticatedRequest, IBusinessMember } from "../types";

export const tenantGuard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawBusinessId =
      req.headers["x-business-id"] ||
      req.query.businessId ||
      req.body?.businessId;

    if (!rawBusinessId) {
      res.status(400).json({
        success: false,
        message: "Business identifier (x-business-id header) is required.",
        code: "MISSING_TENANT_ID"
      });
      return;
    }

    const businessId = parseInt(String(rawBusinessId), 10);
    if (isNaN(businessId) || businessId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid business identifier.",
        code: "INVALID_TENANT_ID"
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
        code: "UNAUTHORIZED"
      });
      return;
    }

    // Verify membership
    const [rows]: any = await db.query(
      `SELECT bm.id, bm.business_id, bm.user_id, bm.store_id, bm.role, bm.status
       FROM business_members bm
       WHERE bm.business_id = ? AND bm.user_id = ?
       LIMIT 1`,
      [businessId, req.user.id]
    );

    if (!rows || rows.length === 0) {
      res.status(403).json({
        success: false,
        message: "You do not have access to this business workspace.",
        code: "TENANT_ACCESS_DENIED"
      });
      return;
    }

    const membership: IBusinessMember = rows[0];

    if (membership.status !== "ACTIVE") {
      res.status(403).json({
        success: false,
        message: "Your membership in this business is inactive or suspended.",
        code: "MEMBERSHIP_INACTIVE"
      });
      return;
    }

    req.businessId = businessId;
    req.membership = membership;
    req.storeId = membership.store_id || null;

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error verifying tenant authorization.",
      code: "TENANT_VERIFICATION_ERROR",
      error: err.message
    });
  }
};
