import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard);

router.get("/", CustomerController.getAll);
router.post("/", requireRole("OWNER", "ADMIN", "MANAGER", "CASHIER"), CustomerController.create);
router.get("/:id", CustomerController.getById);
router.put("/:id", requireRole("OWNER", "ADMIN", "MANAGER"), CustomerController.update);
router.delete("/:id", requireRole("OWNER", "ADMIN"), CustomerController.delete);

export default router;
