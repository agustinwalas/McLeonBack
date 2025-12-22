// src/models/Sale.ts
import mongoose, { Document, Schema } from 'mongoose';
import { PaymentMethod, PriceType, DeliveryType } from "../types/SaleTypes";

// ✅ Interface de Sale limpia (sin AFIP)
export interface ISale extends Document {
  _id: string;
  saleNumber: string; 
  client?: string;
  products: Array<{
    product: string;
    quantity: number;
    priceType: 'MAYORISTA' | 'MINORISTA';
    unitPrice: number;
    discountPercentage: number;
    subtotal: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE';
  deliveryType: 'RETIRO_LOCAL' | 'DELIVERY';
  deliveryFee: number;
  deliveryAddress?: {
    street: string;
    number: string;
    city: string;
    province: string;
    postalCode: string;
    additionalInfo?: string;
  };
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
  afipData?: {
    cae?: string;
    vencimiento?: string;
    comprobante?: string;
    [key: string]: any;
  };
}

// ✅ Schema de Sale limpio
const SaleSchema = new Schema({
  saleNumber: {
    type: String,
    unique: true,
  },
  user: { // ✅ Cambiar a objeto simple (no referencia)
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
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  products: [{
    product: {
      type: Schema.Types.ObjectId,
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
SaleSchema.pre('save', async function(next) {
  if (this.isNew && !this.saleNumber) {
    try {
      const SaleModel = this.constructor as any;
      
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
      
 
      
    } catch (error) {
      console.error('❌ Error generando número de venta:', error);
      return next(error as Error);
    }
  }
  next();
});

// ✅ Índices para Sale
SaleSchema.index({ client: 1 });
SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ status: 1 });

export default mongoose.model<ISale>('Sale', SaleSchema);
