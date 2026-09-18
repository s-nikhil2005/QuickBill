import { Router } from "express";
import { ExpenseController } from "../controllers/expense.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard);

router.get("/", requireRole("OWNER", "ADMIN", "MANAGER"), ExpenseController.getAll);
router.post("/", requireRole("OWNER", "ADMIN", "MANAGER"), ExpenseController.create);
router.delete("/:id", requireRole("OWNER", "ADMIN"), ExpenseController.delete);

export default router;
