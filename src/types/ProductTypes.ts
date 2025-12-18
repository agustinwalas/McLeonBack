import { Document, Types } from "mongoose";

// Enum for unit of measure
export enum UnitOfMeasure {
  UNIDAD = "UNIDAD",
  GRAMO = "GRAMO",
  KILOGRAMO = "KILOGRAMO"
}

// Interface for Mongoose Document
export interface IProduct extends Document {
  productCode: string;
  name: string;
  description?: string; // Campo opcional
  associatedSuppliers: Types.ObjectId[];
  images: string[]; // Array de URLs de imágenes
  category: Types.ObjectId;
  purchaseCost: number;
  wholesalePrice: number;
  retailPrice: number;
  currentStock: number;
  minimumStock: number;
  unitOfMeasure: UnitOfMeasure; // New field
}

// Simple interface for API/Frontend use (without Document properties)
export interface ProductType {
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

// Interface for creating/updating products (with supplier IDs as strings)
export interface ProductCreateType {
  productCode: string;
  name: string;
  description?: string; // Campo opcional
  associatedSuppliers: string[];
  images?: string[]; // Array de URLs de imágenes
  category: string;
  purchaseCost: number;
  wholesalePrice: number;
  retailPrice: number;
  currentStock?: number;
  minimumStock?: number;
  unitOfMeasure: UnitOfMeasure; // New field
}

// Populated product interface, for use when documents are populated with related data
export interface IProductPopulated extends Omit<IProduct, 'category' | 'associatedSuppliers'> {
  category?: {
    _id: string;
    name: string;
    active: boolean;
  } | string | null;
  associatedSuppliers: Array<{
    _id: string;
    name: string;
    phone: string;
    email: string;
    location: string;
  }>;
}

// Input type for creating a product
export interface ProductCreateInput {
  productCode: string;
  name: string;
  description?: string; // Campo opcional
  category?: string;
  wholesalePrice: number;
  retailPrice: number;
  currentStock: number;
  minimumStock: number;
  purchaseCost: number;
  images?: string[]; // Array de URLs de imágenes
  associatedSuppliers: string[];
  unitOfMeasure: UnitOfMeasure; // New field
}

// Input type for updating a product
export interface ProductUpdateInput {
  productCode?: string;
  name?: string;
  description?: string; // Campo opcional
  category?: string;
  wholesalePrice?: number;
  retailPrice?: number;
  currentStock?: number;
  minimumStock?: number;
  purchaseCost?: number;
  images?: string[]; // Array de URLs de imágenes
  associatedSuppliers?: string[];
  unitOfMeasure?: UnitOfMeasure; // New field
}
