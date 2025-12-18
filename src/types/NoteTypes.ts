import { NoteType, DebitReason, CreditReason } from "../models/Note";

// DTOs para crear notas
export interface CreateNoteDTO {
  noteType: NoteType;
  originalSaleId: string;
  reason: DebitReason | CreditReason;
  customReason?: string;
  description: string;
  items: CreateNoteItemDTO[];
  // Los datos de la factura original se extraen automáticamente de la venta
}

export interface CreateNoteItemDTO {
  productId?: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

// DTOs para actualizar notas
export interface UpdateNoteDTO {
  reason?: DebitReason | CreditReason;
  customReason?: string;
  description?: string;
  items?: CreateNoteItemDTO[];
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'SENT_TO_AFIP' | 'COMPLETED' | 'ERROR';
}

// DTO para respuestas
export interface NoteResponseDTO {
  id: string;
  noteType: NoteType;
  noteNumber?: string;
  
  // Relación con factura original
  originalSaleId: string;
  originalInvoiceNumber: string;
  
  // Datos AFIP de la factura original
  originalAfipData: {
    cbteTipo: number;
    ptoVta: number;
    cbteNro: number;
    cbteFch: string;
    cae?: string;
  };
  
  // Cliente
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientCuit?: string;
  clientAddress?: string;
  
  // Motivo
  reason: DebitReason | CreditReason;
  customReason?: string;
  description: string;
  
  // Items
  items: NoteItemResponseDTO[];
  
  // Montos
  subtotal: number;
  ivaAmount: number;
  totalAmount: number;
  
  // Forma de pago
  paymentMethod?: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE';
  
  // AFIP
  cbteTipo?: number;
  ptoVta?: number;
  cbteDesde?: number;
  cbteHasta?: number;
  cbteFch?: string;
  cae?: string;
  caeFchVto?: string;
  resultado?: string;
  observaciones?: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  status: string;
}

export interface NoteItemResponseDTO {
  productId?: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

// Filtros para búsqueda
export interface NoteFiltersDTO {
  noteType?: NoteType;
  clientId?: string;
  originalSaleId?: string;
  status?: string;
  reason?: DebitReason | CreditReason;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Estadísticas de notas
export interface NoteStatsDTO {
  totalNotes: number;
  totalDebits: number;
  totalCredits: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  notesByStatus: {
    status: string;
    count: number;
    totalAmount: number;
  }[];
  notesByReason: {
    reason: string;
    count: number;
    totalAmount: number;
  }[];
}

// Tipos AFIP para notas
export const AFIP_NOTE_TYPES = {
  // Notas de Débito
  NOTA_DEBITO_A: 2,
  NOTA_DEBITO_B: 7,
  NOTA_DEBITO_C: 12,
  
  // Notas de Crédito
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  NOTA_CREDITO_C: 13
} as const;

// Mapeo de razones a texto legible
export const DEBIT_REASON_LABELS: Record<DebitReason, string> = {
  [DebitReason.INTERESES_MORA]: "Intereses por mora",
  [DebitReason.GASTOS_ADICIONALES]: "Gastos adicionales",
  [DebitReason.CORRECCION_MENOS]: "Corrección - se facturó de menos",
  [DebitReason.SERVICIOS_EXTRA]: "Servicios adicionales",
  [DebitReason.RECARGOS]: "Recargos aplicados",
  [DebitReason.OTROS]: "Otros motivos"
};

export const CREDIT_REASON_LABELS: Record<CreditReason, string> = {
  [CreditReason.DEVOLUCION]: "Devolución de mercadería",
  [CreditReason.DESCUENTO]: "Descuento aplicado",
  [CreditReason.CORRECCION_MAS]: "Corrección - se facturó de más",
  [CreditReason.ANULACION_PARCIAL]: "Anulación parcial",
  [CreditReason.BONIFICACION]: "Bonificación",
  [CreditReason.OTROS]: "Otros motivos"
};

// Validaciones
export const NOTE_VALIDATION = {
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_ITEM_QUANTITY: 0.01,
  MIN_AMOUNT: 0,
  MAX_ITEMS_PER_NOTE: 50
} as const;