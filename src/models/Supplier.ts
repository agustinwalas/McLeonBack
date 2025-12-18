// src/models/Supplier.ts
import { Schema, model } from "mongoose";
import { ISupplier } from "../types/SupplierTypes";

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    razonSocial: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: [200, "La razón social no puede exceder 200 caracteres"]
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
    suppliedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export default model<ISupplier>("Supplier", SupplierSchema);
