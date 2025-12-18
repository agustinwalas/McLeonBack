"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SupplierInvoiceSchema = new mongoose_1.Schema({
    supplierId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Supplier",
        required: [true, "El ID del proveedor es requerido"],
        index: true
    },
    businessName: {
        type: String,
        required: [true, "La razón social es requerida"],
        trim: true,
        maxlength: [200, "La razón social no puede exceder 200 caracteres"]
    },
    invoiceNumber: {
        type: String,
        required: [true, "El número de factura es requerido"],
        trim: true,
        maxlength: [50, "El número de factura no puede exceder 50 caracteres"]
    },
    date: {
        type: Date,
        required: [true, "La fecha es requerida"],
        index: true
    },
    amount: {
        type: Number,
        required: [true, "El importe es requerido"],
        min: [0, "El importe debe ser mayor o igual a 0"]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Índices para optimizar búsquedas
SupplierInvoiceSchema.index({ supplierId: 1, date: -1 });
SupplierInvoiceSchema.index({ invoiceNumber: 1, supplierId: 1 }, { unique: true });
SupplierInvoiceSchema.index({ date: -1 });
SupplierInvoiceSchema.index({ amount: -1 });
// Virtual populate para obtener los datos del proveedor
SupplierInvoiceSchema.virtual('supplier', {
    ref: 'Supplier',
    localField: 'supplierId',
    foreignField: '_id',
    justOne: true
});
// Middleware para validar que el proveedor existe
SupplierInvoiceSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('supplierId')) {
        const Supplier = (0, mongoose_1.model)('Supplier');
        const supplierExists = await Supplier.findById(this.supplierId);
        if (!supplierExists) {
            const error = new Error('El proveedor especificado no existe');
            return next(error);
        }
    }
    next();
});
exports.default = (0, mongoose_1.model)('SupplierInvoice', SupplierInvoiceSchema);
