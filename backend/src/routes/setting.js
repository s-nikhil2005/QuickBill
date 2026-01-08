const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

const {
  getSettings,
  createSettings,
  updateSettings
} = require("../controllers/settingsController");

const { settingsValidator } = require("../validators/settingsValidator");

// CREATE settings (only once)
router.post(
  "/", 
  auth, 
  checkPermission("can_manage_settings"), 
  settingsValidator,   // <-- 🔥 USE VALIDATOR HERE
  createSettings
);

// UPDATE settings
router.patch(
  "/", 
  auth, 
  checkPermission("can_manage_settings"), 
  settingsValidator,    // <-- 🔥 USE VALIDATOR HERE
  updateSettings
);

// GET settings
router.get("/", auth, getSettings);

module.exports = router;
