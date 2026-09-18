import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard);

router.post("/adjust", requireRole("OWNER", "ADMIN", "MANAGER"), InventoryController.adjustStock);
router.get("/movements", requireRole("OWNER", "ADMIN", "MANAGER"), InventoryController.getMovements);
router.get("/low-stock", InventoryController.getLowStock);

export default router;
