import { Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  fullName: string;
  active: boolean;
}
