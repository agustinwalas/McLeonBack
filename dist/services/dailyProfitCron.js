"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDailyProfitCron = initDailyProfitCron;
// src/services/dailyProfitCron.ts
const node_cron_1 = __importDefault(require("node-cron"));
const dailyProfit_controller_1 = require("../controllers/dailyProfit.controller");
const DailyProfit_1 = __importDefault(require("../models/DailyProfit"));
const Sale_1 = __importDefault(require("../models/Sale"));
/**
 * Inicializa el cron job que calcula las ganancias diarias.
 * - Corre todos los días a las 23:59
 * - Al iniciar el servidor, verifica si faltan días por calcular y los completa
 */
function initDailyProfitCron() {
    console.log('⏰ Inicializando cron de ganancias diarias...');
    // Cron: todos los días a las 23:59
    node_cron_1.default.schedule('59 23 * * *', async () => {
        try {
            console.log('⏰ [CRON] Calculando ganancias del día...');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await dailyProfit_controller_1.DailyProfitController.saveDailyProfit(today);
            console.log('✅ [CRON] Ganancias del día calculadas correctamente');
        }
        catch (error) {
            console.error('❌ [CRON] Error al calcular ganancias diarias:', error);
        }
    }, {
        timezone: 'America/Argentina/Buenos_Aires',
    });
    // Al iniciar: verificar y completar días faltantes
    fillMissingDays().catch((error) => {
        console.error('❌ Error al completar días faltantes:', error);
    });
    console.log('✅ Cron de ganancias diarias configurado (23:59 AR)');
}
/**
 * Verifica si hay días sin registro desde la primera venta hasta hoy
 * y calcula las ganancias para esos días faltantes
 */
async function fillMissingDays() {
    try {
        // Obtener la primera venta
        const firstSale = await Sale_1.default.findOne({ status: { $ne: 'CANCELLED' } })
            .sort({ createdAt: 1 })
            .select('createdAt');
        if (!firstSale) {
            console.log('ℹ️ No hay ventas, no se necesita completar días');
            return;
        }
        const startDate = new Date(firstSale.createdAt);
        startDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Obtener todos los días que ya tienen registro
        const existingDays = await DailyProfit_1.default.find({
            date: { $gte: startDate, $lte: today },
        }).select('date').lean();
        const existingDatesSet = new Set(existingDays.map((d) => d.date.toISOString().split('T')[0]));
        // Calcular para los días faltantes
        let missingDays = 0;
        const currentDate = new Date(startDate);
        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (!existingDatesSet.has(dateStr)) {
                await dailyProfit_controller_1.DailyProfitController.saveDailyProfit(new Date(currentDate));
                missingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        if (missingDays > 0) {
            console.log(`✅ Se completaron ${missingDays} días faltantes de ganancias`);
        }
        else {
            console.log('ℹ️ Todos los días de ganancias están al día');
        }
        // También recalcular hoy por si hubo ventas nuevas
        await dailyProfit_controller_1.DailyProfitController.saveDailyProfit(today);
    }
    catch (error) {
        console.error('❌ Error al completar días faltantes:', error);
    }
}
