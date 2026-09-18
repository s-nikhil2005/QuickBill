import db from "../config/db";
import { IProduct } from "../types";

export class ProductService {
  static async createProduct(businessId: number, data: {
    name: string;
    category_id?: number | null;
    sku?: string | null;
    barcode?: string | null;
    brand?: string | null;
    description?: string | null;
    cost_price?: number;
    selling_price: number;
    tax_rate?: number;
    discount?: number;
    current_stock?: number;
    min_stock_level?: number;
    unit?: string;
    image_url?: string | null;
    store_id?: number | null;
    user_id?: number;
  }): Promise<IProduct> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const sku = data.sku ? data.sku.trim() : `SKU-${Date.now().toString().slice(-6)}`;
      const barcode = data.barcode ? data.barcode.trim() : null;
      const initialStock = data.current_stock || 0;

      const [result]: any = await connection.query(
        `INSERT INTO products 
         (business_id, store_id, category_id, name, sku, barcode, brand, description, 
          cost_price, selling_price, tax_rate, discount, current_stock, min_stock_level, unit, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          businessId,
          data.store_id || null,
          data.category_id || null,
          data.name.trim(),
          sku,
          barcode,
          data.brand || null,
          data.description || null,
          data.cost_price || 0,
          data.selling_price,
          data.tax_rate || 0,
          data.discount || 0,
          initialStock,
          data.min_stock_level !== undefined ? data.min_stock_level : 5,
          data.unit || "pcs",
          data.image_url || null
        ]
      );

      const productId = result.insertId;

      // Log initial inventory movement if stock > 0
      if (initialStock > 0) {
        await connection.query(
          `INSERT INTO inventory_movements 
           (business_id, store_id, product_id, type, quantity_change, quantity_before, quantity_after, reference_type, notes, created_by)
           VALUES (?, ?, ?, 'PURCHASE', ?, 0, ?, 'INITIAL_STOCK', 'Initial product stock creation', ?)`,
          [businessId, data.store_id || null, productId, initialStock, initialStock, data.user_id || null]
        );
      }

      await connection.commit();

      return await this.getProductById(businessId, productId);
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getProducts(businessId: number, options: {
    search?: string;
    category_id?: number;
    low_stock?: boolean;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: "ASC" | "DESC";
  } = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 50;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.business_id = ? AND p.is_active = 1
    `;
    const params: any[] = [businessId];

    if (options.search) {
      sql += " AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.brand LIKE ?)";
      const term = `%${options.search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (options.category_id) {
      sql += " AND p.category_id = ?";
      params.push(options.category_id);
    }

    if (options.low_stock) {
      sql += " AND p.current_stock <= p.min_stock_level";
    }

    // Count query
    const countSql = sql.replace("SELECT p.*, c.name AS category_name", "SELECT COUNT(*) as total");
    const [countRows]: any = await db.query(countSql, params);
    const total = countRows[0].total;

    // Sorting
    const allowedSort = ["name", "selling_price", "current_stock", "created_at"];
    const sortBy = allowedSort.includes(options.sort_by || "") ? options.sort_by : "p.id";
    const sortOrder = options.sort_order === "ASC" ? "ASC" : "DESC";

    sql += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows]: any = await db.query(sql, params);

    return {
      products: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getProductById(businessId: number, productId: number): Promise<IProduct> {
    const [rows]: any = await db.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.business_id = ? AND p.id = ? AND p.is_active = 1
       LIMIT 1`,
      [businessId, productId]
    );

    if (!rows || rows.length === 0) {
      throw { statusCode: 404, message: "Product not found", code: "PRODUCT_NOT_FOUND" };
    }
    return rows[0];
  }

  static async getProductByBarcode(businessId: number, barcode: string): Promise<IProduct | null> {
    const [rows]: any = await db.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.business_id = ? AND (p.barcode = ? OR p.sku = ?) AND p.is_active = 1
       LIMIT 1`,
      [businessId, barcode.trim(), barcode.trim()]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  static async updateProduct(businessId: number, productId: number, data: Partial<IProduct>) {
    await this.getProductById(businessId, productId);

    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      "name", "category_id", "sku", "barcode", "brand", "description",
      "cost_price", "selling_price", "tax_rate", "discount", "min_stock_level", "unit", "image_url"
    ];

    for (const key of allowed) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push((data as any)[key]);
      }
    }

    if (fields.length > 0) {
      values.push(businessId, productId);
      await db.query(`UPDATE products SET ${fields.join(", ")} WHERE business_id = ? AND id = ?`, values);
    }

    return await this.getProductById(businessId, productId);
  }

  static async deleteProduct(businessId: number, productId: number) {
    await this.getProductById(businessId, productId);
    // Soft delete so invoice and order histories remain preserved
    await db.query("UPDATE products SET is_active = 0 WHERE business_id = ? AND id = ?", [businessId, productId]);
    return { success: true, message: "Product deleted successfully" };
  }
}
