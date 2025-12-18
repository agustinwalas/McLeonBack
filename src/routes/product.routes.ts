import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.get("/", ProductController.getAllProducts);
router.get("/:id", ProductController.getProductById);

router.post("/", verifyToken, ProductController.createProduct);
router.put("/:id", verifyToken, ProductController.updateProduct);
router.delete("/:id", verifyToken, ProductController.deleteProduct);

export default router;
