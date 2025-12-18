"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// ✅ Schema para datos AFIP
const AfipSchema = new mongoose_1.Schema({
    sale: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true,
        unique: true // Una factura por venta
    },
    cuit: {
        type: String,
        required: true
    },
    puntoVenta: {
        type: Number,
        required: true
    },
    tipoComprobante: {
        type: Number,
        required: true,
        enum: [1, 6, 11] // Solo tipos válidos
    },
    numeroComprobante: {
        type: Number,
        required: false
    },
    cae: {
        type: String,
        required: false
    },
    vencimientoCae: {
        type: String,
        required: false
    },
    fechaEmision: {
        type: String,
        required: false
    },
    concepto: {
        type: Number,
        required: true,
        enum: [1, 2, 3], // 1=Productos, 2=Servicios, 3=Mixto
        default: 1
    },
    documentoTipo: {
        type: Number,
        required: true,
        enum: [80, 86, 96] // CUIT, CUIL, DNI
    },
    documentoNumero: {
        type: String,
        required: true
    },
    importeTotal: {
        type: Number,
        required: true,
        min: 0
    },
    importeNeto: {
        type: Number,
        required: true,
        min: 0
    },
    importeIva: {
        type: Number,
        required: true,
        min: 0
    },
    estado: {
        type: String,
        enum: ['PENDIENTE', 'AUTORIZADA', 'RECHAZADA'],
        default: 'PENDIENTE',
        required: true
    },
    observaciones: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});
// ✅ Índices para optimizar consultas
AfipSchema.index({ sale: 1 });
AfipSchema.index({ cae: 1 });
AfipSchema.index({ numeroComprobante: 1, puntoVenta: 1 });
AfipSchema.index({ estado: 1 });
AfipSchema.index({ fechaEmision: 1 });
AfipSchema.index({ cuit: 1 });
// ✅ Método para formatear número de comprobante
AfipSchema.methods.getFormattedNumber = function () {
    if (!this.numeroComprobante)
        return null;
    return `${String(this.puntoVenta).padStart(4, '0')}-${String(this.numeroComprobante).padStart(8, '0')}`;
};
// ✅ Método para obtener nombre del tipo de comprobante
AfipSchema.methods.getTipoComprobanteName = function () {
    const tipos = {
        1: 'Factura A',
        6: 'Factura B',
        11: 'Factura C'
    };
    return tipos[this.tipoComprobante] || `Tipo ${this.tipoComprobante}`;
};
exports.default = mongoose_1.default.model('Afip', AfipSchema);
