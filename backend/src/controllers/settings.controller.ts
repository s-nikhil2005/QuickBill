import { Response, NextFunction } from "express";
import { SettingsService } from "../services/settings.service";
import { AuthenticatedRequest } from "../types";

export class SettingsController {
  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const settings = await SettingsService.getSettings(businessId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const settings = await SettingsService.updateSettings(businessId, req.body);
      res.status(200).json({ success: true, message: "Settings updated successfully", data: settings });
    } catch (err) {
      next(err);
    }
  }

  static async getSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await SettingsService.getSubscription(businessId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
