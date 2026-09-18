import { Response, NextFunction } from "express";
import { ReportService } from "../services/report.service";
import { AuthenticatedRequest } from "../types";

export class ReportController {
  static async getSalesReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { startDate, endDate, format } = req.query;

      const data = await ReportService.getSalesReport(businessId, {
        startDate: startDate as string,
        endDate: endDate as string
      });

      if (format === "csv") {
        const csv = ReportService.generateCsv(data);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=sales-report.csv");
        res.send(csv);
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getProfitReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { startDate, endDate, format } = req.query;

      const data = await ReportService.getProfitReport(businessId, {
        startDate: startDate as string,
        endDate: endDate as string
      });

      if (format === "csv") {
        const csv = ReportService.generateCsv(data);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=profit-report.csv");
        res.send(csv);
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getTaxReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const data = await ReportService.getTaxReport(businessId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
