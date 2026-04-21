"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyProfitController = void 0;
const DailyProfit_1 = __importDefault(require("../models/DailyProfit"));
const Sale_1 = __importDefault(require("../models/Sale"));
const SupplierInvoice_1 = __importDefault(require("../models/SupplierInvoice"));
class DailyProfitController {
    /**
     * Calcula las ganancias de un día específico
     * Busca todas las ventas CONFIRMED/DELIVERED de ese día,
     * obtiene el purchaseCost de cada producto y calcula la diferencia
     */
    static async calculateDailyProfit(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
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
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
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
            const startDate = new Date(firstSale.createdAt);
            startDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let daysProcessed = 0;
            const currentDate = new Date(startDate);
            while (currentDate <= today) {
                await DailyProfitController.saveDailyProfit(new Date(currentDate));
                daysProcessed++;
                currentDate.setDate(currentDate.getDate() + 1);
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
            // Aggregation de facturas de proveedores por mes
            const invoiceMatchStage = {};
            if (year) {
                const yearNum = parseInt(year);
                invoiceMatchStage.date = {
                    $gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
                    $lte: new Date(`${yearNum}-12-31T23:59:59.999Z`),
                };
            }
            const supplierInvoicesByMonth = await SupplierInvoice_1.default.aggregate([
                { $match: invoiceMatchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                        },
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
            // Merge: combinar ganancias con facturas de proveedores
            const invoicesMap = new Map(supplierInvoicesByMonth.map((inv) => [`${inv.year}-${inv.month}`, inv.supplierInvoicesTotal]));
            const data = monthlyProfits.map((mp) => ({
                ...mp,
                supplierInvoicesTotal: invoicesMap.get(`${mp.year}-${mp.month}`) ?? 0,
            }));
            // Incluir meses que solo tienen facturas de proveedores (sin ventas)
            for (const inv of supplierInvoicesByMonth) {
                const key = `${inv.year}-${inv.month}`;
                if (!data.find((d) => `${d.year}-${d.month}` === key)) {
                    data.push({
                        year: inv.year,
                        month: inv.month,
                        totalBaseCost: 0,
                        totalSaleAmount: 0,
                        totalProfit: 0,
                        salesCount: 0,
                        daysWithSales: 0,
                        supplierInvoicesTotal: inv.supplierInvoicesTotal,
                    });
                }
            }
            // Re-ordenar por año y mes descendente
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
