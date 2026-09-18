import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db";
import { IUser } from "../types";

export class AuthService {
  static generateToken(userId: number): string {
    const secret = process.env.JWT_SECRET || "quickbill_default_jwt_secret";
    return jwt.sign({ userId }, secret, { expiresIn: "7d" });
  }

  static async register(data: { name: string; email: string; password: string; phone?: string }) {
    const { name, email, password, phone } = data;

    // Check existing
    const [existing]: any = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email.toLowerCase().trim()]
    );

    if (existing && existing.length > 0) {
      throw { statusCode: 400, message: "User with this email already exists", code: "USER_ALREADY_EXISTS" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result]: any = await db.query(
      "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null]
    );

    const userId = result.insertId;
    const token = this.generateToken(userId);

    const [userRows]: any = await db.query(
      "SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?",
      [userId]
    );

    return { user: userRows[0], token };
  }

  static async login(email: string, password: string) {
    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email.toLowerCase().trim()]
    );

    if (!rows || rows.length === 0) {
      throw { statusCode: 401, message: "Invalid email or password", code: "INVALID_CREDENTIALS" };
    }

    const user = rows[0];

    if (!user.is_active) {
      throw { statusCode: 403, message: "Account is deactivated", code: "ACCOUNT_DEACTIVATED" };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw { statusCode: 401, message: "Invalid email or password", code: "INVALID_CREDENTIALS" };
    }

    const token = this.generateToken(user.id);
    const { password: _, ...safeUser } = user;

    // Fetch user's businesses
    const [businesses]: any = await db.query(
      `SELECT b.id, b.name, b.slug, b.business_type, b.currency, b.invoice_prefix, bm.role, bm.status
       FROM businesses b
       JOIN business_members bm ON bm.business_id = b.id
       WHERE bm.user_id = ? AND bm.status = 'ACTIVE'`,
      [user.id]
    );

    return { user: safeUser, token, businesses };
  }

  static async getMe(userId: number) {
    const [rows]: any = await db.query(
      "SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!rows || rows.length === 0) {
      throw { statusCode: 404, message: "User not found", code: "USER_NOT_FOUND" };
    }

    const user = rows[0];

    const [businesses]: any = await db.query(
      `SELECT b.id, b.name, b.slug, b.business_type, b.currency, b.invoice_prefix, b.tax_percentage, bm.role, bm.status
       FROM businesses b
       JOIN business_members bm ON bm.business_id = b.id
       WHERE bm.user_id = ? AND bm.status = 'ACTIVE'`,
      [user.id]
    );

    return { user, businesses };
  }

  static async sendOtp(email: string, purpose: string = "signup") {
    const cleanEmail = email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      "INSERT INTO otp_verification (email, otp, purpose, expires_at, is_verified) VALUES (?, ?, ?, ?, 0)",
      [cleanEmail, otp, purpose, expiresAt]
    );

    console.log(`[QuickBill OTP] Email: ${cleanEmail} | Purpose: ${purpose} | Code: ${otp}`);
    return { success: true, message: "OTP sent successfully" };
  }

  static async verifyOtp(email: string, otp: string, purpose: string = "signup") {
    const cleanEmail = email.toLowerCase().trim();

    const [rows]: any = await db.query(
      `SELECT * FROM otp_verification
       WHERE email = ? AND purpose = ? AND is_verified = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, purpose]
    );

    if (!rows || rows.length === 0) {
      throw { statusCode: 400, message: "Invalid or expired OTP", code: "INVALID_OTP" };
    }

    const record = rows[0];
    if (record.otp !== otp) {
      throw { statusCode: 400, message: "Incorrect OTP code", code: "WRONG_OTP" };
    }

    await db.query("UPDATE otp_verification SET is_verified = 1 WHERE id = ?", [record.id]);
    return { success: true, message: "OTP verified successfully" };
  }

  static async resetPassword(email: string, newPassword: string) {
    const cleanEmail = email.toLowerCase().trim();

    const [userRows]: any = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [cleanEmail]);
    if (!userRows || userRows.length === 0) {
      throw { statusCode: 404, message: "User not found", code: "USER_NOT_FOUND" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, cleanEmail]);

    return { success: true, message: "Password updated successfully" };
  }
}
