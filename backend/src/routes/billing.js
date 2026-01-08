const express = require("express");
const billingRouter = express.Router();
const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");


const {
 createInvoice,
  addItemToInvoice,
  finalizeInvoice,
  getInvoiceDetails,
  getInvoicePDF,
 exportSummaryPDF,
  exportInvoicesZIP
  
} = require("../controllers/billing");

// Create invoice draft
billingRouter.post("/create", auth, createInvoice);

// Add item to invoice
billingRouter.post("/add-item", auth, addItemToInvoice);

// Final checkout
billingRouter.post("/checkout/:invoiceId", auth, finalizeInvoice);

// View invoice
billingRouter.get("/:invoiceId", auth, getInvoiceDetails);

billingRouter.get(
  "/:invoiceId/pdf",auth,checkPermission("can_view_invoice"),getInvoicePDF
);


billingRouter.get(
  "/export/summary",
  auth,
  checkPermission("can_view_reports"),
  exportSummaryPDF
);

billingRouter.get(
  "/export/zip",
  auth,
  checkPermission("can_view_reports"),
  exportInvoicesZIP
);


module.exports = billingRouter;
