import mongoose, { Document, Schema } from "mongoose";

// Tipos de nota
export enum NoteType {
  DEBITO = "DEBITO",
  CREDITO = "CREDITO"
}

// Motivos predefinidos para las notas
export enum DebitReason {
  INTERESES_MORA = "INTERESES_MORA",
  GASTOS_ADICIONALES = "GASTOS_ADICIONALES", 
  CORRECCION_MENOS = "CORRECCION_MENOS",
  SERVICIOS_EXTRA = "SERVICIOS_EXTRA",
  RECARGOS = "RECARGOS",
  OTROS = "OTROS"
}

export enum CreditReason {
  DEVOLUCION = "DEVOLUCION",
  DESCUENTO = "DESCUENTO",
  CORRECCION_MAS = "CORRECCION_MAS", 
  ANULACION_PARCIAL = "ANULACION_PARCIAL",
  BONIFICACION = "BONIFICACION",
  OTROS = "OTROS"
}

// Producto/item de la nota
export interface INoteItem {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

// Interface para Nota
export interface INote extends Document {
  // Información básica
  noteType: NoteType;
  noteNumber?: string;
  
  // Relación OBLIGATORIA con factura original (requerido por AFIP)
  originalSaleId: mongoose.Types.ObjectId;
  originalInvoiceNumber: string; // Número de factura original (requerido por AFIP)
  
  // Datos AFIP de la factura original
  originalAfipData: {
    cbteTipo: number;        // Tipo de comprobante original (1=Factura A, 6=Factura B, etc)
    ptoVta: number;          // Punto de venta de la factura original
    cbteNro: number;         // Número de comprobante original
    cbteFch: string;         // Fecha de la factura original
    cae?: string;            // CAE de la factura original
  };
  
  // Datos del cliente (copiados de la venta original)
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  clientEmail?: string;
  clientCuit?: string;
  clientAddress?: string;
  
  // Motivo y descripción
  reason: DebitReason | CreditReason;
  customReason?: string;
  description: string;
  
  // Items de la nota
  items: INoteItem[];
  
  // Montos
  subtotal: number;
  ivaAmount: number;
  totalAmount: number;
  
  // Forma de pago (copiada de la venta original)
  paymentMethod?: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE';
  
  // AFIP
  cbteTipo?: number; // 2,3,7,8,12,13 según tipo de nota
  ptoVta?: number;
  cbteDesde?: number;
  cbteHasta?: number;
  cbteFch?: string;
  cae?: string;
  caeFchVto?: string;
  resultado?: string;
  observaciones?: string;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  
  // Estado de proceso
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'SENT_TO_AFIP' | 'COMPLETED' | 'ERROR';
}

const NoteItemSchema = new Schema<INoteItem>({
  productId: { 
    type: Schema.Types.ObjectId, 
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

const NoteSchema = new Schema<INote>({
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
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
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
      validator: function(value: string) {
        if (this.noteType === NoteType.DEBITO) {
          return Object.values(DebitReason).includes(value as DebitReason);
        } else {
          return Object.values(CreditReason).includes(value as CreditReason);
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
    type: Schema.Types.ObjectId,
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
NoteSchema.pre('save', function(next) {
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
NoteSchema.virtual('afipComprobanteType').get(function() {
  // El tipo de nota debe coincidir con el tipo de factura original
  // Si la factura original es tipo A (1), la nota debe ser tipo A
  // Si la factura original es tipo B (6), la nota debe ser tipo B
  
  const originalType = this.originalAfipData?.cbteTipo;
  
  if (this.noteType === NoteType.DEBITO) {
    // Notas de Débito
    if (originalType === 1) return 2; // Nota Débito A
    if (originalType === 6) return 7; // Nota Débito B  
    if (originalType === 11) return 12; // Nota Débito C
    return 7; // Por defecto Nota Débito B
  } else {
    // Notas de Crédito
    if (originalType === 1) return 3; // Nota Crédito A
    if (originalType === 6) return 8; // Nota Crédito B
    if (originalType === 11) return 13; // Nota Crédito C
    return 8; // Por defecto Nota Crédito B
  }
});

export const Note = mongoose.model<INote>("Note", NoteSchema);