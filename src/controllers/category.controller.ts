import { Request, Response } from "express";
import Category from "../models/Category";

export class CategoryController {
  // GET - Obtener todas las categorías
  static async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await Category.find().sort({ order: 1 });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener categorías", error });
    }
  }

  // GET - Obtener categoría por ID
  static async getCategoryById(req: Request, res: Response) {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        res.status(404).json({ message: "Categoría no encontrada" });
        return;
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener categoría", error });
    }
  }

  // POST - Crear nueva categoría
  static async createCategory(req: Request, res: Response) {
    try {
      const newCategory = new Category(req.body);
      const savedCategory = await newCategory.save();
      res.status(201).json(savedCategory);
    } catch (error) {
      res.status(400).json({ message: "Error al crear categoría", error });
    }
  }

  // PUT - Actualizar categoría
  static async updateCategory(req: Request, res: Response) {
    try {
      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      
      if (!updatedCategory) {
        res.status(404).json({ message: "Categoría no encontrada" });
        return;
      }
      
      res.json(updatedCategory);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar categoría", error });
    }
  }

  // DELETE - Eliminar categoría
  static async deleteCategory(req: Request, res: Response) {
    try {
      const deletedCategory = await Category.findByIdAndDelete(req.params.id);
      
      if (!deletedCategory) {
        res.status(404).json({ message: "Categoría no encontrada" });
        return;
      }
      
      res.json({ message: "Categoría eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar categoría", error });
    }
  }

}