import { Router } from "express";
import {
  getAllSupplierInvoices,
  getSupplierInvoiceById,
  createSupplierInvoice,
  updateSupplierInvoice,
  deleteSupplierInvoice,
  getSupplierInvoiceStats
} from "../controllers/supplierInvoice.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// GET /api/supplier-invoices - Obtener todas las facturas con filtros y paginación
router.get("/", verifyToken, getAllSupplierInvoices);

// GET /api/supplier-invoices/stats/:supplierId - Obtener estadísticas de un proveedor
router.get("/stats/:supplierId", verifyToken, getSupplierInvoiceStats);

// GET /api/supplier-invoices/:id - Obtener una factura por ID
router.get("/:id", verifyToken, getSupplierInvoiceById);

// POST /api/supplier-invoices - Crear nueva factura
router.post("/", verifyToken, createSupplierInvoice);

// PUT /api/supplier-invoices/:id - Actualizar factura
router.put("/:id", verifyToken, updateSupplierInvoice);

// DELETE /api/supplier-invoices/:id - Eliminar factura
router.delete("/:id", verifyToken, deleteSupplierInvoice);

export default router;