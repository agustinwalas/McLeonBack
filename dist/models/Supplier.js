"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Supplier.ts
const mongoose_1 = require("mongoose");
const SupplierSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    razonSocial: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, "La razón social no puede exceder 200 caracteres"]
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
    suppliedProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Supplier", SupplierSchema);
