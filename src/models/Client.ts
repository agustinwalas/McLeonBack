// src/models/Client.ts
import { Schema, model } from "mongoose";
import {
  TaxCondition,
  DocumentType,
  ClientType,
  AfipCondicionIva,
  IClient,
} from "../types/ClientTypes";

// ------------------------------
// Helpers de validación
// ------------------------------
const onlyDigits = (v: string) => (v || "").replace(/\D+/g, "");

function isValidCuit(cuit: string): boolean {
  const v = onlyDigits(cuit);
  if (!/^\d{11}$/.test(v)) return false;
  const dig = v.split("").map(Number);
  const mul = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = mul.reduce((acc, m, i) => acc + m * dig[i], 0);
  const mod = 11 - (sum % 11);
  const check = mod === 11 ? 0 : mod === 10 ? 9 : mod;
  return check === dig[10];
}

function isValidDocNumberForType(docType: string, docNumber: string): boolean {
  const n = onlyDigits(docNumber);
  switch (docType) {
    case "CUIT":
    case "CUIL":
    case "CDI":
      return /^\d{11}$/.test(n) && (docType === "CUIT" ? isValidCuit(n) : true);
    case "DNI":
      return /^\d{7,9}$/.test(n);
    case "LE":
    case "LC":
      return /^\d{6,8}$/.test(n);
    case "PASSPORT":
      return n.length >= 6; // flexible
    case "CONSUMIDOR_FINAL":
      return n === "0" || n === ""; // AFIP suele usar 0
    default:
      return n.length > 0;
  }
}

// ------------------------------
// Subdocumentos
// ------------------------------
const AddressSchema = new Schema(
  {
    street: { type: String, required: false }, // ✅ Opcional
    number: { type: String, required: false }, // ✅ Opcional
    floor: { type: String, required: false },
    apartment: { type: String, required: false },
    city: { type: String, required: false }, // ✅ Opcional
    province: { type: String, required: false }, // ✅ Opcional
    postalCode: { type: String, required: false }, // ✅ Opcional
    country: { type: String, required: false, default: "Argentina" },
  },
  { _id: false }
);

// ------------------------------
// Cliente
// ------------------------------
const ClientSchema = new Schema<IClient>(
  {
    // Identidad
    name: { type: String, required: true },
    clientType: {
      type: String,
      enum: Object.values(ClientType), // "PERSONA_FISICA" | "PERSONA_JURIDICA"
      required: true,
    },

    // Documento AFIP
    documentType: {
      type: String,
      enum: Object.values(DocumentType), // "CUIT" | "DNI" | ...
      required: true,
    },
    documentNumber: {
      type: String,
      required: true,
      set: (v: string) => onlyDigits(v),
    },

    // Condición fiscal
    taxCondition: {
      type: String,
      enum: Object.values(TaxCondition), // p.ej. "Responsable Inscripto"
      required: true,
    },
    afipCondicionIva: {
      type: Number,
      enum: Object.values(AfipCondicionIva).filter((v) => typeof v === "number") as number[],
      required: true,
    },

    // Contacto
    email: {
      type: String,
      required: false, // ✅ Opcional
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"],
    },
    phone: { type: String, required: false, trim: true }, // ✅ Opcional

    // Domicilios
    fiscalAddress: { type: AddressSchema, required: false }, // ✅ Opcional
    shippingAddress: { type: AddressSchema, required: false },

    // Compatibilidad con esquema anterior (opcional / deprecado)
    address: { type: String, required: false },

    // Comerciales (no-AFIP)
    acceptsElectronicInvoice: { type: Boolean, default: true },
    defaultPaymentMethod: { type: String, required: false },
    creditLimit: { type: Number, required: false },
    priceList: { type: String, enum: ["MAYORISTA", "MINORISTA"], required: false },
    contactPerson: { type: String, required: false },
    contactPhone: { type: String, required: false },
    fantasyName: { type: String, required: false },
    businessActivity: { type: String, required: false },

    // Exterior
    foreignTaxId: { type: String, required: false },

    // Estado & metadatos
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ------------------------------
// ✅ Validación condicional para fiscalAddress
// ------------------------------
ClientSchema.path("fiscalAddress").validate(function (this: any, value: any) {
  // Si es Responsable Inscripto, fiscalAddress es obligatoria
  if (this.taxCondition === "Responsable Inscripto") {
    if (!value) {
      return false;
    }
    
    // Verificar campos mínimos
    const requiredFields = ['street', 'number', 'city', 'province', 'postalCode'];
    for (const field of requiredFields) {
      if (!value[field] || value[field].toString().trim() === '') {
        return false;
      }
    }
  }
  
  return true;
}, "La dirección fiscal es requerida y debe estar completa para Responsables Inscriptos");

// Validar documentNumber según documentType
ClientSchema.path("documentNumber").validate(function (this: any, v: string) {
  return isValidDocNumberForType(this.documentType, v);
}, "Número de documento inválido para el tipo seleccionado.");

// ------------------------------
// Hooks simplificados
// ------------------------------

// Generar address legacy si existe fiscalAddress
ClientSchema.pre("save", function (next) {
  const self: any = this;
  if (!self.address && self.fiscalAddress) {
    const f = self.fiscalAddress || {};
    const addressParts = [
      f.street && f.number ? `${f.street} ${f.number}` : '',
      f.city || '',
      f.province || '',
      f.postalCode || '',
      f.country !== 'Argentina' ? f.country || '' : ''
    ].filter(part => part.trim() !== '');
    
    if (addressParts.length > 0) {
      self.address = addressParts.join(', ');
    }
  }
  next();
});


// ✅ Incluir virtuals en JSON
ClientSchema.set('toJSON', { virtuals: true });
ClientSchema.set('toObject', { virtuals: true });

// Índices útiles
ClientSchema.index({ name: 1 });
ClientSchema.index({ documentType: 1, documentNumber: 1 });

export default model<IClient>("Client", ClientSchema);
