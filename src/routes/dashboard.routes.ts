import { Router, Request, Response } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// ✅ Todas las rutas requieren autenticación
router.use(verifyToken);

// Endpoint principal: datos completos del dashboard
router.get("/", async (req: Request, res: Response) => {
  await DashboardController.getDashboardData(req, res);
});

// Solo estadísticas generales
router.get("/overview", async (req: Request, res: Response) => {
  try {
    const filters = DashboardController.parseFilters(req.query);
    const validation = DashboardController.validateFilters(filters);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
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
});

// Ventas por período
router.get("/sales-by-period", async (req: Request, res: Response) => {
  try {
    const filters = DashboardController.parseFilters(req.query);
    const validation = DashboardController.validateFilters(filters);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
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
});

// Top productos
router.get("/top-products", async (req: Request, res: Response) => {
  try {
    const filters = DashboardController.parseFilters(req.query);
    const validation = DashboardController.validateFilters(filters);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
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
});

// Top clientes
router.get("/top-clients", async (req: Request, res: Response) => {
  try {
    const filters = DashboardController.parseFilters(req.query);
    const validation = DashboardController.validateFilters(filters);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
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
});

// Métodos de pago
router.get("/payment-methods", async (req: Request, res: Response) => {
  try {
    const filters = DashboardController.parseFilters(req.query);
    const validation = DashboardController.validateFilters(filters);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
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
});

// Estadísticas AFIP
router.get("/afip-stats", async (req: Request, res: Response) => {
  try {
    const filters = DashboardController.parseFilters(req.query);
    const validation = DashboardController.validateFilters(filters);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
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
});

// Análisis comparativo
router.get("/comparative", async (req: Request, res: Response) => {
  try {
    const filters = DashboardController.parseFilters(req.query);
    const validation = DashboardController.validateFilters(filters);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
    }

    const comparative = await DashboardController.getComparativeAnalysis(filters);
    
    if (!comparative) {
      res.status(400).json({
        success: false,
        message: "Se requieren fechas de inicio y fin para el análisis comparativo"
      });
      return;
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
});

export default router;