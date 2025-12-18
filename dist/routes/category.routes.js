"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const router = (0, express_1.Router)();
// ✅ Rutas públicas (no requieren autenticación)
router.get("/", category_controller_1.CategoryController.getAllCategories);
router.get("/:id", category_controller_1.CategoryController.getCategoryById);
// ✅ Rutas protegidas (requieren autenticación)
router.post("/", verifyToken_1.verifyToken, category_controller_1.CategoryController.createCategory);
router.put("/:id", verifyToken_1.verifyToken, category_controller_1.CategoryController.updateCategory);
router.delete("/:id", verifyToken_1.verifyToken, category_controller_1.CategoryController.deleteCategory);
exports.default = router;
