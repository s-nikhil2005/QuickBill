const SettingsModel = require("../models/settingsModel");

// GET SETTINGS
exports.getSettings = async (req, res) => {
  try {
    const settings = await SettingsModel.getSettings();
    res.status(200).json({ settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings", error: err.message });
  }
};

// CREATE SETTINGS (only once)
exports.createSettings = async (req, res) => {
  try {
    await SettingsModel.createSettings(req.body);
    res.status(201).json({ message: "Settings created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create settings", error: err.message });
  }
};

// UPDATE SETTINGS
exports.updateSettings = async (req, res) => {
  try {
    await SettingsModel.updateSettings(req.body);
    res.status(200).json({ message: "Settings updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings", error: err.message });
  }
};
