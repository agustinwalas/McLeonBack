"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getAllExpenses = void 0;
const Expense_1 = __importDefault(require("../models/Expense"));
const getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense_1.default.find().sort({ date: -1 }).lean();
        res.json(expenses);
    }
    catch (error) {
        res.status(500).json({ error: "Error al obtener gastos" });
    }
};
exports.getAllExpenses = getAllExpenses;
const createExpense = async (req, res) => {
    try {
        const { title, date, amount } = req.body;
        if (!title || !date || amount === undefined) {
            res.status(400).json({ error: "Todos los campos son requeridos (title, date, amount)" });
            return;
        }
        const expense = new Expense_1.default({
            title: title.trim(),
            date: new Date(date),
            amount: parseFloat(amount.toString()),
        });
        const saved = await expense.save();
        res.status(201).json(saved);
    }
    catch (error) {
        res.status(500).json({ error: "Error al crear gasto" });
    }
};
exports.createExpense = createExpense;
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, date, amount } = req.body;
        const updates = {};
        if (title !== undefined)
            updates.title = title.trim();
        if (date !== undefined)
            updates.date = new Date(date);
        if (amount !== undefined)
            updates.amount = parseFloat(amount.toString());
        const updated = await Expense_1.default.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updated) {
            res.status(404).json({ error: "Gasto no encontrado" });
            return;
        }
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: "Error al actualizar gasto" });
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Expense_1.default.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ error: "Gasto no encontrado" });
            return;
        }
        res.json({ message: "Gasto eliminado exitosamente" });
    }
    catch (error) {
        res.status(500).json({ error: "Error al eliminar gasto" });
    }
};
exports.deleteExpense = deleteExpense;
