const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

const {
  returnFullInvoice,
  returnSingleItem,
  getAllReturns,
  getReturnDetails
} = require("../controllers/return");

// Return full invoice
router.post(
  "/invoice/:invoiceId",
  auth,
  checkPermission("can_process_returns"),
  returnFullInvoice
);

// Return a single item
router.post(
  "/item",
  auth,
  checkPermission("can_process_returns"),
  returnSingleItem
);

// All return records
router.get("/", auth, checkPermission("can_view_returns"), getAllReturns);

// Single return details
router.get("/:returnId", auth, checkPermission("can_view_returns"), getReturnDetails);

module.exports = router;
