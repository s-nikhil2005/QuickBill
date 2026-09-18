import { Response, NextFunction } from "express";
import { ExpenseService } from "../services/expense.service";
import { AuthenticatedRequest } from "../types";

export class ExpenseController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { title, category, amount, expense_date, notes } = req.body;

      if (!title || amount === undefined || !expense_date) {
        res.status(400).json({ success: false, message: "Title, amount, and expense_date are required.", code: "VALIDATION_ERROR" });
        return;
      }

      const expense = await ExpenseService.createExpense(businessId, {
        title,
        category,
        amount: parseFloat(amount),
        expense_date,
        notes,
        store_id: req.storeId,
        user_id: req.user?.id
      });

      res.status(201).json({ success: true, message: "Expense recorded successfully", data: expense });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { category, startDate, endDate, page, limit } = req.query;

      const data = await ExpenseService.getExpenses(businessId, {
        category: category as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const expenseId = parseInt(String(req.params.id), 10);
      const result = await ExpenseService.deleteExpense(businessId, expenseId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
