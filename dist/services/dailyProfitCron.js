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
const Product_1 = __importDefault(require("../models/Product"));
const normalize = (d) => dailyProfit_controller_1.DailyProfitController.normalizeToUTCDay(d);
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
            // A las 23:59 AR ya es el día siguiente en UTC, así que guardar solo "hoy"
            // dejaba afuera el día real. Se recalculan los últimos 30 días, igual que al iniciar.
            await fillMissingDays();
            console.log('✅ [CRON] Ganancias del día calculadas correctamente');
        }
        catch (error) {
            console.error('❌ [CRON] Error al calcular ganancias diarias:', error);
        }
    }, {
        timezone: 'America/Argentina/Buenos_Aires',
    });
    // Al iniciar: guardar el costo en ventas recientes que no lo tengan y completar días faltantes
    backfillRecentSaleCosts()
        .catch((error) => console.error('❌ Error al guardar costos en ventas recientes:', error))
        .then(() => fillMissingDays())
        .catch((error) => {
        console.error('❌ Error al completar días faltantes:', error);
    });
    console.log('✅ Cron de ganancias diarias configurado (23:59 AR)');
}
/**
 * Guarda el purchaseCost actual en los items de ventas de los últimos 30 días
 * que no lo tengan (ventas creadas antes de que se guardara el costo en la venta).
 * Las ventas más viejas no se tocan: su ganancia ya quedó registrada en DailyProfit.
 */
async function backfillRecentSaleCosts() {
    const since = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const sales = await Sale_1.default.find({
        createdAt: { $gte: since },
        'products.purchaseCost': { $exists: false },
    }).select('products').lean();
    if (sales.length === 0)
        return;
    const productIds = [...new Set(sales.flatMap((s) => s.products.map((p) => String(p.product))))];
    const products = await Product_1.default.find({ _id: { $in: productIds } }).select('purchaseCost').lean();
    const costs = new Map(products.map((p) => [String(p._id), p.purchaseCost]));
    const ops = [];
    for (const sale of sales) {
        const $set = {};
        sale.products.forEach((item, i) => {
            const cost = costs.get(String(item.product));
            if (item.purchaseCost === undefined && cost !== undefined) {
                $set[`products.${i}.purchaseCost`] = cost;
            }
        });
        if (Object.keys($set).length > 0) {
            ops.push({ updateOne: { filter: { _id: sale._id }, update: { $set } } });
        }
    }
    if (ops.length > 0) {
        await Sale_1.default.bulkWrite(ops);
        console.log(`✅ Costo guardado en ${ops.length} ventas recientes`);
    }
}
/**
 * Verifica si hay días sin registro desde la primera venta hasta hoy
 * y calcula las ganancias para esos días faltantes o recientes.
 */
async function fillMissingDays() {
    try {
        const firstSale = await Sale_1.default.findOne({ status: { $ne: 'CANCELLED' } })
            .sort({ createdAt: 1 })
            .select('createdAt');
        if (!firstSale) {
            console.log('ℹ️ No hay ventas, no se necesita completar días');
            return;
        }
        const startDate = normalize(new Date(firstSale.createdAt));
        const today = normalize(new Date());
        // Umbral para recálculo de días recientes (últimos 30 días)
        const recentThreshold = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Obtener fechas ya registradas usando clave UTC YYYY-MM-DD
        const existingDays = await DailyProfit_1.default.find({
            date: { $gte: startDate, $lte: today },
        }).select('date salesCount').lean();
        const existingCounts = new Map(existingDays.map((d) => [d.date.toISOString().split('T')[0], d.salesCount]));
        // Cantidad real de ventas por día (UTC), para detectar días guardados con datos incorrectos
        const realCountsAgg = await Sale_1.default.aggregate([
            { $match: { status: { $ne: 'CANCELLED' }, createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        ]);
        const realCounts = new Map(realCountsAgg.map((d) => [d._id, d.count]));
        let processed = 0;
        let currentDate = new Date(startDate);
        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const isMissing = !existingCounts.has(dateStr);
            const isOutdated = existingCounts.get(dateStr) !== (realCounts.get(dateStr) ?? 0);
            const isRecent = currentDate >= recentThreshold;
            if (isMissing || isOutdated || isRecent) {
                await dailyProfit_controller_1.DailyProfitController.saveDailyProfit(new Date(currentDate));
                processed++;
            }
            // Avanzar un día en UTC (sin depender del timezone local)
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        }
        if (processed > 0) {
            console.log(`✅ Se completaron/recalcularon ${processed} días de ganancias`);
        }
        else {
            console.log('ℹ️ Todos los días de ganancias están al día');
        }
        // Siempre recalcular hoy al arrancar
        await dailyProfit_controller_1.DailyProfitController.saveDailyProfit(today);
    }
    catch (error) {
        console.error('❌ Error al completar días faltantes:', error);
    }
}
