"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const Category_1 = __importDefault(require("../models/Category"));
class CategoryController {
    // GET - Obtener todas las categorías
    static async getAllCategories(req, res) {
        try {
            const categories = await Category_1.default.find().sort({ order: 1 });
            res.json(categories);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener categorías", error });
        }
    }
    // GET - Obtener categoría por ID
    static async getCategoryById(req, res) {
        try {
            const category = await Category_1.default.findById(req.params.id);
            if (!category) {
                res.status(404).json({ message: "Categoría no encontrada" });
                return;
            }
            res.json(category);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener categoría", error });
        }
    }
    // POST - Crear nueva categoría
    static async createCategory(req, res) {
        try {
            const newCategory = new Category_1.default(req.body);
            const savedCategory = await newCategory.save();
            res.status(201).json(savedCategory);
        }
        catch (error) {
            res.status(400).json({ message: "Error al crear categoría", error });
        }
    }
    // PUT - Actualizar categoría
    static async updateCategory(req, res) {
        try {
            const updatedCategory = await Category_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedCategory) {
                res.status(404).json({ message: "Categoría no encontrada" });
                return;
            }
            res.json(updatedCategory);
        }
        catch (error) {
            res.status(400).json({ message: "Error al actualizar categoría", error });
        }
    }
    // DELETE - Eliminar categoría
    static async deleteCategory(req, res) {
        try {
            const deletedCategory = await Category_1.default.findByIdAndDelete(req.params.id);
            if (!deletedCategory) {
                res.status(404).json({ message: "Categoría no encontrada" });
                return;
            }
            res.json({ message: "Categoría eliminada correctamente" });
        }
        catch (error) {
            res.status(500).json({ message: "Error al eliminar categoría", error });
        }
    }
}
exports.CategoryController = CategoryController;
