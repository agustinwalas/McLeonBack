"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTE_VALIDATION = exports.CREDIT_REASON_LABELS = exports.DEBIT_REASON_LABELS = exports.AFIP_NOTE_TYPES = void 0;
const Note_1 = require("../models/Note");
// Tipos AFIP para notas
exports.AFIP_NOTE_TYPES = {
    // Notas de Débito
    NOTA_DEBITO_A: 2,
    NOTA_DEBITO_B: 7,
    NOTA_DEBITO_C: 12,
    // Notas de Crédito
    NOTA_CREDITO_A: 3,
    NOTA_CREDITO_B: 8,
    NOTA_CREDITO_C: 13
};
// Mapeo de razones a texto legible
exports.DEBIT_REASON_LABELS = {
    [Note_1.DebitReason.INTERESES_MORA]: "Intereses por mora",
    [Note_1.DebitReason.GASTOS_ADICIONALES]: "Gastos adicionales",
    [Note_1.DebitReason.CORRECCION_MENOS]: "Corrección - se facturó de menos",
    [Note_1.DebitReason.SERVICIOS_EXTRA]: "Servicios adicionales",
    [Note_1.DebitReason.RECARGOS]: "Recargos aplicados",
    [Note_1.DebitReason.OTROS]: "Otros motivos"
};
exports.CREDIT_REASON_LABELS = {
    [Note_1.CreditReason.DEVOLUCION]: "Devolución de mercadería",
    [Note_1.CreditReason.DESCUENTO]: "Descuento aplicado",
    [Note_1.CreditReason.CORRECCION_MAS]: "Corrección - se facturó de más",
    [Note_1.CreditReason.ANULACION_PARCIAL]: "Anulación parcial",
    [Note_1.CreditReason.BONIFICACION]: "Bonificación",
    [Note_1.CreditReason.OTROS]: "Otros motivos"
};
// Validaciones
exports.NOTE_VALIDATION = {
    MAX_DESCRIPTION_LENGTH: 500,
    MIN_ITEM_QUANTITY: 0.01,
    MIN_AMOUNT: 0,
    MAX_ITEMS_PER_NOTE: 50
};
