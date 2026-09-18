import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard);

router.get("/", SettingsController.get);
router.put("/", requireRole("OWNER", "ADMIN"), SettingsController.update);
router.get("/subscription", SettingsController.getSubscription);

export default router;
