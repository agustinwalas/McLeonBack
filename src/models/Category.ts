// src/models/Category.ts
import { Schema, model } from "mongoose";
import { ICategory } from "../types/CategoryTypes";

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<ICategory>("Category", CategorySchema);
