import { Router } from "express";
import { BillingController } from "../controllers/billing.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard);

// Checkout
router.post("/checkout", requireRole("OWNER", "ADMIN", "MANAGER", "CASHIER"), BillingController.checkout);

// Orders
router.get("/orders", BillingController.getOrders);
router.get("/orders/:id", BillingController.getOrderDetails);

export default router;
