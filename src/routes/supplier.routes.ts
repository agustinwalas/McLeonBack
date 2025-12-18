import { Router } from "express";
import { SupplierController } from "../controllers/supplier.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// ✅ Rutas básicas CRUD
router.get("/", verifyToken, SupplierController.getAllSuppliers);
router.get("/:id", verifyToken, SupplierController.getSupplierById);
router.post("/", verifyToken, SupplierController.createSupplier);
router.put("/:id", verifyToken, SupplierController.updateSupplier);
router.delete("/:id", verifyToken, SupplierController.deleteSupplier);
router.put("/:supplierId/update-prices", verifyToken, SupplierController.updateSupplierProductsPrices);

export default router;
