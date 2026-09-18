import { Response, NextFunction } from "express";
import { BusinessService } from "../services/business.service";
import { AuthenticatedRequest } from "../types";

export class BusinessController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHORIZED" });
        return;
      }

      const { name, business_type, phone, email, address, city, state, country, gstin, currency, invoice_prefix, tax_percentage, logo_url } = req.body;

      if (!name) {
        res.status(400).json({ success: false, message: "Business name is required", code: "VALIDATION_ERROR" });
        return;
      }

      const business = await BusinessService.createBusiness(req.user.id, {
        name,
        business_type,
        phone,
        email,
        address,
        city,
        state,
        country,
        gstin,
        currency,
        invoice_prefix,
        tax_percentage,
        logo_url
      });

      res.status(201).json({
        success: true,
        message: "Business created successfully",
        data: business
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const business = await BusinessService.getBusiness(businessId);
      res.status(200).json({ success: true, data: business });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const updated = await BusinessService.updateBusiness(businessId, req.body);
      res.status(200).json({ success: true, message: "Business updated successfully", data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getStores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const stores = await BusinessService.getStores(businessId);
      res.status(200).json({ success: true, data: stores });
    } catch (err) {
      next(err);
    }
  }
}
