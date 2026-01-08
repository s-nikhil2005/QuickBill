const StaffPermission = require("../models/staffPermission");
const UserModel = require("../models/user");

// ADMIN sets staff permissions
exports.setStaffPermissions = async (req, res) => {
  try {
    const staffId = req.params.staffId;

    const {
      can_add_product,
      can_edit_product,
      can_delete_product,
      can_update_stock
    } = req.body;

    // Check if staff exists
    const staff = await UserModel.findById(staffId);

    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Save permissions
    await StaffPermission.setPermissions(staffId, {
      can_add_product,
      can_edit_product,
      can_delete_product,
      can_update_stock
    });

    res.json({ message: "Permissions updated successfully" });

  } catch (err) {
    res.status(500).json({
      message: "Error updating permissions",
      error: err.message
    });
  }
};


// ADMIN gets staff permissions
exports.getStaffPermissions = async (req, res) => {
  try {
    const staffId = req.params.staffId;

    const permissions = await StaffPermission.getPermissions(staffId);

    if (!permissions) {
      return res.status(404).json({ message: "Permissions not set for this staff" });
    }

    res.json(permissions);

  } catch (err) {
    res.status(500).json({
      message: "Error fetching permissions",
      error: err.message
    });
  }
};
