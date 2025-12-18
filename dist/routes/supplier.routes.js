"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_controller_1 = require("../controllers/supplier.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const router = (0, express_1.Router)();
// ✅ Rutas básicas CRUD
router.get("/", verifyToken_1.verifyToken, supplier_controller_1.SupplierController.getAllSuppliers);
router.get("/:id", verifyToken_1.verifyToken, supplier_controller_1.SupplierController.getSupplierById);
router.post("/", verifyToken_1.verifyToken, supplier_controller_1.SupplierController.createSupplier);
router.put("/:id", verifyToken_1.verifyToken, supplier_controller_1.SupplierController.updateSupplier);
router.delete("/:id", verifyToken_1.verifyToken, supplier_controller_1.SupplierController.deleteSupplier);
router.put("/:supplierId/update-prices", verifyToken_1.verifyToken, supplier_controller_1.SupplierController.updateSupplierProductsPrices);
exports.default = router;
