import { Router } from "express";
import { ReturnController } from "../controllers/return.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard);

router.post("/process", requireRole("OWNER", "ADMIN", "MANAGER"), ReturnController.processReturn);
router.get("/", ReturnController.getAll);
router.get("/:id", ReturnController.getById);

export default router;
