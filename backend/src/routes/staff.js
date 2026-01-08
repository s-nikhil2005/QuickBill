const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

const { 
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffPermissions,
  deactivateStaff,
  deleteStaff
} = require("../controllers/staffController");

const { createStaffValidator } = require("../validators/staffValidator");

// ADMIN ONLY
router.post("/", auth, checkPermission("can_manage_staff"), createStaffValidator, createStaff);
router.get("/", auth, checkPermission("can_manage_staff"), getAllStaff);
router.get("/:id", auth, checkPermission("can_manage_staff"), getStaffById);
router.patch("/:id", auth, checkPermission("can_manage_staff"), updateStaff);
router.patch("/:id/permissions", auth, checkPermission("can_manage_staff"), updateStaffPermissions);
router.patch("/:id/deactivate", auth, checkPermission("can_manage_staff"), deactivateStaff);
router.delete("/:id", auth, checkPermission("can_manage_staff"), deleteStaff);

module.exports = router;
