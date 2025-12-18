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
exports.Note = exports.CreditReason = exports.DebitReason = exports.NoteType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Tipos de nota
var NoteType;
(function (NoteType) {
    NoteType["DEBITO"] = "DEBITO";
    NoteType["CREDITO"] = "CREDITO";
})(NoteType || (exports.NoteType = NoteType = {}));
// Motivos predefinidos para las notas
var DebitReason;
(function (DebitReason) {
    DebitReason["INTERESES_MORA"] = "INTERESES_MORA";
    DebitReason["GASTOS_ADICIONALES"] = "GASTOS_ADICIONALES";
    DebitReason["CORRECCION_MENOS"] = "CORRECCION_MENOS";
    DebitReason["SERVICIOS_EXTRA"] = "SERVICIOS_EXTRA";
    DebitReason["RECARGOS"] = "RECARGOS";
    DebitReason["OTROS"] = "OTROS";
})(DebitReason || (exports.DebitReason = DebitReason = {}));
var CreditReason;
(function (CreditReason) {
    CreditReason["DEVOLUCION"] = "DEVOLUCION";
    CreditReason["DESCUENTO"] = "DESCUENTO";
    CreditReason["CORRECCION_MAS"] = "CORRECCION_MAS";
    CreditReason["ANULACION_PARCIAL"] = "ANULACION_PARCIAL";
    CreditReason["BONIFICACION"] = "BONIFICACION";
    CreditReason["OTROS"] = "OTROS";
})(CreditReason || (exports.CreditReason = CreditReason = {}));
const NoteItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: false
    },
    productName: {
        type: String,
        required: true
    },
    productCode: {
        type: String,
        required: false
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: false
    }
});
const NoteSchema = new mongoose_1.Schema({
    // Información básica
    noteType: {
        type: String,
        enum: Object.values(NoteType),
        required: true
    },
    noteNumber: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    // Relación OBLIGATORIA con factura original
    originalSaleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Sale",
        required: true
    },
    originalInvoiceNumber: {
        type: String,
        required: true // Requerido por AFIP
    },
    // Datos AFIP de la factura original (requeridos para el enlace)
    originalAfipData: {
        cbteTipo: {
            type: Number,
            required: true // Tipo de comprobante original
        },
        ptoVta: {
            type: Number,
            required: true // Punto de venta original
        },
        cbteNro: {
            type: Number,
            required: true // Número de comprobante original
        },
        cbteFch: {
            type: String,
            required: true // Fecha de factura original
        },
        cae: {
            type: String,
            required: false // CAE original (puede no tener si es vieja)
        }
    },
    // Datos del cliente
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Client",
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    clientEmail: {
        type: String,
        required: false
    },
    clientCuit: {
        type: String,
        required: false
    },
    clientAddress: {
        type: String,
        required: false
    },
    // Motivo
    reason: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                if (this.noteType === NoteType.DEBITO) {
                    return Object.values(DebitReason).includes(value);
                }
                else {
                    return Object.values(CreditReason).includes(value);
                }
            },
            message: 'Motivo inválido para el tipo de nota'
        }
    },
    customReason: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    // Items
    items: [NoteItemSchema],
    // Montos
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    ivaAmount: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    // Forma de pago
    paymentMethod: {
        type: String,
        enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE'],
        required: false
    },
    // AFIP
    cbteTipo: {
        type: Number,
        required: false
    },
    ptoVta: {
        type: Number,
        required: false
    },
    cbteDesde: {
        type: Number,
        required: false
    },
    cbteHasta: {
        type: Number,
        required: false
    },
    cbteFch: {
        type: String,
        required: false
    },
    cae: {
        type: String,
        required: false
    },
    caeFchVto: {
        type: String,
        required: false
    },
    resultado: {
        type: String,
        required: false
    },
    observaciones: {
        type: String,
        required: false
    },
    // Metadata
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['DRAFT', 'PENDING', 'APPROVED', 'SENT_TO_AFIP', 'COMPLETED', 'ERROR'],
        default: 'DRAFT'
    }
}, {
    timestamps: true
});
// Índices para optimizar consultas
NoteSchema.index({ noteType: 1 });
NoteSchema.index({ originalSaleId: 1 });
NoteSchema.index({ clientId: 1 });
NoteSchema.index({ status: 1 });
NoteSchema.index({ createdAt: -1 });
// noteNumber ya tiene índice único definido en el schema field
// Middleware pre-save para validaciones
NoteSchema.pre('save', function (next) {
    // Validar que el total sea correcto
    const calculatedSubtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    if (Math.abs(this.subtotal - calculatedSubtotal) > 0.01) {
        return next(new Error('El subtotal no coincide con la suma de los items'));
    }
    // Validar total con IVA
    const expectedTotal = this.subtotal + this.ivaAmount;
    if (Math.abs(this.totalAmount - expectedTotal) > 0.01) {
        return next(new Error('El total no coincide con subtotal + IVA'));
    }
    // Validar datos AFIP obligatorios
    if (!this.originalAfipData) {
        return next(new Error('Los datos AFIP de la factura original son obligatorios'));
    }
    if (!this.originalAfipData.cbteTipo || !this.originalAfipData.ptoVta || !this.originalAfipData.cbteNro) {
        return next(new Error('Los datos del comprobante original son incompletos'));
    }
    next();
});
// Virtual para obtener el tipo de comprobante AFIP
NoteSchema.virtual('afipComprobanteType').get(function () {
    // El tipo de nota debe coincidir con el tipo de factura original
    // Si la factura original es tipo A (1), la nota debe ser tipo A
    // Si la factura original es tipo B (6), la nota debe ser tipo B
    const originalType = this.originalAfipData?.cbteTipo;
    if (this.noteType === NoteType.DEBITO) {
        // Notas de Débito
        if (originalType === 1)
            return 2; // Nota Débito A
        if (originalType === 6)
            return 7; // Nota Débito B  
        if (originalType === 11)
            return 12; // Nota Débito C
        return 7; // Por defecto Nota Débito B
    }
    else {
        // Notas de Crédito
        if (originalType === 1)
            return 3; // Nota Crédito A
        if (originalType === 6)
            return 8; // Nota Crédito B
        if (originalType === 11)
            return 13; // Nota Crédito C
        return 8; // Por defecto Nota Crédito B
    }
});
exports.Note = mongoose_1.default.model("Note", NoteSchema);
