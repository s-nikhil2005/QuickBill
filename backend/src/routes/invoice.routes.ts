import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";

const router = Router();

router.use(authenticateUser, tenantGuard);

router.get("/", InvoiceController.getAll);
router.get("/:id", InvoiceController.getById);
router.get("/:id/print", InvoiceController.renderPrint);

export default router;
