"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/sales.ts
const express_1 = require("express");
const afip_controller_1 = require("../controllers/afip.controller");
const router = (0, express_1.Router)();
// Ruta de prueba de conexión con AFIP
router.get("/test", afip_controller_1.testConnection);
// Obtener puntos de venta autorizados
router.get("/sales-points", afip_controller_1.getSalesPoints);
// Generar comprobante AFIP con payload personalizado
router.post("/vouchers", afip_controller_1.generateAfipVoucher);
// Generar comprobante AFIP desde venta existente
router.post("/:id/generate", afip_controller_1.generateAfipInvoice);
// Consultar estado de comprobante AFIP
router.get("/:id/status", afip_controller_1.getAfipStatus);
// Consultar información completa de factura en AFIP
router.get("/:id/info", afip_controller_1.getAfipVoucherInfo);
exports.default = router;
