import { Request, Response } from "express";
import Product from "../models/Product";

export class ProductController {
  // POST - Crear nuevo producto
  static async createProduct(req: Request, res: Response) {
    try {
      const {
        productCode,
        name,
        description,
        category,
        wholesalePrice,
        purchaseCost,
        retailPrice,
        currentStock,
        minimumStock,
        associatedSuppliers,
        images,
        unitOfMeasure
      } = req.body;

      // ✅ Verificar que la categoría existe
      const Category = require("../models/Category").default;
      let categoryId = null;
      
      if (category) {
        // Si category viene como objeto, extraer solo el ID
        if (typeof category === 'object' && category._id) {
          categoryId = category._id;
        } else if (typeof category === 'string') {
          categoryId = category;
        }

        // Validar que la categoría existe
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
          res.status(400).json({ message: "Categoría no encontrada" });
          return;
        }
      }

      // ✅ Crear producto con solo el ID de la categoría
      const productData = {
        productCode,
        name,
        description: description || undefined, 
        category: categoryId, 
        purchaseCost,
        wholesalePrice,
        retailPrice,
        currentStock,
        minimumStock,
        associatedSuppliers: associatedSuppliers || [],
        images: images || [], 
        unitOfMeasure: unitOfMeasure || "UNIDAD"
      };

      const newProduct = new Product(productData);
      const savedProduct = await newProduct.save();

      // ✅ Retornar producto poblado correctamente
      const populatedProduct = await Product.findById(savedProduct._id)
        .populate('category')
        .populate('associatedSuppliers');

      res.status(201).json(populatedProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Error al crear producto", error });
    }
  }

  // PUT - Actualizar producto
  static async updateProduct(req: Request, res: Response) {
    try {
      const { category, ...updateData } = req.body;

      // ✅ Procesar categoría de la misma manera
      if (category) {
        let categoryId = null;
        
        if (typeof category === 'object' && category._id) {
          categoryId = category._id;
        } else if (typeof category === 'string') {
          categoryId = category;
        }

        if (categoryId) {
          const Category = require("../models/Category").default;
          const existingCategory = await Category.findById(categoryId);
          if (!existingCategory) {
            res.status(400).json({ message: "Categoría no encontrada" });
            return;
          }
          updateData.category = categoryId; // ✅ Solo el ID
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      )
        .populate('category')
        .populate('associatedSuppliers');

      if (!updatedProduct) {
        res.status(404).json({ message: "Producto no encontrado" });
        return;
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar producto", error });
    }
  }

  // GET - Obtener todos los productos
  static async getAllProducts(req: Request, res: Response) {
    try {
      const products = await Product.find()
        .populate('category') // ✅ Poblar categoría
        .populate('associatedSuppliers')
        .sort({ name: 1 });
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener productos", error });
    }
  }

  // GET - Obtener producto por ID
  static async getProductById(req: Request, res: Response) {
    try {
      const product = await Product.findById(req.params.id)
        .populate('category')
        .populate('associatedSuppliers');
      
      if (!product) {
        res.status(404).json({ message: "Producto no encontrado" });
        return;
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener producto", error });
    }
  }

  // DELETE - Eliminar producto
  static async deleteProduct(req: Request, res: Response) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Producto no encontrado" });
        return;
      }

      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar producto", error });
    }
  }

}