const db = require("../config/db");

class UserModel {

  static async createUser({ name, email, password, role }) {
    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      name,
      email,
      password,
      role || "staff"
    ]);

    return result.insertId;
  }

  static async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ? LIMIT 1`;
    const [rows] = await db.query(sql, [email]);
    return rows[0];
  }

  static async findById(id) {
    const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  }

  static async updateById(userId, updates) {
    const fields = [];
    const values = [];

    for (const key in updates) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }

    values.push(userId);

    const sql = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = ?
    `;

    const [result] = await db.query(sql, values);
    return result;
  }

  static async updatePassword(email, hashedPassword) {
    const sql = `
      UPDATE users
      SET password = ?
      WHERE email = ?
    `;
    const [result] = await db.query(sql, [hashedPassword, email]);
    return result;
  }

  static async updatePasswordById(id, hashedPassword) {
    const sql = `
      UPDATE users
      SET password = ?
      WHERE id = ?
    `;
    const [result] = await db.query(sql, [hashedPassword, id]);
    return result;
  }
}

module.exports = UserModel;
