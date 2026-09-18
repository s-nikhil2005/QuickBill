import db from "../config/db";

export class InventoryService {
  static async adjustStock(businessId: number, data: {
    product_id: number;
    type: "PURCHASE" | "RESTOCK" | "ADJUSTMENT" | "DAMAGE" | "RETURN";
    quantity: number; // positive number for how much is changed
    is_deduction?: boolean;
    notes?: string;
    store_id?: number | null;
    user_id?: number;
  }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock product row for update
      const [pRows]: any = await connection.query(
        "SELECT id, name, current_stock, min_stock_level FROM products WHERE business_id = ? AND id = ? AND is_active = 1 FOR UPDATE",
        [businessId, data.product_id]
      );

      if (!pRows || pRows.length === 0) {
        throw { statusCode: 404, message: "Product not found", code: "PRODUCT_NOT_FOUND" };
      }

      const product = pRows[0];
      const qty = Math.abs(data.quantity);
      const isNegative = data.is_deduction || data.type === "DAMAGE";
      const quantityChange = isNegative ? -qty : qty;
      const quantityBefore = product.current_stock;
      const quantityAfter = quantityBefore + quantityChange;

      if (quantityAfter < 0) {
        throw {
          statusCode: 400,
          message: `Cannot deduct ${qty} items. Current stock is only ${quantityBefore}.`,
          code: "INSUFFICIENT_STOCK"
        };
      }

      // Update product current stock
      await connection.query(
        "UPDATE products SET current_stock = ? WHERE business_id = ? AND id = ?",
        [quantityAfter, businessId, data.product_id]
      );

      // Record movement
      const [movResult]: any = await connection.query(
        `INSERT INTO inventory_movements 
         (business_id, store_id, product_id, type, quantity_change, quantity_before, quantity_after, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          data.store_id || null,
          data.product_id,
          data.type,
          quantityChange,
          quantityBefore,
          quantityAfter,
          data.notes || `Stock adjustment (${data.type})`,
          data.user_id || null
        ]
      );

      await connection.commit();

      return {
        success: true,
        movement_id: movResult.insertId,
        product_id: data.product_id,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        quantity_change: quantityChange
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getMovements(businessId: number, options: {
    product_id?: number;
    type?: string;
    limit?: number;
    page?: number;
  } = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 50;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT im.*, p.name AS product_name, p.sku AS product_sku, u.name AS created_by_name
      FROM inventory_movements im
      JOIN products p ON p.id = im.product_id
      LEFT JOIN users u ON u.id = im.created_by
      WHERE im.business_id = ?
    `;
    const params: any[] = [businessId];

    if (options.product_id) {
      sql += " AND im.product_id = ?";
      params.push(options.product_id);
    }

    if (options.type) {
      sql += " AND im.type = ?";
      params.push(options.type);
    }

    const countSql = sql.replace(
      "SELECT im.*, p.name AS product_name, p.sku AS product_sku, u.name AS created_by_name",
      "SELECT COUNT(*) as total"
    );
    const [countRows]: any = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    sql += " ORDER BY im.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows]: any = await db.query(sql, params);
    return {
      movements: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getLowStockAlerts(businessId: number) {
    const [rows]: any = await db.query(
      `SELECT id, name, sku, barcode, current_stock, min_stock_level, unit
       FROM products
       WHERE business_id = ? AND is_active = 1 AND current_stock <= min_stock_level
       ORDER BY current_stock ASC`,
      [businessId]
    );
    return rows;
  }
}
