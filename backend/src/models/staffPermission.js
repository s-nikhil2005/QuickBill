const db = require("../config/db");

class StaffPermission {

  static async getPermissions(userId) {
    const [rows] = await db.query(
      `SELECT * FROM staff_permissions WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0];
  }

  static async setPermissions(userId, permissions) {
    const [existing] = await db.query(
      `SELECT user_id FROM staff_permissions WHERE user_id = ?`,
      [userId]
    );

    const allPermissionKeys = [
      "can_add_product",
      "can_edit_product",
      "can_delete_product",
      "can_update_stock",
      "can_create_invoice",
      "can_process_returns",
      "can_manage_settings",
      "can_view_dashboard",
      "can_manage_staff"
    ];

    const values = allPermissionKeys.map(
      key => (permissions[key] ? 1 : 0)
    );

    if (existing.length > 0) {
      const setClause = allPermissionKeys.map(key => `${key} = ?`).join(", ");

      await db.query(
        `UPDATE staff_permissions SET ${setClause} WHERE user_id = ?`,
        [...values, userId]
      );

    } else {
      const columns = ["user_id", ...allPermissionKeys].join(", ");
      const placeholders = ["?", ...allPermissionKeys.map(() => "?")].join(", ");

      await db.query(
        `INSERT INTO staff_permissions (${columns}) VALUES (${placeholders})`,
        [userId, ...values]
      );
    }
  }
}

module.exports = StaffPermission;
