import { Document } from "mongoose";

// ===============================
// AFIP: Enums y catálogos
// ===============================
export enum TaxCondition {
  RESPONSABLE_INSCRIPTO = "Responsable Inscripto",
  MONOTRIBUTO = "Monotributo",
  CONSUMIDOR_FINAL = "Consumidor Final",
  EXENTO = "Exento",
  NO_RESPONSABLE = "No Responsable",
  MONOTRIBUTO_SOCIAL = "Monotributo Social",
  PEQUENO_CONTRIBUYENTE_EVENTUAL = "Pequeño Contribuyente Eventual",
  PEQUENO_CONTRIBUYENTE_EVENTUAL_SOCIAL = "Pequeño Contribuyente Eventual Social",
  NO_CATEGORIZADO = "No Categorizado",
}

export enum DocumentType {
  CUIT = "CUIT",
  CUIL = "CUIL",
  CDI = "CDI", // Cédula de Identidad
  LE = "LE", // Libreta de Enrolamiento
  LC = "LC", // Libreta Cívica
  DNI = "DNI",
  PASSPORT = "PASSPORT",
  CONSUMIDOR_FINAL = "CONSUMIDOR_FINAL", // DocTipo 99 (sin identificación)
}

export enum AfipCondicionIva {
  RESPONSABLE_INSCRIPTO = 1,
  EXENTO = 2,
  CONSUMIDOR_FINAL = 5,
  RESPONSABLE_NO_INSCRIPTO = 6,
  MONOTRIBUTO = 11,
  PEQUENO_CONTRIBUYENTE_EVENTUAL = 13,
  MONOTRIBUTO_SOCIAL = 14,
  PEQUENO_CONTRIBUYENTE_EVENTUAL_SOCIAL = 15,
  NO_CATEGORIZADO = 99,
}

export enum ClientType {
  PERSONA_FISICA = "PERSONA_FISICA",
  PERSONA_JURIDICA = "PERSONA_JURIDICA",
}

// ===============================
// Direcciones
// ===============================
export interface Address {
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string; // Default: "Argentina"
}

// ===============================
// Interfaz principal
// ===============================
export interface IClient extends Document {
  // Identidad
  name: string;
  clientType: ClientType;

  // Documento
  documentType: DocumentType;
  documentNumber: string;

  // Condición fiscal
  taxCondition: TaxCondition; // Label AFIP legible
  afipCondicionIva: AfipCondicionIva;

  // Contacto
  email?: string;
  phone?: string;

  // Domicilios
  fiscalAddress?: Address;
  shippingAddress?: Address;

  // Campo legacy opcional (compatibilidad)
  address?: string;

  // Comerciales
  acceptsElectronicInvoice?: boolean;
  defaultPaymentMethod?: string;
  creditLimit?: number;
  priceList?: "MAYORISTA" | "MINORISTA";
  contactPerson?: string;
  contactPhone?: string;
  fantasyName?: string;
  businessActivity?: string;

  // Exterior
  foreignTaxId?: string;

  // Estado
  isActive: boolean;

  // Metadatos
  createdAt?: Date;
  updatedAt?: Date;
}
