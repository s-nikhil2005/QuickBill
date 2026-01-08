// src/middlewares/permission.js
const StaffPermission = require("../models/staffPermission");

const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Added by auth middleware

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Admin bypass
      if (user.role === "admin") {
        return next();
      }

      // Fetch staff permissions from database
      const permissions = await StaffPermission.getPermissions(user.id);

      if (!permissions) {
        return res.status(403).json({
          message: "No permissions assigned to this staff."
        });
      }

      // Permissions stored as 1 or 0 (bit fields / booleans)
      if (permissions[permissionKey] !== 1) {
        return res.status(403).json({
          message: `Permission denied: ${permissionKey}`
        });
      }

      next();

    } catch (err) {
      console.error("Permission error: ", err);
      return res.status(500).json({
        message: "Permission processing error",
        error: err.message
      });
    }
  };
};

module.exports = checkPermission;
