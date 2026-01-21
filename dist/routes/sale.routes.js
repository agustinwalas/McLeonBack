"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sale_controller_1 = require("../controllers/sale.controller");
const router = (0, express_1.Router)();
// Rutas existentes
router.get("/", sale_controller_1.SaleController.getAllSales);
router.get("/stats", sale_controller_1.SaleController.getSalesStats);
router.get("/top-products", sale_controller_1.SaleController.getTopProducts);
router.get("/payment-methods", sale_controller_1.SaleController.getSalesByPaymentMethod);
// ✅ Nueva ruta para ventas por fecha
router.get("/date/:date", sale_controller_1.SaleController.getSalesByDate);
// Rutas con parámetros específicos (deben ir después de las rutas fijas)
router.get("/client/:clientId", sale_controller_1.SaleController.getSalesByClient);
router.get("/user/:userId", sale_controller_1.SaleController.getSalesByUser);
router.get("/:id", sale_controller_1.SaleController.getSaleById);
// Rutas de modificación
router.post("/", sale_controller_1.SaleController.createSale);
router.put("/:id", sale_controller_1.SaleController.updateSale);
router.patch("/:id", sale_controller_1.SaleController.updatePayment);
router.delete("/:id", sale_controller_1.SaleController.deleteSale);
exports.default = router;
