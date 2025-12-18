"use strict";
// Tipos TypeScript para el Dashboard del backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.AFIP_COMPROBANTE_NOMBRES = exports.PERIOD_TYPES = exports.DASHBOARD_VALIDATION = void 0;
// Constantes para validación
exports.DASHBOARD_VALIDATION = {
    MAX_PERIOD_DAYS: 365, // Máximo 1 año
    MIN_PERIOD_DAYS: 1, // Mínimo 1 día
    MAX_TOP_ITEMS: 100, // Máximo items en rankings
    DEFAULT_TOP_ITEMS: 10,
    DEFAULT_PERIOD: 30 // Últimos 30 días por defecto
};
exports.PERIOD_TYPES = {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
};
exports.AFIP_COMPROBANTE_NOMBRES = {
    1: 'Factura A',
    6: 'Factura B',
    11: 'Factura C',
    3: 'Nota de Crédito A',
    8: 'Nota de Crédito B',
    13: 'Nota de Crédito C',
    2: 'Nota de Débito A',
    7: 'Nota de Débito B',
    12: 'Nota de Débito C'
};
