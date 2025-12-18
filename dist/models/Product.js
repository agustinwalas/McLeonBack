"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Product.ts
const mongoose_1 = require("mongoose");
const ProductSchema = new mongoose_1.Schema({
    productCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    shopifyName: { type: String, required: false }, // Nombre específico para Shopify
    description: { type: String },
    activeInShopify: { type: Boolean, default: false },
    associatedSuppliers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Supplier" }],
    images: [{ type: String }], // Array de URLs de imágenes
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true },
    collections: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "ShopifyCollection" }],
    purchaseCost: { type: Number, required: true },
    wholesalePrice: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 0 },
    unitOfMeasure: {
        type: String,
        enum: ["UNIDAD", "GRAMO", "KILOGRAMO"],
        default: "UNIDAD",
        required: true
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Product", ProductSchema);
