import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";

const router = Router();

router.use(authenticateUser, tenantGuard);

router.get("/overview", DashboardController.getOverview);

export default router;
