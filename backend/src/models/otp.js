const db = require("../config/db");

const otpModel = {

  saveOtp: async (email, otp, expiresAt, purpose = "signup") => {
    await db.query(
      `INSERT INTO otp_verification (email, otp, expires_at, purpose, is_verified)
       VALUES (?, ?, ?, ?, 0)`,
      [email, otp, expiresAt, purpose]
    );
  },

  getLatestOtp: async (email) => {
    const [rows] = await db.query(
      `SELECT * FROM otp_verification
       WHERE email = ?
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );
    return rows[0];
  },

  markVerified: async (email) => {
    await db.query(
      `UPDATE otp_verification
       SET is_verified = 1
       WHERE email = ?`,
      [email]
    );
  },

  deleteOtp: async (email) => {
    await db.query(
      `DELETE FROM otp_verification WHERE email = ?`,
      [email]
    );
  }
};

module.exports = otpModel;
