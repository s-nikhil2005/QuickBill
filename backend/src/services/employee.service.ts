import bcrypt from "bcrypt";
import db from "../config/db";
import { UserRole } from "../types";

export class EmployeeService {
  static async getEmployees(businessId: number) {
    const [rows]: any = await db.query(
      `SELECT bm.id, bm.business_id, bm.user_id, bm.role, bm.status, bm.created_at,
              u.name, u.email, u.phone
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id = ?
       ORDER BY bm.id ASC`,
      [businessId]
    );
    return rows;
  }

  static async addEmployee(businessId: number, data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: UserRole;
    store_id?: number | null;
  }) {
    const cleanEmail = data.email.toLowerCase().trim();

    // Check if user already exists
    let userId: number;
    const [userRows]: any = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [cleanEmail]);

    if (userRows && userRows.length > 0) {
      userId = userRows[0].id;
    } else {
      const initialPassword = data.password || "QuickBill@123";
      const hashedPassword = await bcrypt.hash(initialPassword, 10);

      const [res]: any = await db.query(
        "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
        [data.name.trim(), cleanEmail, hashedPassword, data.phone || null]
      );
      userId = res.insertId;
    }

    // Check if member already exists in business
    const [memRows]: any = await db.query(
      "SELECT id FROM business_members WHERE business_id = ? AND user_id = ? LIMIT 1",
      [businessId, userId]
    );

    if (memRows && memRows.length > 0) {
      throw { statusCode: 400, message: "User is already a member of this business.", code: "MEMBER_ALREADY_EXISTS" };
    }

    const [insertResult]: any = await db.query(
      `INSERT INTO business_members (business_id, user_id, store_id, role, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [businessId, userId, data.store_id || null, data.role || "STAFF"]
    );

    return {
      id: insertResult.insertId,
      business_id: businessId,
      user_id: userId,
      name: data.name,
      email: cleanEmail,
      role: data.role,
      status: "ACTIVE"
    };
  }

  static async updateRole(businessId: number, memberId: number, role: UserRole) {
    const [memRows]: any = await db.query(
      "SELECT id, role FROM business_members WHERE business_id = ? AND id = ? LIMIT 1",
      [businessId, memberId]
    );

    if (!memRows || memRows.length === 0) {
      throw { statusCode: 404, message: "Employee not found in this business", code: "MEMBER_NOT_FOUND" };
    }

    await db.query("UPDATE business_members SET role = ? WHERE id = ?", [role, memberId]);
    return { success: true, message: `Role updated to ${role}` };
  }

  static async setStatus(businessId: number, memberId: number, status: "ACTIVE" | "DEACTIVATED") {
    const [memRows]: any = await db.query(
      "SELECT id FROM business_members WHERE business_id = ? AND id = ? LIMIT 1",
      [businessId, memberId]
    );

    if (!memRows || memRows.length === 0) {
      throw { statusCode: 404, message: "Employee not found", code: "MEMBER_NOT_FOUND" };
    }

    await db.query("UPDATE business_members SET status = ? WHERE id = ?", [status, memberId]);
    return { success: true, message: `Employee status set to ${status}` };
  }

  static async removeEmployee(businessId: number, memberId: number) {
    const [memRows]: any = await db.query(
      "SELECT id, role FROM business_members WHERE business_id = ? AND id = ? LIMIT 1",
      [businessId, memberId]
    );

    if (!memRows || memRows.length === 0) {
      throw { statusCode: 404, message: "Employee not found", code: "MEMBER_NOT_FOUND" };
    }

    if (memRows[0].role === "OWNER") {
      throw { statusCode: 400, message: "Cannot remove the business owner.", code: "CANNOT_REMOVE_OWNER" };
    }

    await db.query("DELETE FROM business_members WHERE id = ?", [memberId]);
    return { success: true, message: "Employee removed from business" };
  }
}
