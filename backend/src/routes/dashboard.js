const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

const {
  totalSales,
  totalInvoices,
  totalCustomers,
  lowStock,
  topProducts,
  dailyRevenue,
  monthlySales,
  paymentSummary,
  stockSummary
} = require("../controllers/dashboard");

router.get("/total-sales", auth, checkPermission("can_view_dashboard"), totalSales);
router.get("/total-invoices", auth, checkPermission("can_view_dashboard"), totalInvoices);
router.get("/total-customers", auth, checkPermission("can_view_dashboard"), totalCustomers);
router.get("/low-stock", auth, checkPermission("can_view_dashboard"), lowStock);
router.get("/top-products", auth, checkPermission("can_view_dashboard"), topProducts);
router.get("/daily-revenue", auth, checkPermission("can_view_dashboard"), dailyRevenue);
router.get("/monthly-sales", auth, checkPermission("can_view_dashboard"), monthlySales);
router.get("/payment-summary", auth, checkPermission("can_view_dashboard"), paymentSummary);
router.get("/stock-summary", auth, checkPermission("can_view_dashboard"), stockSummary);

module.exports = router;
