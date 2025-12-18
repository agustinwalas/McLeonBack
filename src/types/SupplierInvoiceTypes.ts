import { Document, Types } from "mongoose";

// Interfaz base para la factura de proveedor
export interface ISupplierInvoice {
  supplierId: Types.ObjectId;
  businessName: string; // Razón social
  invoiceNumber: string; // Número de factura
  date: Date; // Fecha
  amount: number; // Importe
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz del documento de MongoDB
export interface ISupplierInvoiceDocument extends ISupplierInvoice, Document {
  _id: Types.ObjectId;
}

// Tipos para requests
export interface CreateSupplierInvoiceRequest {
  supplierId: string;
  businessName: string;
  invoiceNumber: string;
  date: string | Date;
  amount: number;
}

export interface UpdateSupplierInvoiceRequest {
  businessName?: string;
  invoiceNumber?: string;
  date?: string | Date;
  amount?: number;
}

// Tipo para respuestas
export interface SupplierInvoiceResponse {
  _id: string;
  supplierId: string;
  businessName: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  supplier?: {
    _id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}