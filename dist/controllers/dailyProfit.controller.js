"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyProfitController = void 0;
const DailyProfit_1 = __importDefault(require("../models/DailyProfit"));
const Sale_1 = __importDefault(require("../models/Sale"));
const SupplierInvoice_1 = __importDefault(require("../models/SupplierInvoice"));
const Expense_1 = __importDefault(require("../models/Expense"));
class DailyProfitController {
    /**
     * Calcula las ganancias de un día específico
     * Busca todas las ventas CONFIRMED/DELIVERED de ese día,
     * obtiene el purchaseCost de cada producto y calcula la diferencia
     */
    static normalizeToUTCDay(date) {
        const iso = date.toISOString().split('T')[0];
        return new Date(iso + 'T00:00:00.000Z');
    }
    static async calculateDailyProfit(date) {
        const startOfDay = DailyProfitController.normalizeToUTCDay(date);
        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCHours(23, 59, 59, 999);
        // Obtener todas las ventas del día que no estén canceladas
        const sales = await Sale_1.default.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'CANCELLED' },
        }).populate('products.product');
        let totalBaseCost = 0;
        let totalSaleAmount = 0;
        for (const sale of sales) {
            totalSaleAmount += sale.totalAmount || 0;
            for (const item of sale.products) {
                const product = item.product;
                if (product && product.purchaseCost !== undefined) {
                    totalBaseCost += product.purchaseCost * item.quantity;
                }
            }
        }
        const totalProfit = totalSaleAmount - totalBaseCost;
        return {
            totalBaseCost: Math.round(totalBaseCost * 100) / 100,
            totalSaleAmount: Math.round(totalSaleAmount * 100) / 100,
            totalProfit: Math.round(totalProfit * 100) / 100,
            salesCount: sales.length,
        };
    }
    /**
     * Guarda o actualiza la ganancia diaria para una fecha
     */
    static async saveDailyProfit(date) {
        const normalizedDate = DailyProfitController.normalizeToUTCDay(date);
        const profitData = await DailyProfitController.calculateDailyProfit(normalizedDate);
        await DailyProfit_1.default.findOneAndUpdate({ date: normalizedDate }, {
            date: normalizedDate,
            ...profitData,
        }, { upsert: true, new: true });
        console.log(`✅ Ganancia diaria guardada para ${normalizedDate.toISOString().split('T')[0]}: ` +
            `Base: $${profitData.totalBaseCost} | Venta: $${profitData.totalSaleAmount} | ` +
            `Ganancia: $${profitData.totalProfit} | Ventas: ${profitData.salesCount}`);
    }
    /**
     * Endpoint: Migrar ventas anteriores - calcula ganancias diarias para todos los días pasados con ventas
     */
    static async migratePastSales(req, res) {
        try {
            console.log('🔄 Iniciando migración de ganancias para ventas anteriores...');
            // Obtener la primera y última venta
            const firstSale = await Sale_1.default.findOne({ status: { $ne: 'CANCELLED' } })
                .sort({ createdAt: 1 })
                .select('createdAt');
            if (!firstSale) {
                res.json({
                    success: true,
                    message: 'No hay ventas para migrar',
                    daysProcessed: 0,
                });
                return;
            }
            const startDate = DailyProfitController.normalizeToUTCDay(new Date(firstSale.createdAt));
            const today = DailyProfitController.normalizeToUTCDay(new Date());
            // Eliminar todos los registros existentes para evitar duplicados por timezone
            await DailyProfit_1.default.deleteMany({});
            console.log('🗑️ Registros DailyProfit eliminados para recalcular desde cero');
            let daysProcessed = 0;
            let currentDate = new Date(startDate);
            while (currentDate <= today) {
                await DailyProfitController.saveDailyProfit(new Date(currentDate));
                daysProcessed++;
                // Avanzar un día en UTC sin depender del timezone local
                currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
            }
            console.log(`✅ Migración completada. ${daysProcessed} días procesados.`);
            res.json({
                success: true,
                message: `Migración completada. ${daysProcessed} días procesados.`,
                daysProcessed,
            });
        }
        catch (error) {
            console.error('❌ Error en migración:', error);
            res.status(500).json({
                success: false,
                message: 'Error al migrar ganancias',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }
    /**
     * Endpoint: Obtener ganancias mensuales agrupadas
     */
    static async getMonthlyProfits(req, res) {
        try {
            const { year } = req.query;
            // Si se pasa un año, filtrar por ese año; sino traer todo
            const matchStage = {};
            if (year) {
                const yearNum = parseInt(year);
                matchStage.date = {
                    $gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
                    $lte: new Date(`${yearNum}-12-31T23:59:59.999Z`),
                };
            }
            const monthlyProfits = await DailyProfit_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                        },
                        totalBaseCost: { $sum: '$totalBaseCost' },
                        totalSaleAmount: { $sum: '$totalSaleAmount' },
                        totalProfit: { $sum: '$totalProfit' },
                        salesCount: { $sum: '$salesCount' },
                        daysWithSales: { $sum: { $cond: [{ $gt: ['$salesCount', 0] }, 1, 0] } },
                    },
                },
                {
                    $sort: { '_id.year': -1, '_id.month': -1 },
                },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        totalBaseCost: { $round: ['$totalBaseCost', 2] },
                        totalSaleAmount: { $round: ['$totalSaleAmount', 2] },
                        totalProfit: { $round: ['$totalProfit', 2] },
                        salesCount: 1,
                        daysWithSales: 1,
                    },
                },
            ]);
            const dateMatchStage = {};
            if (year) {
                const yearNum = parseInt(year);
                dateMatchStage.date = {
                    $gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
                    $lte: new Date(`${yearNum}-12-31T23:59:59.999Z`),
                };
            }
            // Aggregation de facturas de proveedores por mes
            const supplierInvoicesByMonth = await SupplierInvoice_1.default.aggregate([
                { $match: dateMatchStage },
                {
                    $group: {
                        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
                        supplierInvoicesTotal: { $sum: '$amount' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        supplierInvoicesTotal: { $round: ['$supplierInvoicesTotal', 2] },
                    },
                },
            ]);
            // Aggregation de gastos por mes
            const expensesByMonth = await Expense_1.default.aggregate([
                { $match: dateMatchStage },
                {
                    $group: {
                        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
                        expensesTotal: { $sum: '$amount' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        expensesTotal: { $round: ['$expensesTotal', 2] },
                    },
                },
            ]);
            const invoicesMap = new Map(supplierInvoicesByMonth.map((inv) => [`${inv.year}-${inv.month}`, inv.supplierInvoicesTotal]));
            const expensesMap = new Map(expensesByMonth.map((exp) => [`${exp.year}-${exp.month}`, exp.expensesTotal]));
            const data = monthlyProfits.map((mp) => {
                const supplierInvoicesTotal = invoicesMap.get(`${mp.year}-${mp.month}`) ?? 0;
                const expensesTotal = expensesMap.get(`${mp.year}-${mp.month}`) ?? 0;
                return {
                    ...mp,
                    supplierInvoicesTotal,
                    expensesTotal,
                    netProfit: Math.round((mp.totalProfit - expensesTotal) * 100) / 100,
                };
            });
            // Incluir meses que solo tienen facturas o gastos (sin ventas en DailyProfit)
            const allExtraKeys = new Set([
                ...supplierInvoicesByMonth.map((i) => `${i.year}-${i.month}`),
                ...expensesByMonth.map((e) => `${e.year}-${e.month}`),
            ]);
            for (const key of allExtraKeys) {
                if (!data.find((d) => `${d.year}-${d.month}` === key)) {
                    const [y, m] = key.split('-').map(Number);
                    const supplierInvoicesTotal = invoicesMap.get(key) ?? 0;
                    const expensesTotal = expensesMap.get(key) ?? 0;
                    data.push({
                        year: y,
                        month: m,
                        totalBaseCost: 0,
                        totalSaleAmount: 0,
                        totalProfit: 0,
                        salesCount: 0,
                        daysWithSales: 0,
                        supplierInvoicesTotal,
                        expensesTotal,
                        netProfit: Math.round(-expensesTotal * 100) / 100,
                    });
                }
            }
            data.sort((a, b) => b.year - a.year || b.month - a.month);
            res.json({
                success: true,
                data,
            });
        }
        catch (error) {
            console.error('❌ Error al obtener ganancias mensuales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ganancias mensuales',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }
    /**
     * Endpoint: Obtener ganancias diarias (para un rango de fechas)
     */
    static async getDailyProfits(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            const match = {};
            if (dateFrom) {
                match.date = { ...match.date, $gte: new Date(dateFrom) };
            }
            if (dateTo) {
                match.date = { ...match.date, $lte: new Date(dateTo) };
            }
            const dailyProfits = await DailyProfit_1.default.find(match)
                .sort({ date: -1 })
                .lean();
            res.json({
                success: true,
                data: dailyProfits,
            });
        }
        catch (error) {
            console.error('❌ Error al obtener ganancias diarias:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ganancias diarias',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }
    /**
     * Endpoint: Recalcular ganancia para el día de hoy
     */
    static async recalculateToday(req, res) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await DailyProfitController.saveDailyProfit(today);
            const todayProfit = await DailyProfit_1.default.findOne({ date: today });
            res.json({
                success: true,
                message: 'Ganancia de hoy recalculada',
                data: todayProfit,
            });
        }
        catch (error) {
            console.error('❌ Error al recalcular ganancia de hoy:', error);
            res.status(500).json({
                success: false,
                message: 'Error al recalcular ganancia de hoy',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }
}
exports.DailyProfitController = DailyProfitController;
