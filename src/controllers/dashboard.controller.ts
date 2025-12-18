import { Request, Response } from "express";
import Sale from "../models/Sale";
import Client from "../models/Client";
import Product from "../models/Product";
import { 
  DashboardOverviewDTO,
  DashboardResponseDTO,
  DashboardFiltersDTO,
  SalesByPeriodDTO,
  ComparativeAnalysisDTO,
  TopProductDTO,
  TopClientDTO,
  PaymentMethodStatsDTO,
  AfipStatsDTO,
  CategoryStatsDTO,
  DASHBOARD_VALIDATION,
  PERIOD_TYPES,
  AFIP_COMPROBANTE_NOMBRES
} from "../types/DashboardTypes";
import mongoose from "mongoose";

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

export class DashboardController {
  
  // Endpoint principal del dashboard
  static async getDashboardData(req: Request, res: Response) {
    try {
      console.log('🚀 [DASHBOARD] Request recibida en getDashboardData');
      console.log('📋 [DASHBOARD] Query params:', req.query);
      
      const filters = DashboardController.parseFilters(req.query);
      console.log('🔍 [DASHBOARD] Filtros parseados:', filters);
      
      // Validar filtros
      const validation = DashboardController.validateFilters(filters);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: validation.message
        });
        return;
      }

      // Ejecutar todas las consultas en paralelo para mejor performance
      const [
        overview,
        salesByPeriod,
        topProducts,
        topClients,
        paymentMethods,
        afipStats,
        comparative
      ] = await Promise.all([
        DashboardController.getOverviewStats(filters),
        DashboardController.getSalesByPeriod(filters),
        DashboardController.getTopProducts(filters),
        DashboardController.getTopClients(filters),
        DashboardController.getPaymentMethodsStats(filters),
        DashboardController.getAfipStats(filters),
        filters.period ? DashboardController.getComparativeAnalysis(filters) : null
      ]);

      console.log('📊 [DASHBOARD] Datos obtenidos:', {
        overview,
        salesByPeriodCount: salesByPeriod?.length,
        topProductsCount: topProducts?.length,
        topClientsCount: topClients?.length,
        paymentMethodsCount: paymentMethods?.length,
        afipStatsCount: afipStats?.length
      });

      const dashboardData: DashboardResponseDTO = {
        overview,
        salesByPeriod,
        topProducts,
        topClients,
        paymentMethods,
        afipStats,
        comparative: comparative || undefined,
        generatedAt: new Date().toISOString(),
        filters
      };

      console.log('✅ [DASHBOARD] Enviando respuesta exitosa');
      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error("❌ [DASHBOARD] Error getting dashboard data:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener datos del dashboard",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  // Endpoint para solo estadísticas generales
  static async getOverview(req: Request, res: Response) {
    try {
      const filters = DashboardController.parseFilters(req.query);
      const validation = DashboardController.validateFilters(filters);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const overview = await DashboardController.getOverviewStats(filters);
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas generales",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  // Endpoint para ventas por período
  static async getSalesByPeriodEndpoint(req: Request, res: Response) {
    try {
      const filters = DashboardController.parseFilters(req.query);
      const validation = DashboardController.validateFilters(filters);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const salesByPeriod = await DashboardController.getSalesByPeriod(filters);
      
      res.json({
        success: true,
        data: salesByPeriod
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener ventas por período",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  // Endpoint para top productos
  static async getTopProductsEndpoint(req: Request, res: Response) {
    try {
      const filters = DashboardController.parseFilters(req.query);
      const validation = DashboardController.validateFilters(filters);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const topProducts = await DashboardController.getTopProducts(filters);
      
      res.json({
        success: true,
        data: topProducts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener top productos",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  // Endpoint para top clientes
  static async getTopClientsEndpoint(req: Request, res: Response) {
    try {
      const filters = DashboardController.parseFilters(req.query);
      const validation = DashboardController.validateFilters(filters);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const topClients = await DashboardController.getTopClients(filters);
      
      res.json({
        success: true,
        data: topClients
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener top clientes",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  // Endpoint para métodos de pago
  static async getPaymentMethodsEndpoint(req: Request, res: Response) {
    try {
      const filters = DashboardController.parseFilters(req.query);
      const validation = DashboardController.validateFilters(filters);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const paymentMethods = await DashboardController.getPaymentMethodsStats(filters);
      
      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas de métodos de pago",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  // Endpoint para estadísticas AFIP
  static async getAfipStatsEndpoint(req: Request, res: Response) {
    try {
      const filters = DashboardController.parseFilters(req.query);
      const validation = DashboardController.validateFilters(filters);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const afipStats = await DashboardController.getAfipStats(filters);
      
      res.json({
        success: true,
        data: afipStats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas AFIP",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  // Endpoint para análisis comparativo
  static async getComparativeEndpoint(req: Request, res: Response) {
    try {
      const filters = DashboardController.parseFilters(req.query);
      const validation = DashboardController.validateFilters(filters);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const comparative = await DashboardController.getComparativeAnalysis(filters);
      
      if (!comparative) {
        return res.status(400).json({
          success: false,
          message: "Se requieren fechas de inicio y fin para el análisis comparativo"
        });
      }
      
      res.json({
        success: true,
        data: comparative
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener análisis comparativo",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  // Obtener estadísticas generales
  static async getOverviewStats(filters: DashboardFiltersDTO): Promise<DashboardOverviewDTO> {
    console.log('📊 [OVERVIEW] Iniciando getOverviewStats con filtros:', filters);
    
    // Primero verificar cuántas ventas hay en total
    const totalSalesInDB = await Sale.countDocuments({});
    console.log('💾 [OVERVIEW] Total de ventas en BD:', totalSalesInDB);
    
    // Verificar rango de fechas de las ventas existentes
    const dateRange = await Sale.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: "$createdAt" },
          maxDate: { $max: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('📅 [OVERVIEW] Rango de fechas de ventas:', dateRange[0]);
    
    // Verificar estado isActive de las ventas
    const activeStatus = await Sale.aggregate([
      {
        $group: {
          _id: "$isActive",
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('🔄 [OVERVIEW] Estado isActive de ventas:', activeStatus);
    
    // Verificar cuántas ventas hay en el rango de fechas SIN filtro isActive
    const salesInRange = await Sale.countDocuments({
      createdAt: {
        $gte: new Date('2025-09-17T00:00:00.000Z'),
        $lte: new Date('2025-10-17T23:59:59.999Z')
      }
    });
    console.log('📊 [OVERVIEW] Ventas en rango sin filtro isActive:', salesInRange);
    
    const matchConditions = DashboardController.buildMatchConditions(filters);
    console.log('🔍 [OVERVIEW] Condiciones de búsqueda:', JSON.stringify(matchConditions, null, 2));

    const [salesStats, clientsCount, productsCount] = await Promise.all([
      // Estadísticas de ventas
      Sale.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            averageTicket: { $avg: "$totalAmount" }
          }
        }
      ]),
      
      // Contar clientes únicos que compraron en el período
      Sale.aggregate([
        { $match: matchConditions },
        { $group: { _id: "$client" } },
        { $count: "totalClients" }
      ]),
      
      // Contar productos únicos vendidos en el período
      Sale.aggregate([
        { $match: matchConditions },
        { $unwind: "$products" },
        { $group: { _id: "$products.product" } },
        { $count: "totalProducts" }
      ])
    ]);

    console.log('📈 [OVERVIEW] Resultados de consultas:', {
      salesStats,
      clientsCount,
      productsCount
    });

    // Calcular crecimiento comparado con período anterior
    const growthRate = await DashboardController.calculateGrowthRate(filters);

    const stats = salesStats[0] || { totalSales: 0, totalRevenue: 0, averageTicket: 0 };
    console.log('📊 [OVERVIEW] Stats procesadas:', stats);
    
    return {
      totalSales: stats.totalSales,
      totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
      averageTicket: Math.round(stats.averageTicket * 100) / 100,
      growthRate,
      totalClients: clientsCount[0]?.totalClients || 0,
      totalProducts: productsCount[0]?.totalProducts || 0,
      period: {
        dateFrom: filters.dateFrom || '',
        dateTo: filters.dateTo || ''
      }
    };
  }

  // Obtener ventas por período (día, mes, etc.)
  static async getSalesByPeriod(filters: DashboardFiltersDTO): Promise<SalesByPeriodDTO[]> {
    console.log('📊 [SALES_BY_PERIOD] Iniciando con filtros:', filters);
    const matchConditions = DashboardController.buildMatchConditions(filters);
    const period = filters.period || PERIOD_TYPES.DAY;
    console.log('🔄 [SALES_BY_PERIOD] Período seleccionado:', period);

    let groupByFormat: any;
    switch (period) {
      case PERIOD_TYPES.DAY:
        groupByFormat = {
          year: { $year: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } },
          month: { $month: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } },
          day: { $dayOfMonth: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } }
        };
        break;
      case PERIOD_TYPES.WEEK:
        groupByFormat = {
          year: { $isoWeekYear: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } },
          week: { $isoWeek: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } }
        };
        break;
      case PERIOD_TYPES.MONTH:
        groupByFormat = {
          year: { $year: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } },
          month: { $month: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } }
        };
        break;
      case PERIOD_TYPES.YEAR:
        groupByFormat = {
          year: { $year: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } }
        };
        break;
      default:
        groupByFormat = {
          year: { $year: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } },
          month: { $month: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } },
          day: { $dayOfMonth: { date: "$createdAt", timezone: "America/Argentina/Buenos_Aires" } }
        };
    }
    
    console.log('📋 [SALES_BY_PERIOD] GroupBy format:', JSON.stringify(groupByFormat, null, 2));

    const salesByPeriod = await Sale.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: groupByFormat,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          averageTicket: { $avg: "$totalAmount" },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } }
    ]);
    
    console.log('📈 [SALES_BY_PERIOD] Resultados crudos:', salesByPeriod);

    return salesByPeriod.map(item => {
      const formattedPeriod = DashboardController.formatPeriodString(item._id, period);
      console.log('📅 [SALES_BY_PERIOD] Mapeando item:', {
        rawId: item._id,
        period,
        formattedPeriod,
        totalSales: item.totalSales,
        totalRevenue: item.totalRevenue
      });
      
      return {
        period: formattedPeriod,
        totalSales: item.totalSales,
        totalRevenue: Math.round(item.totalRevenue * 100) / 100,
        averageTicket: Math.round(item.averageTicket * 100) / 100,
        salesCount: item.salesCount
      };
    });
  }

  // Obtener top productos más vendidos
  static async getTopProducts(filters: DashboardFiltersDTO): Promise<TopProductDTO[]> {
    const matchConditions = DashboardController.buildMatchConditions(filters);
    const limit = Math.min(filters.limit || DASHBOARD_VALIDATION.DEFAULT_TOP_ITEMS, DASHBOARD_VALIDATION.MAX_TOP_ITEMS);

    const topProducts = await Sale.aggregate([
      { $match: matchConditions },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.unitPrice"] } },
          salesCount: { $sum: 1 },
          averagePrice: { $avg: "$products.unitPrice" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } }
    ]);

    return topProducts.map(item => ({
      productId: item._id.toString(),
      productName: item.productInfo?.name || 'Producto no encontrado',
      productCode: item.productInfo?.productCode,
      totalQuantity: item.totalQuantity,
      totalRevenue: Math.round(item.totalRevenue * 100) / 100,
      salesCount: item.salesCount,
      averagePrice: Math.round(item.averagePrice * 100) / 100
    }));
  }

  // Obtener top clientes por facturación
  static async getTopClients(filters: DashboardFiltersDTO): Promise<TopClientDTO[]> {
    const matchConditions = DashboardController.buildMatchConditions(filters);
    const limit = Math.min(filters.limit || DASHBOARD_VALIDATION.DEFAULT_TOP_ITEMS, DASHBOARD_VALIDATION.MAX_TOP_ITEMS);

    const topClients = await Sale.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$client",
          totalRevenue: { $sum: "$totalAmount" },
          salesCount: { $sum: 1 },
          lastPurchase: { $max: "$createdAt" },
          totalPurchases: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "_id",
          as: "clientInfo"
        }
      },
      { $unwind: { path: "$clientInfo", preserveNullAndEmptyArrays: true } }
    ]);

    return topClients.map(item => ({
      clientId: item._id.toString(),
      clientName: item.clientInfo?.name || 'Cliente no encontrado',
      clientType: item.clientInfo?.clientType || 'N/A',
      totalPurchases: Math.round(item.totalPurchases * 100) / 100,
      totalRevenue: Math.round(item.totalRevenue * 100) / 100,
      salesCount: item.salesCount,
      averageTicket: item.salesCount > 0 ? Math.round((item.totalRevenue / item.salesCount) * 100) / 100 : 0,
      lastSaleDate: item.lastPurchase.toISOString()
    }));
  }

  // Obtener estadísticas por método de pago
  static async getPaymentMethodsStats(filters: DashboardFiltersDTO): Promise<PaymentMethodStatsDTO[]> {
    console.log('💳 [PAYMENT_METHODS] Iniciando con filtros:', filters);
    
    const matchConditions = DashboardController.buildMatchConditions(filters);

    const paymentStats = await Sale.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$paymentMethod",
          salesCount: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    console.log('💳 [PAYMENT_METHODS] Resultados crudos:', paymentStats);

    const totalSales = paymentStats.reduce((sum, item) => sum + item.totalAmount, 0);
    console.log('💳 [PAYMENT_METHODS] Total de ventas:', totalSales);

    const result = paymentStats.map(item => ({
      paymentMethod: item._id || 'No especificado',
      salesCount: item.salesCount,
      totalAmount: Math.round(item.totalAmount * 100) / 100,
      totalRevenue: Math.round(item.totalAmount * 100) / 100, // Alias para frontend
      averageTicket: item.salesCount > 0 ? Math.round((item.totalAmount / item.salesCount) * 100) / 100 : 0,
      percentage: totalSales > 0 ? Math.round((item.totalAmount / totalSales) * 10000) / 100 : 0
    }));

    console.log('💳 [PAYMENT_METHODS] Resultado final:', result);
    return result;
  }

  // Obtener estadísticas AFIP por tipo de comprobante
  static async getAfipStats(filters: DashboardFiltersDTO): Promise<AfipStatsDTO[]> {
    console.log('📄 [AFIP_STATS] Iniciando con filtros:', filters);
    
    const matchConditions = {
      ...DashboardController.buildMatchConditions(filters),
      "afipData.tipoComprobante": { $exists: true, $ne: null }
    };

    console.log('📄 [AFIP_STATS] Condiciones de búsqueda:', matchConditions);

    const afipStats = await Sale.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$afipData.tipoComprobante",
          salesCount: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    console.log('📄 [AFIP_STATS] Resultados crudos:', afipStats);

    const totalSales = afipStats.reduce((sum, item) => sum + item.totalAmount, 0);
    console.log('📄 [AFIP_STATS] Total de ventas:', totalSales);

    const result = afipStats.map(item => ({
      comprobanteTipo: item._id?.toString() || 'N/A',
      tipoNombre: AFIP_COMPROBANTE_NOMBRES[item._id as keyof typeof AFIP_COMPROBANTE_NOMBRES] || 'Desconocido',
      comprobanteName: AFIP_COMPROBANTE_NOMBRES[item._id as keyof typeof AFIP_COMPROBANTE_NOMBRES] || 'Desconocido', // Alias para frontend
      salesCount: item.salesCount,
      totalAmount: Math.round(item.totalAmount * 100) / 100,
      totalRevenue: Math.round(item.totalAmount * 100) / 100, // Alias para frontend
      averageTicket: item.salesCount > 0 ? Math.round((item.totalAmount / item.salesCount) * 100) / 100 : 0,
      percentage: totalSales > 0 ? Math.round((item.totalAmount / totalSales) * 10000) / 100 : 0
    }));

    console.log('📄 [AFIP_STATS] Resultado final:', result);
    return result;
  }

  // Obtener análisis comparativo con período anterior
  static async getComparativeAnalysis(filters: DashboardFiltersDTO): Promise<ComparativeAnalysisDTO | null> {
    if (!filters.dateFrom || !filters.dateTo) return null;

    console.log('🔄 [COMPARATIVE] Iniciando análisis comparativo con filtros:', filters);

    // Usar zona horaria de Argentina para cálculos consistentes
    const timezone = 'America/Argentina/Buenos_Aires';
    
    const currentStart = new Date(filters.dateFrom + 'T00:00:00-03:00');
    const currentEnd = new Date(filters.dateTo + 'T23:59:59-03:00');
    
    // Calcular días del período de manera más precisa
    const periodDays = Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    console.log('📅 [COMPARATIVE] Período actual:', {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
      days: periodDays
    });

    // Calcular período anterior
    const previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000); // Un día antes del inicio actual
    const previousStart = new Date(previousEnd.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);

    console.log('📅 [COMPARATIVE] Período anterior:', {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
      days: Math.floor((previousEnd.getTime() - previousStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    });

    const [currentStats, previousStats] = await Promise.all([
      // Estadísticas período actual
      Sale.aggregate([
        {
          $match: {
            ...DashboardController.buildMatchConditions(filters),
            createdAt: { $gte: currentStart, $lte: currentEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            salesCount: { $sum: 1 }
          }
        }
      ]),
      
      // Estadísticas período anterior
      Sale.aggregate([
        {
          $match: {
            ...DashboardController.buildMatchConditions({ ...filters, dateFrom: undefined, dateTo: undefined }),
            createdAt: { $gte: previousStart, $lte: previousEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            salesCount: { $sum: 1 }
          }
        }
      ])
    ]);

    const current = currentStats[0] || { totalSales: 0, totalRevenue: 0, salesCount: 0 };
    const previous = previousStats[0] || { totalSales: 0, totalRevenue: 0, salesCount: 0 };

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    const result = {
      current: {
        period: `${filters.dateFrom} - ${filters.dateTo}`,
        totalSales: current.totalSales,
        totalRevenue: Math.round(current.totalRevenue * 100) / 100,
        salesCount: current.salesCount
      },
      previous: {
        period: `${previousStart.toISOString().split('T')[0]} - ${previousEnd.toISOString().split('T')[0]}`,
        totalSales: previous.totalSales,
        totalRevenue: Math.round(previous.totalRevenue * 100) / 100,
        salesCount: previous.salesCount
      },
      growth: {
        salesGrowth: calculateGrowth(current.totalSales, previous.totalSales),
        revenueGrowth: calculateGrowth(current.totalRevenue, previous.totalRevenue),
        countGrowth: calculateGrowth(current.salesCount, previous.salesCount)
      }
    };

    console.log('📊 [COMPARATIVE] Resultados:', {
      current: result.current,
      previous: result.previous,
      growth: result.growth
    });

    return result;
  }

  // Métodos auxiliares
  public static parseFilters(query: any): DashboardFiltersDTO {
    const filters: DashboardFiltersDTO = {};

    if (query.dateFrom) filters.dateFrom = query.dateFrom as string;
    if (query.dateTo) filters.dateTo = query.dateTo as string;
    if (query.clientId && mongoose.Types.ObjectId.isValid(query.clientId)) {
      filters.clientId = query.clientId as string;
    }
    if (query.productId && mongoose.Types.ObjectId.isValid(query.productId)) {
      filters.productId = query.productId as string;
    }
    if (query.paymentMethod) filters.paymentMethod = query.paymentMethod as string;
    if (query.comprobanteTipo) filters.comprobanteTipo = parseInt(query.comprobanteTipo);
    if (query.period && Object.values(PERIOD_TYPES).includes(query.period)) {
      filters.period = query.period as 'day' | 'week' | 'month' | 'year';
    }
    if (query.limit) {
      const limit = parseInt(query.limit);
      if (limit > 0 && limit <= DASHBOARD_VALIDATION.MAX_TOP_ITEMS) {
        filters.limit = limit;
      }
    }

    // Si no se especifican fechas, usar últimos 30 días
    if (!filters.dateFrom || !filters.dateTo) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - DASHBOARD_VALIDATION.DEFAULT_PERIOD);
      
      filters.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      filters.dateTo = today.toISOString().split('T')[0];
    }

    return filters;
  }

  public static validateFilters(filters: DashboardFiltersDTO): { isValid: boolean; message?: string } {
    if (filters.dateFrom && filters.dateTo) {
      const dateFrom = new Date(filters.dateFrom);
      const dateTo = new Date(filters.dateTo);
      
      if (dateFrom > dateTo) {
        return { isValid: false, message: "La fecha de inicio debe ser anterior a la fecha de fin" };
      }
      
      const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > DASHBOARD_VALIDATION.MAX_PERIOD_DAYS) {
        return { isValid: false, message: `El período no puede ser mayor a ${DASHBOARD_VALIDATION.MAX_PERIOD_DAYS} días` };
      }
    }

    return { isValid: true };
  }

  public static buildMatchConditions(filters: DashboardFiltersDTO): any {
    const conditions: any = {};
    
    // Solo filtrar por isActive si está definido en la venta
    // Esto permite que funcione con ventas que no tienen el campo isActive definido
    conditions.$or = [
      { isActive: true },
      { isActive: { $exists: false } },
      { isActive: null }
    ];

    if (filters.dateFrom && filters.dateTo) {
      // Construir fechas en zona horaria de Argentina (UTC-3)
      // Agregar la hora para que sea explícito y no dependa de la zona horaria del servidor
      const dateFrom = new Date(filters.dateFrom + 'T00:00:00.000-03:00');
      const dateTo = new Date(filters.dateTo + 'T23:59:59.999-03:00');
      
      console.log('📅 [BUILD_MATCH] Fechas construidas:', {
        dateFromInput: filters.dateFrom,
        dateToInput: filters.dateTo,
        dateFromParsed: dateFrom.toISOString(),
        dateToParsed: dateTo.toISOString(),
        dateFromLocal: dateFrom.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
        dateToLocal: dateTo.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
      });
      
      conditions.createdAt = {
        $gte: dateFrom,
        $lte: dateTo
      };
    }

    if (filters.clientId) {
      conditions.client = new mongoose.Types.ObjectId(filters.clientId);
    }

    if (filters.paymentMethod) {
      conditions.paymentMethod = filters.paymentMethod;
    }

    if (filters.comprobanteTipo) {
      conditions["afipData.tipoComprobante"] = filters.comprobanteTipo;
    }

    return conditions;
  }

  public static formatPeriodString(periodId: any, period: string): string {
    const { year, month, day, week } = periodId;
    console.log('🔄 [FORMAT_PERIOD] Recibido:', { periodId, period, year, month, day, week });
    
    let result: string;
    switch (period) {
      case PERIOD_TYPES.DAY:
        result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        break;
      case PERIOD_TYPES.WEEK:
        result = `${year}-S${week.toString().padStart(2, '0')}`;
        break;
      case PERIOD_TYPES.MONTH:
        result = `${year}-${month.toString().padStart(2, '0')}`;
        break;
      case PERIOD_TYPES.YEAR:
        result = year.toString();
        break;
      default:
        result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    
    console.log('📅 [FORMAT_PERIOD] Resultado:', result);
    return result;
  }

  public static async calculateGrowthRate(filters: DashboardFiltersDTO): Promise<number> {
    console.log('📈 [GROWTH_RATE] Calculando tasa de crecimiento con filtros:', filters);
    
    const comparative = await DashboardController.getComparativeAnalysis(filters);
    
    if (!comparative) {
      console.log('⚠️ [GROWTH_RATE] No se pudo obtener análisis comparativo');
      return 0;
    }
    
    const growthRate = comparative.growth.revenueGrowth;
    console.log('📊 [GROWTH_RATE] Tasa calculada:', growthRate, '%');
    
    return growthRate;
  }
}