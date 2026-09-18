import { Router } from "express";
import { BusinessController } from "../controllers/business.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

// Create new business (onboarding) - requires auth only
router.post("/", authenticateUser, BusinessController.create);

// Scoped to business workspace
router.get("/current", authenticateUser, tenantGuard, BusinessController.getById);
router.put("/current", authenticateUser, tenantGuard, requireRole("OWNER", "ADMIN"), BusinessController.update);
router.get("/stores", authenticateUser, tenantGuard, BusinessController.getStores);

export default router;
