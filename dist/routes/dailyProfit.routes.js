"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/dailyProfit.routes.ts
const express_1 = require("express");
const dailyProfit_controller_1 = require("../controllers/dailyProfit.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(verifyToken_1.verifyToken);
// Obtener ganancias mensuales (para la tabla del frontend)
router.get("/monthly", async (req, res) => {
    await dailyProfit_controller_1.DailyProfitController.getMonthlyProfits(req, res);
});
// Obtener ganancias diarias (rango de fechas)
router.get("/daily", async (req, res) => {
    await dailyProfit_controller_1.DailyProfitController.getDailyProfits(req, res);
});
// Recalcular ganancia de hoy
router.post("/recalculate-today", async (req, res) => {
    await dailyProfit_controller_1.DailyProfitController.recalculateToday(req, res);
});
// Migrar ventas anteriores (ejecutar una vez)
router.post("/migrate", async (req, res) => {
    await dailyProfit_controller_1.DailyProfitController.migratePastSales(req, res);
});
exports.default = router;
