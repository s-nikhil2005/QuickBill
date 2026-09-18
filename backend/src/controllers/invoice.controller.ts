import { Response, NextFunction } from "express";
import { InvoiceService } from "../services/invoice.service";
import { AuthenticatedRequest } from "../types";

export class InvoiceController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { page, limit, search, status } = req.query;

      const data = await InvoiceService.getInvoices(businessId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
        search: search as string,
        status: status as string
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const invoiceId = parseInt(String(req.params.id), 10);
      const invoice = await InvoiceService.getInvoiceDetails(businessId, invoiceId);
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }

  static async renderPrint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const invoiceId = parseInt(String(req.params.id), 10);
      const invoice = await InvoiceService.getInvoiceDetails(businessId, invoiceId);
      const html = InvoiceService.renderInvoiceHtml(invoice, invoice.items);
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (err) {
      next(err);
    }
  }
}
