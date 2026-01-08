const db = require("../config/db");

class ReturnModel {

  // Create return entry
  static async createReturn(invoice_id, reason, total_refund) {
    const sql = `
      INSERT INTO returns (invoice_id, reason, total_refund)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sql, [invoice_id, reason, total_refund]);
    return result.insertId;
  }

  // Add return items
  static async addReturnItem(return_id, product_id, quantity, refund_amount) {
    const sql = `
      INSERT INTO return_items (return_id, product_id, quantity, refund_amount)
      VALUES (?, ?, ?, ?)
    `;
    await db.query(sql, [return_id, product_id, quantity, refund_amount]);
  }

  // Get items from invoice
  static async getInvoiceItems(invoiceId) {
    const sql = `SELECT * FROM invoice_items WHERE invoice_id = ?`;
    const [rows] = await db.query(sql, [invoiceId]);
    return rows;
  }

  // Get all return records
  static async getAllReturns() {
    const [rows] = await db.query(`SELECT * FROM returns ORDER BY id DESC`);
    return rows;
  }

  // Get return details
  static async getReturnDetails(returnId) {
    const [returnData] = await db.query(
      "SELECT * FROM returns WHERE id = ?",
      [returnId]
    );

    const [items] = await db.query(
      "SELECT * FROM return_items WHERE return_id = ?",
      [returnId]
    );

    return { return: returnData[0], items };
  }
}

module.exports = ReturnModel;
