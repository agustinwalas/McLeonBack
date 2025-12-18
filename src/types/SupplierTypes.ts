import { Document, Types } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  razonSocial: string;
  phone: string;
  email: string;
  location: string;
  suppliedProducts: Types.ObjectId[];
}
