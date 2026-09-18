import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard, requireRole("OWNER", "ADMIN", "MANAGER"));

router.get("/sales", ReportController.getSalesReport);
router.get("/profit", ReportController.getProfitReport);
router.get("/tax", ReportController.getTaxReport);

export default router;
