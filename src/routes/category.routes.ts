import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// ✅ Rutas públicas (no requieren autenticación)
router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getCategoryById);

// ✅ Rutas protegidas (requieren autenticación)
router.post("/", verifyToken, CategoryController.createCategory);
router.put("/:id", verifyToken, CategoryController.updateCategory);
router.delete("/:id", verifyToken, CategoryController.deleteCategory);


export default router;
