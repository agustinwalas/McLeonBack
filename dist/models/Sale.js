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
// src/models/Sale.ts
const mongoose_1 = __importStar(require("mongoose"));
// ✅ Schema de Sale limpio
const SaleSchema = new mongoose_1.Schema({
    saleNumber: {
        type: String,
        unique: true,
    },
    user: {
        _id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    client: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Client',
        required: false
    },
    products: [{
            product: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 0.01
            },
            priceType: {
                type: String,
                enum: ['MAYORISTA', 'MINORISTA'],
                required: true
            },
            unitPrice: {
                type: Number,
                required: true,
                min: 0
            },
            discountPercentage: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
                default: 100
            },
            subtotal: {
                type: Number,
                required: true,
                min: 0
            },
            // Costo del producto al momento de la venta (para que la ganancia no cambie
            // si después se actualiza el purchaseCost del producto)
            purchaseCost: {
                type: Number,
                required: false,
                min: 0
            }
        }],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    totalDiscount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    amountPaid: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE'],
        required: true
    },
    deliveryType: {
        type: String,
        enum: ['RETIRO_LOCAL', 'DELIVERY'],
        required: true
    },
    deliveryFee: {
        type: Number,
        default: 0,
        min: 0
    },
    deliveryAddress: {
        street: { type: String },
        number: { type: String },
        city: { type: String },
        province: { type: String },
        postalCode: { type: String },
        additionalInfo: { type: String }
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    afipData: {
        cae: { type: String },
        vencimiento: { type: String },
        vencimientoCae: { type: String },
        comprobante: { type: String },
        cuit: { type: String },
        puntoVenta: { type: Number },
        tipoComprobante: { type: Number },
        numeroComprobante: { type: Number },
        fechaEmision: { type: String },
        concepto: { type: Number },
        documentoTipo: { type: Number },
        documentoNumero: { type: String },
        importeTotal: { type: Number },
        importeNeto: { type: Number },
        importeIva: { type: Number },
        estado: { type: String },
        observaciones: { type: String }
    }
}, {
    timestamps: true
});
// ✅ Pre-save hook corregido para generar números secuenciales únicos
SaleSchema.pre('save', async function (next) {
    if (this.isNew && !this.saleNumber) {
        try {
            const SaleModel = this.constructor;
            // ✅ Buscar la última venta por saleNumber en orden descendente
            const lastSale = await SaleModel.findOne({}, { saleNumber: 1 })
                .sort({ saleNumber: -1 })
                .lean();
            let nextNumber = 1;
            if (lastSale && lastSale.saleNumber) {
                // Extraer el número del formato "V000001" -> 1
                const currentNumber = parseInt(lastSale.saleNumber.replace('V', ''));
                nextNumber = currentNumber + 1;
            }
            // Formatear con ceros a la izquierda
            this.saleNumber = `V${String(nextNumber).padStart(6, '0')}`;
        }
        catch (error) {
            console.error('❌ Error generando número de venta:', error);
            return next(error);
        }
    }
    next();
});
// ✅ Índices para Sale
SaleSchema.index({ client: 1 });
SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ status: 1 });
exports.default = mongoose_1.default.model('Sale', SaleSchema);
