import { Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service";
import { AuthenticatedRequest } from "../types";

export class DashboardController {
  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await DashboardService.getOverview(businessId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
