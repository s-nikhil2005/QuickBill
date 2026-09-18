import { Response, NextFunction } from "express";
import { OrderService } from "../services/order.service";
import { AuthenticatedRequest } from "../types";

export class BillingController {
  static async checkout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { customer_id, customer_name, customer_phone, items, cart_discount, payment_method, payment_status, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: "Cart items are required for checkout.", code: "VALIDATION_ERROR" });
        return;
      }

      if (!payment_method) {
        res.status(400).json({ success: false, message: "Payment method is required.", code: "VALIDATION_ERROR" });
        return;
      }

      const result = await OrderService.checkout(
        businessId,
        {
          customer_id,
          customer_name,
          customer_phone,
          items,
          cart_discount: parseFloat(cart_discount || 0),
          payment_method,
          payment_status,
          notes
        },
        req.user?.id,
        req.storeId
      );

      res.status(201).json({
        success: true,
        message: "Order placed and invoice generated successfully!",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { page, limit, search, payment_status } = req.query;

      const data = await OrderService.getOrders(businessId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
        search: search as string,
        payment_status: payment_status as string
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const orderId = parseInt(String(req.params.id), 10);
      const order = await OrderService.getOrderDetails(businessId, orderId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
}
