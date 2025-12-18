"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplierInvoice_controller_1 = require("../controllers/supplierInvoice.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const router = (0, express_1.Router)();
// GET /api/supplier-invoices - Obtener todas las facturas con filtros y paginación
router.get("/", verifyToken_1.verifyToken, supplierInvoice_controller_1.getAllSupplierInvoices);
// GET /api/supplier-invoices/stats/:supplierId - Obtener estadísticas de un proveedor
router.get("/stats/:supplierId", verifyToken_1.verifyToken, supplierInvoice_controller_1.getSupplierInvoiceStats);
// GET /api/supplier-invoices/:id - Obtener una factura por ID
router.get("/:id", verifyToken_1.verifyToken, supplierInvoice_controller_1.getSupplierInvoiceById);
// POST /api/supplier-invoices - Crear nueva factura
router.post("/", verifyToken_1.verifyToken, supplierInvoice_controller_1.createSupplierInvoice);
// PUT /api/supplier-invoices/:id - Actualizar factura
router.put("/:id", verifyToken_1.verifyToken, supplierInvoice_controller_1.updateSupplierInvoice);
// DELETE /api/supplier-invoices/:id - Eliminar factura
router.delete("/:id", verifyToken_1.verifyToken, supplierInvoice_controller_1.deleteSupplierInvoice);
exports.default = router;
