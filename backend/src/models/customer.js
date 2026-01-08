const db = require("../config/db");

class CustomerModel {

  static async createCustomer(data) {
    const sql = `
      INSERT INTO customers (name, phone, email)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sql, [data.name, data.phone, data.email]);
    return result.insertId;
  }

  static async getAllCustomers() {
    const [rows] = await db.query("SELECT * FROM customers ORDER BY id DESC");
    return rows;
  }

  static async getCustomerById(id) {
    const [rows] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    return rows[0];
  }

  static async updateCustomer(id, data) {
    const sql = `
      UPDATE customers
      SET name = ?, phone = ?, email = ?
      WHERE id = ?
    `;
    await db.query(sql, [data.name, data.phone, data.email, id]);
  }

  static async deleteCustomer(id) {
    await db.query("DELETE FROM customers WHERE id = ?", [id]);
  }

  static async searchCustomers(filters) {
    let sql = "SELECT * FROM customers WHERE 1=1";
    const values = [];

    if (filters.name) {
      sql += " AND name LIKE ?";
      values.push(`%${filters.name}%`);
    }

    if (filters.phone) {
      sql += " AND phone LIKE ?";
      values.push(`%${filters.phone}%`);
    }

    const [rows] = await db.query(sql, values);
    return rows;
  }
}

module.exports = CustomerModel;
