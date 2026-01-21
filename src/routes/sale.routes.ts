import { Router } from "express";
import { SaleController } from "../controllers/sale.controller";

const router = Router();

// Rutas existentes
router.get("/", SaleController.getAllSales);
router.get("/stats", SaleController.getSalesStats);
router.get("/top-products", SaleController.getTopProducts);
router.get("/payment-methods", SaleController.getSalesByPaymentMethod);

// ✅ Nueva ruta para ventas por fecha
router.get("/date/:date", SaleController.getSalesByDate);

// Rutas con parámetros específicos (deben ir después de las rutas fijas)
router.get("/client/:clientId", SaleController.getSalesByClient);
router.get("/user/:userId", SaleController.getSalesByUser);
router.get("/:id", SaleController.getSaleById);

// Rutas de modificación
router.post("/", SaleController.createSale);
router.put("/:id", SaleController.updateSale);
router.patch("/:id", SaleController.updatePayment);
router.delete("/:id", SaleController.deleteSale);

export default router;