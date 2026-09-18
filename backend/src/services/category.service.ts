import db from "../config/db";

export class CategoryService {
  static async getCategories(businessId: number) {
    const [rows]: any = await db.query(
      "SELECT * FROM categories WHERE business_id = ? ORDER BY name ASC",
      [businessId]
    );
    return rows;
  }

  static async createCategory(businessId: number, name: string, description?: string) {
    const cleanName = name.trim();
    const [result]: any = await db.query(
      "INSERT INTO categories (business_id, name, description) VALUES (?, ?, ?)",
      [businessId, cleanName, description || null]
    );
    const [rows]: any = await db.query("SELECT * FROM categories WHERE id = ?", [result.insertId]);
    return rows[0];
  }

  static async deleteCategory(businessId: number, categoryId: number) {
    // Nullify category on products first
    await db.query("UPDATE products SET category_id = NULL WHERE business_id = ? AND category_id = ?", [businessId, categoryId]);
    await db.query("DELETE FROM categories WHERE business_id = ? AND id = ?", [businessId, categoryId]);
    return { success: true, message: "Category deleted" };
  }
}
