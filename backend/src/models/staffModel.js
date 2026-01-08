const db = require("../config/db");

class StaffModel {

  static async createStaff(data) {
    const sql = `
      INSERT INTO staff (name, email, password, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.name,
      data.email,
      data.password,
      data.phone,
      data.role
    ]);
    return result.insertId;
  }

  static async getAllStaff() {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, role, active FROM staff"
    );
    return rows;
  }

  static async getStaffById(id) {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, role, active FROM staff WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async updateStaff(id, data) {
    const sql = `
      UPDATE staff
      SET name=?, email=?, phone=?, role=?
      WHERE id=?
    `;
    await db.query(sql, [
      data.name,
      data.email,
      data.phone,
      data.role,
      id
    ]);
  }

  static async deactivateStaff(id) {
    await db.query("UPDATE staff SET active = 0 WHERE id = ?", [id]);
  }

  static async deleteStaff(id) {
    await db.query("DELETE FROM staff WHERE id = ?", [id]);
  }
}

module.exports = StaffModel;
