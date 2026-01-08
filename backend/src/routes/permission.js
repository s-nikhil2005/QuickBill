const express = require('express');
const router = express.Router();

const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

const {setStaffPermissions,
       getStaffPermissions
}=require("../controllers/permission")

router.post("/staff/:staffId/permissions", auth, checkPermission ("admin"),setStaffPermissions);

router.get("/staff/:staffId/permissions", auth, checkPermission("admin"),getStaffPermissions);

module.exports = router;