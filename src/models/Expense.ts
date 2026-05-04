import { Schema, model, Document } from "mongoose";

export interface IExpense extends Document {
  title: string;
  date: Date;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: {
      type: String,
      required: [true, "El título es requerido"],
      trim: true,
      maxlength: [200, "El título no puede exceder 200 caracteres"],
    },
    date: {
      type: Date,
      required: [true, "La fecha es requerida"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "El gasto es requerido"],
      min: [0, "El gasto debe ser mayor o igual a 0"],
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });

export default model<IExpense>("Expense", ExpenseSchema);
