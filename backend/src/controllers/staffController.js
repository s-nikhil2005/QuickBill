const bcrypt = require("bcryptjs");
const StaffModel = require("../models/staffModel");
const StaffPermission = require("../models/staffPermission");

// CREATE STAFF
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;

    const hashedPass = await bcrypt.hash(password, 10);

    const staffId = await StaffModel.createStaff({
      name,
      email,
      password: hashedPass,
      phone,
      role
    });

    await StaffPermission.setPermissions(staffId, permissions);

    res.status(201).json({ message: "Staff created", staff_id: staffId });

  } catch (err) {
    res.status(500).json({ message: "Error creating staff", error: err.message });
  }
};

// GET ALL STAFF
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await StaffModel.getAllStaff();
    res.status(200).json({ staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SINGLE STAFF
exports.getStaffById = async (req, res) => {
  try {
    const staff = await StaffModel.getStaffById(req.params.id);
    res.status(200).json({ staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE STAFF INFO
exports.updateStaff = async (req, res) => {
  try {
    await StaffModel.updateStaff(req.params.id, req.body);
    res.status(200).json({ message: "Staff updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE STAFF PERMISSIONS
exports.updateStaffPermissions = async (req, res) => {
  try {
    await StaffPermission.setPermissions(req.params.id, req.body.permissions);
    res.status(200).json({ message: "Permissions updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DEACTIVATE STAFF
exports.deactivateStaff = async (req, res) => {
  try {
    await StaffModel.deactivateStaff(req.params.id);
    res.status(200).json({ message: "Staff deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE STAFF
exports.deleteStaff = async (req, res) => {
  try {
    await StaffModel.deleteStaff(req.params.id);
    res.status(200).json({ message: "Staff deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
