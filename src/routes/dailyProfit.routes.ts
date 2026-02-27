// src/routes/dailyProfit.routes.ts
import { Router, Request, Response } from "express";
import { DailyProfitController } from "../controllers/dailyProfit.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener ganancias mensuales (para la tabla del frontend)
router.get("/monthly", async (req: Request, res: Response) => {
  await DailyProfitController.getMonthlyProfits(req, res);
});

// Obtener ganancias diarias (rango de fechas)
router.get("/daily", async (req: Request, res: Response) => {
  await DailyProfitController.getDailyProfits(req, res);
});

// Recalcular ganancia de hoy
router.post("/recalculate-today", async (req: Request, res: Response) => {
  await DailyProfitController.recalculateToday(req, res);
});

// Migrar ventas anteriores (ejecutar una vez)
router.post("/migrate", async (req: Request, res: Response) => {
  await DailyProfitController.migratePastSales(req, res);
});

export default router;
