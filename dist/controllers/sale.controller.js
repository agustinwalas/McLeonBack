"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleController = void 0;
const Sale_1 = __importDefault(require("../models/Sale"));
const Product_1 = __importDefault(require("../models/Product"));
class SaleController {
    // GET - Obtener todas las ventas
    static async getAllSales(req, res) {
        try {
            const sales = await Sale_1.default.find()
                .populate("client")
                .populate("user")
                .populate("products.product")
                .sort({ createdAt: -1 });
            res.json(sales);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener ventas", error });
        }
    }
    // GET - Obtener venta por ID
    static async getSaleById(req, res) {
        try {
            const sale = await Sale_1.default.findById(req.params.id)
                .populate("client")
                .populate("user")
                .populate("products.product");
            if (!sale) {
                res.status(404).json({ message: "Venta no encontrada" });
                return;
            }
            res.json(sale);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener venta", error });
        }
    }
    // POST - Crear nueva venta
    static async createSale(req, res) {
        try {
            const { user, client, products, subtotal, totalAmount, paymentMethod, deliveryType, deliveryFee, notes, } = req.body;
            // Validar que user existe
            if (!user || !user._id || !user.name) {
                res.status(400).json({ message: "user es requerido con _id y name" });
                return;
            }
            // Validar que products existe y es un array
            if (!products || !Array.isArray(products) || products.length === 0) {
                res
                    .status(400)
                    .json({ message: "Debe seleccionar al menos un producto" });
                return;
            }
            // Validar que cada producto existe en la base de datos
            for (const productItem of products) {
                if (!productItem.product || !productItem.quantity) {
                    res
                        .status(400)
                        .json({ message: "Cada producto debe tener product y quantity" });
                    return;
                }
                const product = await Product_1.default.findById(productItem.product);
                if (!product) {
                    res
                        .status(404)
                        .json({ message: `Producto ${productItem.product} no encontrado` });
                    return;
                }
            }
            // Crear objeto de venta
            const saleData = {
                user: user,
                client: client,
                products: products,
                subtotal: subtotal,
                totalAmount: totalAmount,
                amountPaid: req.body.amountPaid || 0,
                paymentMethod: paymentMethod,
                deliveryType: deliveryType,
                deliveryFee: deliveryFee || 0,
                notes: notes || "",
                totalDiscount: req.body.totalDiscount || 0,
            };
            // Crear y guardar la venta
            const newSale = new Sale_1.default(saleData);
            const savedSale = await newSale.save();
            // Actualizar stock de productos vendidos
            for (const productItem of products) {
                await Product_1.default.findByIdAndUpdate(productItem.product, {
                    $inc: { currentStock: -productItem.quantity },
                });
            }
            // Poblar los datos para respuesta completa
            const populatedSale = await Sale_1.default.findById(savedSale._id)
                .populate("client")
                .populate("user")
                .populate("products.product");
            res.status(201).json(populatedSale);
        }
        catch (error) {
            res.status(400).json({ message: "Error al crear venta", error });
        }
    }
    // PUT - Actualizar venta
    static async updateSale(req, res) {
        try {
            const updatedSale = await Sale_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true })
                .populate("client")
                .populate("user")
                .populate("products.product");
            if (!updatedSale) {
                res.status(404).json({ message: "Venta no encontrada" });
                return;
            }
            res.json(updatedSale);
        }
        catch (error) {
            res.status(400).json({ message: "Error al actualizar venta", error });
        }
    }
    // DELETE - Eliminar venta
    static async deleteSale(req, res) {
        try {
            const sale = await Sale_1.default.findById(req.params.id);
            if (!sale) {
                res.status(404).json({ message: "Venta no encontrada" });
                return;
            }
            // Restaurar stock de productos
            for (const productItem of sale.products) {
                await Product_1.default.findByIdAndUpdate(productItem.product, {
                    $inc: { currentStock: productItem.quantity },
                });
            }
            await Sale_1.default.findByIdAndDelete(req.params.id);
            res.json({ message: "Venta eliminada correctamente" });
        }
        catch (error) {
            res.status(500).json({ message: "Error al eliminar venta", error });
        }
    }
    // GET - Ventas por cliente
    static async getSalesByClient(req, res) {
        try {
            const sales = await Sale_1.default.find({ "client._id": req.params.clientId })
                .populate("client")
                .populate("user")
                .populate("products.product")
                .sort({ createdAt: -1 });
            res.json(sales);
        }
        catch (error) {
            res
                .status(500)
                .json({ message: "Error al obtener ventas del cliente", error });
        }
    }
    // GET - Ventas por usuario/vendedor
    static async getSalesByUser(req, res) {
        try {
            const sales = await Sale_1.default.find({ "user._id": req.params.userId })
                .populate("client")
                .populate("user")
                .populate("products.product")
                .sort({ createdAt: -1 });
            res.json(sales);
        }
        catch (error) {
            res
                .status(500)
                .json({ message: "Error al obtener ventas del usuario", error });
        }
    }
    // GET - Ventas por fecha específica
    static async getSalesByDate(req, res) {
        try {
            const { date } = req.params;
            if (!date) {
                res.status(400).json({ message: "Fecha es requerida" });
                return;
            }
            // date esperado: YYYY-MM-DD
            const [year, month, day] = date.split("-").map(Number);
            if (!year || !month || !day) {
                res.status(400).json({ message: "Formato de fecha inválido. Use YYYY-MM-DD" });
                return;
            }
            // Crear rango en zona horaria Argentina (UTC-3)
            // JS Date: meses 0-indexados
            // new Date(año, mes, día, hora, min, seg) crea fecha en local time
            const startArg = new Date(year, month - 1, day, 0, 0, 0, 0); // 00:00:00 Argentina
            const endArg = new Date(year, month - 1, day, 23, 59, 59, 999); // 23:59:59 Argentina
            // Convertir a UTC
            const startDateUTC = new Date(startArg.getTime() + (3 * 60 * 60 * 1000));
            const endDateUTC = new Date(endArg.getTime() + (3 * 60 * 60 * 1000));
            const sales = await Sale_1.default.find({
                createdAt: {
                    $gte: startDateUTC,
                    $lte: endDateUTC,
                },
            })
                .populate("client")
                .populate("user")
                .populate("products.product")
                .sort({ createdAt: -1 });
            res.json(sales);
        }
        catch (error) {
            console.error("Error al obtener ventas por fecha:", error);
            res
                .status(500)
                .json({ message: "Error al obtener ventas por fecha", error });
        }
    }
    // GET - Ventas por rango de fechas
    static async getSalesByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            const sales = await Sale_1.default.find({
                createdAt: {
                    $gte: start,
                    $lte: end,
                },
            })
                .populate("client")
                .populate("user")
                .populate("products.product")
                .sort({ createdAt: -1 });
            res.json(sales);
        }
        catch (error) {
            res
                .status(500)
                .json({
                message: "Error al obtener ventas por rango de fechas",
                error,
            });
        }
    }
    // GET - Estadísticas de ventas
    static async getSalesStats(req, res) {
        try {
            const today = new Date();
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const [totalSales, todaySales, monthSales, yearSales, todayRevenue, monthRevenue, yearRevenue,] = await Promise.all([
                Sale_1.default.countDocuments(),
                Sale_1.default.countDocuments({ createdAt: { $gte: startOfToday } }),
                Sale_1.default.countDocuments({ createdAt: { $gte: startOfMonth } }),
                Sale_1.default.countDocuments({ createdAt: { $gte: startOfYear } }),
                Sale_1.default.aggregate([
                    { $match: { createdAt: { $gte: startOfToday } } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
                ]),
                Sale_1.default.aggregate([
                    { $match: { createdAt: { $gte: startOfMonth } } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
                ]),
                Sale_1.default.aggregate([
                    { $match: { createdAt: { $gte: startOfYear } } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
                ]),
            ]);
            res.json({
                sales: {
                    total: totalSales,
                    today: todaySales,
                    month: monthSales,
                    year: yearSales,
                },
                revenue: {
                    today: todayRevenue[0]?.total || 0,
                    month: monthRevenue[0]?.total || 0,
                    year: yearRevenue[0]?.total || 0,
                },
            });
        }
        catch (error) {
            res
                .status(500)
                .json({ message: "Error al obtener estadísticas de ventas", error });
        }
    }
    // GET - Top productos vendidos
    static async getTopProducts(req, res) {
        try {
            const { limit = 10 } = req.query;
            const topProducts = await Sale_1.default.aggregate([
                { $unwind: "$products" },
                {
                    $group: {
                        _id: "$products.product",
                        totalQuantity: { $sum: "$products.quantity" },
                        totalRevenue: { $sum: "$products.subtotal" },
                        salesCount: { $sum: 1 },
                    },
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: parseInt(limit) },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productInfo",
                    },
                },
                { $unwind: "$productInfo" },
            ]);
            res.json(topProducts);
        }
        catch (error) {
            res
                .status(500)
                .json({ message: "Error al obtener top productos", error });
        }
    }
    // GET - Ventas por método de pago
    static async getSalesByPaymentMethod(req, res) {
        try {
            const paymentStats = await Sale_1.default.aggregate([
                {
                    $group: {
                        _id: "$paymentMethod",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$totalAmount" },
                    },
                },
                { $sort: { count: -1 } },
            ]);
            res.json(paymentStats);
        }
        catch (error) {
            res
                .status(500)
                .json({ message: "Error al obtener ventas por método de pago", error });
        }
    }
}
exports.SaleController = SaleController;
