import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard);

router.get("/", requireRole("OWNER", "ADMIN", "MANAGER"), EmployeeController.getAll);
router.post("/", requireRole("OWNER", "ADMIN"), EmployeeController.add);
router.put("/:id/role", requireRole("OWNER", "ADMIN"), EmployeeController.updateRole);
router.put("/:id/status", requireRole("OWNER", "ADMIN"), EmployeeController.setStatus);
router.delete("/:id", requireRole("OWNER"), EmployeeController.remove);

export default router;
