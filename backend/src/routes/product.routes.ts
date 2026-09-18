import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authenticateUser } from "../middlewares/auth";
import { tenantGuard } from "../middlewares/tenant";
import { requireRole } from "../middlewares/rbac";

const router = Router();

router.use(authenticateUser, tenantGuard);

// Categories
router.get("/categories/all", ProductController.getCategories);
router.post("/categories", requireRole("OWNER", "ADMIN", "MANAGER"), ProductController.createCategory);
router.delete("/categories/:id", requireRole("OWNER", "ADMIN"), ProductController.deleteCategory);

// Products
router.get("/", ProductController.getAll);
router.post("/", requireRole("OWNER", "ADMIN", "MANAGER"), ProductController.create);
router.get("/barcode/:barcode", ProductController.searchBarcode);
router.get("/:id", ProductController.getById);
router.put("/:id", requireRole("OWNER", "ADMIN", "MANAGER"), ProductController.update);
router.delete("/:id", requireRole("OWNER", "ADMIN"), ProductController.delete);

export default router;
