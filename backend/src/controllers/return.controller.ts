import { Response, NextFunction } from "express";
import { ReturnService } from "../services/return.service";
import { AuthenticatedRequest } from "../types";

export class ReturnController {
  static async processReturn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { invoice_id, items, reason } = req.body;

      if (!invoice_id || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: "invoice_id and items are required", code: "VALIDATION_ERROR" });
        return;
      }

      const result = await ReturnService.processReturn(businessId, {
        invoice_id: parseInt(invoice_id, 10),
        items,
        reason,
        user_id: req.user?.id,
        store_id: req.storeId
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const returns = await ReturnService.getReturns(businessId);
      res.status(200).json({ success: true, data: returns });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const returnId = parseInt(String(req.params.id), 10);
      const data = await ReturnService.getReturnDetails(businessId, returnId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
