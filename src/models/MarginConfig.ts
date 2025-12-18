import mongoose, { Schema } from "mongoose";
import { IMarginConfig } from "../types/MarginConfig";



const MarginConfigSchema = new Schema<IMarginConfig>({
  wholesaleMargin: {
    type: Number,
    required: true,
    default: 1.6,
  },
  retailMargin: {
    type: Number,
    required: true,
    default: 1.8,
  },
});

export const MarginConfig = mongoose.model<IMarginConfig>("MarginConfig", MarginConfigSchema);
