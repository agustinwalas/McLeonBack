"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Category.ts
const mongoose_1 = require("mongoose");
const CategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Category", CategorySchema);
