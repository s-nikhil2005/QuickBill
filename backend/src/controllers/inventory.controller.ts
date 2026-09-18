import { Response, NextFunction } from "express";
import { InventoryService } from "../services/inventory.service";
import { AuthenticatedRequest } from "../types";

export class InventoryController {
  static async adjustStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { product_id, type, quantity, is_deduction, notes } = req.body;

      if (!product_id || !type || quantity === undefined) {
        res.status(400).json({ success: false, message: "product_id, type, and quantity are required.", code: "VALIDATION_ERROR" });
        return;
      }

      const result = await InventoryService.adjustStock(businessId, {
        product_id: parseInt(product_id, 10),
        type,
        quantity: parseInt(quantity, 10),
        is_deduction: Boolean(is_deduction),
        notes,
        store_id: req.storeId,
        user_id: req.user?.id
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getMovements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { product_id, type, page, limit } = req.query;

      const result = await InventoryService.getMovements(businessId, {
        product_id: product_id ? parseInt(product_id as string, 10) : undefined,
        type: type as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50
      });

      res.status(200).json({
        success: true,
        data: result.movements,
        movements: result.movements,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLowStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const alerts = await InventoryService.getLowStockAlerts(businessId);
      res.status(200).json({ success: true, data: alerts });
    } catch (err) {
      next(err);
    }
  }
}
