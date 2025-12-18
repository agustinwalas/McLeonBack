import mongoose, { Document, Schema } from 'mongoose';

// ✅ Interface base para datos AFIP (sin Document)
export interface IAfipBase {
  sale: string; // ObjectId ref to Sale
  cuit: string;
  puntoVenta: number;
  tipoComprobante: number; // 1=Factura A, 6=Factura B, 11=Factura C
  numeroComprobante?: number;
  cae?: string;
  vencimientoCae?: string;
  fechaEmision?: string;
  concepto: number; // 1=Productos, 2=Servicios, 3=Productos y Servicios
  documentoTipo: number; // 80=CUIT, 86=CUIL, 96=DNI
  documentoNumero: string;
  importeTotal: number;
  importeNeto: number;
  importeIva: number;
  estado: 'PENDIENTE' | 'AUTORIZADA' | 'RECHAZADA';
  observaciones?: string;
}

// ✅ Interface para Document de MongoDB (con métodos)
export interface IAfipData extends Document, IAfipBase {
  getFormattedNumber(): string | null;
  getTipoComprobanteName(): string;
}

// ✅ Schema para datos AFIP
const AfipSchema = new Schema({
  sale: {
    type: Schema.Types.ObjectId,
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
AfipSchema.methods.getFormattedNumber = function(this: IAfipData): string | null {
  if (!this.numeroComprobante) return null;
  return `${String(this.puntoVenta).padStart(4, '0')}-${String(this.numeroComprobante).padStart(8, '0')}`;
};

// ✅ Método para obtener nombre del tipo de comprobante
AfipSchema.methods.getTipoComprobanteName = function(this: IAfipData): string {
  const tipos: { [key: number]: string } = {
    1: 'Factura A',
    6: 'Factura B',
    11: 'Factura C'
  };
  return tipos[this.tipoComprobante] || `Tipo ${this.tipoComprobante}`;
};

export default mongoose.model<IAfipData>('Afip', AfipSchema);