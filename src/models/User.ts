import { Schema, model, Document } from "mongoose";
import { IUser } from "../types/UserPayload";


const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});

export default model<IUser>("User", userSchema);
