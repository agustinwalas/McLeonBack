// src/models/DailyProfit.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyProfit extends Document {
  date: Date;           // Día (sin hora, solo fecha)
  totalBaseCost: number; // Suma de (purchaseCost * quantity) de todos los productos vendidos ese día
  totalSaleAmount: number; // Suma de totalAmount de todas las ventas del día
  totalProfit: number;    // totalSaleAmount - totalBaseCost
  salesCount: number;     // Cantidad de ventas del día
  createdAt: Date;
  updatedAt: Date;
}

const DailyProfitSchema = new Schema({
  date: {
    type: Date,
    required: true,
    unique: true, // Solo un registro por día
  },
  totalBaseCost: {
    type: Number,
    required: true,
    default: 0,
  },
  totalSaleAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  totalProfit: {
    type: Number,
    required: true,
    default: 0,
  },
  salesCount: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

// Índice para búsquedas por rango de fecha
DailyProfitSchema.index({ date: -1 });

export default mongoose.model<IDailyProfit>('DailyProfit', DailyProfitSchema);
