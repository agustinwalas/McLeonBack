"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ExpenseSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
ExpenseSchema.index({ date: -1 });
exports.default = (0, mongoose_1.model)("Expense", ExpenseSchema);
