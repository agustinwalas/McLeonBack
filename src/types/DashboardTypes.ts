// Tipos TypeScript para el Dashboard del backend

export interface DashboardOverviewDTO {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  growthRate: number;
  totalClients: number;
  totalProducts: number;
  period: {
    dateFrom: string;
    dateTo: string;
  };
}

export interface SalesByPeriodDTO {
  period: string; // "2025-10-14" o "2025-10" según granularidad
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  salesCount: number;
}

export interface ComparativeAnalysisDTO {
  current: {
    period: string;
    totalSales: number;
    totalRevenue: number;
    salesCount: number;
  };
  previous: {
    period: string;
    totalSales: number;
    totalRevenue: number;
    salesCount: number;
  };
  growth: {
    salesGrowth: number; // Porcentaje
    revenueGrowth: number; // Porcentaje
    countGrowth: number; // Porcentaje
  };
}

export interface TopProductDTO {
  productId: string;
  productName: string;
  productCode?: string;
  totalQuantity: number;
  totalRevenue: number;
  salesCount: number;
  averagePrice: number;
}

export interface TopClientDTO {
  clientId: string;
  clientName: string;
  clientType: string;
  totalPurchases: number;
  totalRevenue: number;
  salesCount: number;
  averageTicket: number;
  lastSaleDate: string;
}

export interface PaymentMethodStatsDTO {
  paymentMethod: string;
  salesCount: number;
  totalAmount: number;
  totalRevenue: number; // Alias para frontend
  averageTicket: number;
  percentage: number;
}

export interface AfipStatsDTO {
  comprobanteTipo: string;
  tipoNombre: string;
  comprobanteName: string; // Alias para frontend
  salesCount: number;
  totalAmount: number;
  totalRevenue: number; // Alias para frontend
  averageTicket: number;
  percentage: number;
}

export interface CategoryStatsDTO {
  categoryId?: string;
  categoryName: string;
  productsCount: number;
  totalQuantity: number;
  totalRevenue: number;
  salesCount: number;
}

export interface DashboardFiltersDTO {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  productId?: string;
  categoryId?: string;
  paymentMethod?: string;
  comprobanteTipo?: number;
  period?: 'day' | 'week' | 'month' | 'year';
  limit?: number; // Para top rankings
}

// Respuesta completa del dashboard
export interface DashboardResponseDTO {
  overview: DashboardOverviewDTO;
  salesByPeriod: SalesByPeriodDTO[];
  topProducts: TopProductDTO[];
  topClients: TopClientDTO[];
  paymentMethods: PaymentMethodStatsDTO[];
  afipStats: AfipStatsDTO[];
  categories?: CategoryStatsDTO[];
  comparative?: ComparativeAnalysisDTO;
  generatedAt: string;
  filters: DashboardFiltersDTO;
}

// Para queries de agregación de MongoDB
export interface SalesAggregationResult {
  _id: any;
  totalSales: number;
  totalRevenue: number;
  salesCount: number;
  averageTicket: number;
}

// Constantes para validación
export const DASHBOARD_VALIDATION = {
  MAX_PERIOD_DAYS: 365, // Máximo 1 año
  MIN_PERIOD_DAYS: 1,   // Mínimo 1 día
  MAX_TOP_ITEMS: 100,   // Máximo items en rankings
  DEFAULT_TOP_ITEMS: 10,
  DEFAULT_PERIOD: 30    // Últimos 30 días por defecto
} as const;

export const PERIOD_TYPES = {
  DAY: 'day',
  WEEK: 'week', 
  MONTH: 'month',
  YEAR: 'year'
} as const;

export const AFIP_COMPROBANTE_NOMBRES = {
  1: 'Factura A',
  6: 'Factura B', 
  11: 'Factura C',
  3: 'Nota de Crédito A',
  8: 'Nota de Crédito B',
  13: 'Nota de Crédito C',
  2: 'Nota de Débito A',
  7: 'Nota de Débito B',
  12: 'Nota de Débito C'
} as const;