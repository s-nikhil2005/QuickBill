import { Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service";
import { AuthenticatedRequest } from "../types";

export class CustomerController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { name, phone, email, address, gstin } = req.body;

      if (!name) {
        res.status(400).json({ success: false, message: "Customer name is required", code: "VALIDATION_ERROR" });
        return;
      }

      const customer = await CustomerService.createCustomer(businessId, { name, phone, email, address, gstin });
      res.status(201).json({ success: true, message: "Customer created successfully", data: customer });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { search, page, limit } = req.query;

      const data = await CustomerService.getCustomers(businessId, {
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const customerId = parseInt(String(req.params.id), 10);
      const customer = await CustomerService.getCustomerProfile(businessId, customerId);
      res.status(200).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const customerId = parseInt(String(req.params.id), 10);
      const updated = await CustomerService.updateCustomer(businessId, customerId, req.body);
      res.status(200).json({ success: true, message: "Customer updated", data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const customerId = parseInt(String(req.params.id), 10);
      const result = await CustomerService.deleteCustomer(businessId, customerId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
