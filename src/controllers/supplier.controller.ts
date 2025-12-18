import { Request, Response } from "express";
import Supplier from "../models/Supplier";
import Product from "../models/Product";

export class SupplierController {
  // GET - Obtener todos los proveedores
  static async getAllSuppliers(req: Request, res: Response) {
    try {
      const suppliers = await Supplier.find()
        .populate("suppliedProducts")
        .sort({ name: 1 });
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener proveedores", error });
    }
  }

  // GET - Obtener proveedor por ID
  static async getSupplierById(req: Request, res: Response) {
    try {
      const supplier = await Supplier.findById(req.params.id).populate(
        "suppliedProducts"
      );

      if (!supplier) {
        res.status(404).json({ message: "Proveedor no encontrado" });
        return;
      }

      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener proveedor", error });
    }
  }

  // POST - Crear nuevo proveedor
  static async createSupplier(req: Request, res: Response) {
    try {
      const newSupplier = new Supplier(req.body);
      const savedSupplier = await newSupplier.save();

      // Poblar los datos para respuesta completa
      const populatedSupplier = await Supplier.findById(
        savedSupplier._id
      ).populate("suppliedProducts");

      res.status(201).json(populatedSupplier);
    } catch (error) {
      res.status(400).json({ message: "Error al crear proveedor", error });
    }
  }

  // PUT - Actualizar proveedor
  static async updateSupplier(req: Request, res: Response) {
    try {
      const updatedSupplier = await Supplier.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).populate("suppliedProducts");

      if (!updatedSupplier) {
        res.status(404).json({ message: "Proveedor no encontrado" });
        return;
      }

      res.json(updatedSupplier);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar proveedor", error });
    }
  }

  // DELETE - Eliminar proveedor
  static async deleteSupplier(req: Request, res: Response) {
    try {
      const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);

      if (!deletedSupplier) {
        res.status(404).json({ message: "Proveedor no encontrado" });
        return;
      }

      res.json({ message: "Proveedor eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar proveedor", error });
    }
  }

  // PUT - Actualizar precios de productos del proveedor
  static async updateSupplierProductsPrices(req: Request, res: Response) {
    try {
      const { supplierId } = req.params;
      const { percentage } = req.body;

      // Validar que el porcentaje esté presente
      if (!percentage || typeof percentage !== 'number') {
        res.status(400).json({ 
          message: "Se requiere un porcentaje válido. Ejemplo: 110 para aumentar 10%, 90 para reducir 10%" 
        });
        return;
      }

      // Validar que el proveedor exista
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        res.status(404).json({ message: "Proveedor no encontrado" });
        return;
      }

      // Calcular el multiplicador (110 = 1.10, 90 = 0.90)
      const multiplier = percentage / 100;

      // Buscar todos los productos de este proveedor
      const products = await Product.find({
        associatedSuppliers: supplierId
      });

      if (products.length === 0) {
        res.status(404).json({ 
          message: "No se encontraron productos para este proveedor" 
        });
        return;
      }

      // Actualizar los precios de todos los productos
      const updatePromises = products.map(async (product) => {
        const updatedPrices = {
          purchaseCost: Math.round(product.purchaseCost * multiplier * 100) / 100,
          wholesalePrice: Math.round(product.wholesalePrice * multiplier * 100) / 100,
          retailPrice: Math.round(product.retailPrice * multiplier * 100) / 100,
        };

        return Product.findByIdAndUpdate(
          product._id,
          updatedPrices,
          { new: true }
        );
      });

      // Ejecutar todas las actualizaciones
      const updatedProducts = await Promise.all(updatePromises);

      // Calcular estadísticas del cambio
      const priceChange = percentage > 100 ? 
        `+${percentage - 100}%` : 
        `-${100 - percentage}%`;

      res.json({
        message: `Precios actualizados correctamente (${priceChange})`,
        supplier: supplier.name,
        productsUpdated: updatedProducts.length,
        priceChange,
        percentage,
        updatedProducts: updatedProducts.map(product => ({
          id: product?._id,
          name: product?.name,
          productCode: product?.productCode,
          newPrices: {
            purchaseCost: product?.purchaseCost,
            wholesalePrice: product?.wholesalePrice,
            retailPrice: product?.retailPrice
          }
        }))
      });

    } catch (error) {
      console.error('Error al actualizar precios:', error);
      res.status(500).json({ 
        message: "Error al actualizar precios de productos", 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
}