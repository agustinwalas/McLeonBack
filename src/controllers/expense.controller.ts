import { Request, Response } from "express";
import Expense from "../models/Expense";

export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 }).lean();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener gastos" });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { title, date, amount } = req.body;

    if (!title || !date || amount === undefined) {
      res.status(400).json({ error: "Todos los campos son requeridos (title, date, amount)" });
      return;
    }

    const expense = new Expense({
      title: title.trim(),
      date: new Date(date),
      amount: parseFloat(amount.toString()),
    });

    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: "Error al crear gasto" });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, date, amount } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title.trim();
    if (date !== undefined) updates.date = new Date(date);
    if (amount !== undefined) updates.amount = parseFloat(amount.toString());

    const updated = await Expense.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      res.status(404).json({ error: "Gasto no encontrado" });
      return;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar gasto" });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: "Gasto no encontrado" });
      return;
    }

    res.json({ message: "Gasto eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar gasto" });
  }
};
