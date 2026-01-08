const db = require("../config/db");

class SettingsModel {

  // Fetch settings (only one row)
  static async getSettings() {
    const [rows] = await db.query("SELECT * FROM settings LIMIT 1");
    return rows[0];
  }

  // Create initial settings
  static async createSettings(data) {
    const sql = `
      INSERT INTO settings 
      (business_name, owner_name, email, phone, address, gst_number, 
       invoice_prefix, invoice_start_number, tax_percentage, currency, footer_text, logo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      data.business_name,
      data.owner_name,
      data.email,
      data.phone,
      data.address,
      data.gst_number,
      data.invoice_prefix,
      data.invoice_start_number,
      data.tax_percentage,
      data.currency,
      data.footer_text,
      data.logo_url
    ]);
  }

  // Update settings
  static async updateSettings(data) {
    const sql = `
      UPDATE settings SET
      business_name = ?,
      owner_name = ?,
      email = ?,
      phone = ?,
      address = ?,
      gst_number = ?,
      invoice_prefix = ?,
      invoice_start_number = ?,
      tax_percentage = ?,
      currency = ?,
      footer_text = ?,
      logo_url = ?
      WHERE id = 1
    `;
    await db.query(sql, [
      data.business_name,
      data.owner_name,
      data.email,
      data.phone,
      data.address,
      data.gst_number,
      data.invoice_prefix,
      data.invoice_start_number,
      data.tax_percentage,
      data.currency,
      data.footer_text,
      data.logo_url
    ]);
  }
}

module.exports = SettingsModel;
