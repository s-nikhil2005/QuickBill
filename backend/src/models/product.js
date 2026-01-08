const db = require("../config/db");

class ProductModel {

  // --------------------------------------------------
  // CREATE PRODUCT
  // --------------------------------------------------
  static async createProduct(data) {
    const sql = `
      INSERT INTO products (name, category, brand, size, color, price, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.name,
      data.category,
      data.brand,
      data.size,
      data.color,
      data.price,
      data.stock
    ];

    const [result] = await db.query(sql, values);
    return result.insertId;
  }

  // --------------------------------------------------
  // VIEW ALL PRODUCTS
  // --------------------------------------------------
  static async getAllProducts() {
    const [rows] = await db.query("SELECT * FROM products ORDER BY id DESC");
    return rows;
  }

  // --------------------------------------------------
  // VIEW SINGLE PRODUCT
  // --------------------------------------------------
  static async getProductById(id) {
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    return rows[0];
  }

  // --------------------------------------------------
  // UPDATE PRODUCT DETAILS
  // --------------------------------------------------
  static async updateProductDetails(id, data) {
    let sql = "UPDATE products SET ";
    const values = [];

    Object.keys(data).forEach((field, index) => {
      sql += `${field} = ?`;
      values.push(data[field]);

      if (index < Object.keys(data).length - 1) {
        sql += ", ";
      }
    });

    sql += " WHERE id = ?";
    values.push(id);

    await db.query(sql, values);
  }

  // --------------------------------------------------
  // UPDATE STOCK
  // --------------------------------------------------
  static async updateStock(id, stock) {
    const sql = "UPDATE products SET stock = ? WHERE id = ?";
    await db.query(sql, [stock, id]);
  }

  // --------------------------------------------------
  // DELETE PRODUCT
  // --------------------------------------------------
  static async deleteProduct(id) {
    await db.query("DELETE FROM products WHERE id = ?", [id]);
  }

  // --------------------------------------------------
  // SEARCH PRODUCTS
  // --------------------------------------------------
  static async searchProducts(filters) {
    let sql = "SELECT * FROM products WHERE 1=1";
    const values = [];

    if (filters.name) {
      sql += " AND name LIKE ?";
      values.push(`%${filters.name}%`);
    }
    if (filters.brand) {
      sql += " AND brand LIKE ?";
      values.push(`%${filters.brand}%`);
    }
    if (filters.category) {
      sql += " AND category LIKE ?";
      values.push(`%${filters.category}%`);
    }
    if (filters.color) {
      sql += " AND color LIKE ?";
      values.push(`%${filters.color}%`);
    }
    if (filters.size) {
      sql += " AND size LIKE ?";
      values.push(`%${filters.size}%`);
    }

    const [rows] = await db.query(sql, values);
    return rows;
  }

  // --------------------------------------------------
  // FILTER PRODUCTS
  // --------------------------------------------------
  static async filterProducts(filters) {
    let sql = "SELECT * FROM products WHERE 1=1";
    const values = [];

    if (filters.category) {
      sql += " AND category = ?";
      values.push(filters.category);
    }

    if (filters.priceMin) {
      sql += " AND price >= ?";
      values.push(filters.priceMin);
    }

    if (filters.priceMax) {
      sql += " AND price <= ?";
      values.push(filters.priceMax);
    }

    if (filters.stockMin) {
      sql += " AND stock >= ?";
      values.push(filters.stockMin);
    }

    if (filters.stockMax) {
      sql += " AND stock <= ?";
      values.push(filters.stockMax);
    }

    const [rows] = await db.query(sql, values);
    return rows;
  }

  // --------------------------------------------------
  // SORT PRODUCTS
  // --------------------------------------------------
  static async sortProducts(by, order) {
    const sql = `SELECT * FROM products ORDER BY ${by} ${order}`;
    const [rows] = await db.query(sql);
    return rows;
  }

  // --------------------------------------------------
  // BULK DELETE
  // --------------------------------------------------
  static async bulkDelete(ids) {
    const sql = "DELETE FROM products WHERE id IN (?)";
    await db.query(sql, [ids]);
  }

  // --------------------------------------------------
  // BULK UPDATE
  // --------------------------------------------------
  static async bulkUpdate(ids, updates) {
    let sql = "UPDATE products SET ";
    const values = [];

    Object.keys(updates).forEach((field, index) => {
      sql += `${field} = ?`;
      values.push(updates[field]);

      if (index < Object.keys(updates).length - 1) sql += ", ";
    });

    sql += " WHERE id IN (?)";
    values.push(ids);

    await db.query(sql, values);
  }
}

module.exports = ProductModel;
