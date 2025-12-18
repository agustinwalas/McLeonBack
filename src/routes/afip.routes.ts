// backend/src/routes/sales.ts
import { Router } from "express";

import { testConnection, generateAfipInvoice, getAfipStatus, generateAfipVoucher, getSalesPoints, getAfipVoucherInfo } from "../controllers/afip.controller";

const router = Router();

// Ruta de prueba de conexión con AFIP
router.get("/test", testConnection);

// Obtener puntos de venta autorizados
router.get("/sales-points", getSalesPoints);

// Generar comprobante AFIP con payload personalizado
router.post("/vouchers", generateAfipVoucher);

// Generar comprobante AFIP desde venta existente
router.post("/:id/generate", generateAfipInvoice);

// Consultar estado de comprobante AFIP
router.get("/:id/status", getAfipStatus);

// Consultar información completa de factura en AFIP
router.get("/:id/info", getAfipVoucherInfo);

export default router;
