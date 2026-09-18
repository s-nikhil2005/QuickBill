import db from "../config/db";

export class ExpenseService {
  static async createExpense(businessId: number, data: {
    title: string;
    category: string;
    amount: number;
    expense_date: string;
    notes?: string;
    store_id?: number | null;
    user_id?: number;
  }) {
    const [result]: any = await db.query(
      `INSERT INTO expenses (business_id, store_id, title, category, amount, expense_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        businessId,
        data.store_id || null,
        data.title.trim(),
        data.category || "Other",
        data.amount,
        data.expense_date,
        data.notes || null,
        data.user_id || null
      ]
    );

    const [rows]: any = await db.query("SELECT * FROM expenses WHERE id = ?", [result.insertId]);
    return rows[0];
  }

  static async getExpenses(businessId: number, options: {
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    let sql = `
      SELECT e.*, u.name AS created_by_name
      FROM expenses e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE e.business_id = ?
    `;
    const params: any[] = [businessId];

    if (options.category) {
      sql += " AND e.category = ?";
      params.push(options.category);
    }

    if (options.startDate) {
      sql += " AND e.expense_date >= ?";
      params.push(options.startDate);
    }

    if (options.endDate) {
      sql += " AND e.expense_date <= ?";
      params.push(options.endDate);
    }

    const countSql = sql.replace("SELECT e.*, u.name AS created_by_name", "SELECT COUNT(*) as total");
    const [countRows]: any = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 50;
    const offset = (page - 1) * limit;

    sql += " ORDER BY e.expense_date DESC, e.id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows]: any = await db.query(sql, params);

    // Calculate totals
    const [totalRows]: any = await db.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_expense FROM expenses WHERE business_id = ?",
      [businessId]
    );

    return {
      expenses: rows,
      total_expense: parseFloat(totalRows[0].total_expense),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async deleteExpense(businessId: number, expenseId: number) {
    await db.query("DELETE FROM expenses WHERE business_id = ? AND id = ?", [businessId, expenseId]);
    return { success: true, message: "Expense record deleted" };
  }
}
