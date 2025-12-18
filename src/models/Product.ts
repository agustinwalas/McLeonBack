// src/models/Product.ts
import { Schema, model } from "mongoose";
import { IProduct } from "../types/ProductTypes";

const ProductSchema = new Schema(
  {
    productCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    associatedSuppliers: [{ type: Schema.Types.ObjectId, ref: "Supplier" }],
    images: [{ type: String }], // Array de URLs de imágenes
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    purchaseCost: { type: Number, required: true },
    wholesalePrice: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 0 },
    unitOfMeasure: {
      type: String,
      enum: ["UNIDAD", "GRAMO", "KILOGRAMO"],
      default: "UNIDAD",
      required: true
    },
  },
  { timestamps: true }
);

export default model<IProduct>("Product", ProductSchema);
