"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const Product_1 = __importDefault(require("../models/Product"));
class ProductController {
    // POST - Crear nuevo producto
    static async createProduct(req, res) {
        try {
            const { productCode, name, description, category, wholesalePrice, purchaseCost, retailPrice, activeInShopify, currentStock, minimumStock, associatedSuppliers, images, unitOfMeasure, collections } = req.body;
            // ✅ Verificar que la categoría existe
            const Category = require("../models/Category").default;
            let categoryId = null;
            if (category) {
                // Si category viene como objeto, extraer solo el ID
                if (typeof category === 'object' && category._id) {
                    categoryId = category._id;
                }
                else if (typeof category === 'string') {
                    categoryId = category;
                }
                // Validar que la categoría existe
                const existingCategory = await Category.findById(categoryId);
                if (!existingCategory) {
                    res.status(400).json({ message: "Categoría no encontrada" });
                    return;
                }
            }
            // Normalizar collections: solo IDs
            let collectionsIds = [];
            if (collections && Array.isArray(collections)) {
                collectionsIds = collections.map((c) => typeof c === 'string' ? c : c._id);
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
                unitOfMeasure: unitOfMeasure || "UNIDAD",
                activeInShopify,
                collections: collectionsIds
            };
            const newProduct = new Product_1.default(productData);
            const savedProduct = await newProduct.save();
            // ✅ Retornar producto poblado correctamente
            const populatedProduct = await Product_1.default.findById(savedProduct._id)
                .populate('category')
                .populate('associatedSuppliers')
                .populate('collections');
            // 🚀 Sincronización automática con Shopify si está activo
            if (savedProduct.activeInShopify) {
                try {
                    const { autoSyncWithShopify } = require('../services/shopifyService');
                    // Hacer sincronización en background (no bloquear la respuesta)
                    process.nextTick(async () => {
                        await autoSyncWithShopify(populatedProduct);
                    });
                }
                catch (syncError) {
                    console.error('Error iniciando sincronización automática:', syncError);
                }
            }
            res.status(201).json(populatedProduct);
        }
        catch (error) {
            console.error("Error creating product:", error);
            res.status(400).json({ message: "Error al crear producto", error });
        }
    }
    // PUT - Actualizar producto
    static async updateProduct(req, res) {
        try {
            const { category, collections, activeInShopify, ...updateData } = req.body;
            // ✅ Procesar categoría de la misma manera
            if (category) {
                let categoryId = null;
                if (typeof category === 'object' && category._id) {
                    categoryId = category._id;
                }
                else if (typeof category === 'string') {
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
            // Normalizar collections: solo IDs
            let collectionsIds = [];
            if (collections && Array.isArray(collections)) {
                collectionsIds = collections.map((c) => typeof c === 'string' ? c : c._id);
            }
            if (collections) {
                updateData.collections = collectionsIds;
            }
            // Asegurar que activeInShopify se actualiza correctamente
            if (typeof activeInShopify !== 'undefined') {
                updateData.activeInShopify = activeInShopify;
            }
            // Si se desactiva activeInShopify, eliminar de Shopify
            if (activeInShopify === false) {
                const product = await Product_1.default.findById(req.params.id);
                if (product) {
                    const ShopifyProduct = require("../models/Shopify").default;
                    const shopifyProduct = await ShopifyProduct.findOne({ productId: product._id });
                    if (shopifyProduct && shopifyProduct.shopifyProductId) {
                        try {
                            const shopifyService = require("../services/shopifyService").getShopifyService();
                            await shopifyService.deleteProduct(shopifyProduct.shopifyProductId);
                            await ShopifyProduct.deleteOne({ _id: shopifyProduct._id });
                        }
                        catch (err) {
                            console.error("Error eliminando producto de Shopify:", err);
                        }
                    }
                }
            }
            const updatedProduct = await Product_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true })
                .populate('category')
                .populate('associatedSuppliers')
                .populate('collections');
            if (!updatedProduct) {
                res.status(404).json({ message: "Producto no encontrado" });
                return;
            }
            // 🚀 Sincronización automática con Shopify si está activo
            if (updatedProduct.activeInShopify) {
                try {
                    console.log('🔄 Iniciando sincronización con Shopify para producto:', updatedProduct.name);
                    console.log('📝 Variables de entorno Shopify:', {
                        shopName: process.env.SHOPIFY_SHOP_NAME ? '✅ Configurada' : '❌ No configurada',
                        accessToken: process.env.SHOPIFY_ACCESS_TOKEN ? '✅ Configurada' : '❌ No configurada',
                        apiVersion: process.env.SHOPIFY_API_VERSION || 'No configurada'
                    });
                    const { autoSyncWithShopify } = require('../services/shopifyService');
                    // Hacer sincronización en background (no bloquear la respuesta)
                    process.nextTick(async () => {
                        try {
                            await autoSyncWithShopify(updatedProduct);
                            console.log('✅ Sincronización completada para:', updatedProduct.name);
                        }
                        catch (syncError) {
                            console.error('❌ Error en sincronización automática:', {
                                producto: updatedProduct.name,
                                error: syncError.message,
                                stack: syncError.stack
                            });
                        }
                    });
                }
                catch (syncError) {
                    console.error('❌ Error iniciando sincronización automática:', {
                        error: syncError.message,
                        stack: syncError.stack
                    });
                }
            }
            res.json(updatedProduct);
        }
        catch (error) {
            res.status(400).json({ message: "Error al actualizar producto", error });
        }
    }
    // GET - Obtener todos los productos
    static async getAllProducts(req, res) {
        try {
            const products = await Product_1.default.find()
                .populate('category') // ✅ Poblar categoría
                .populate('associatedSuppliers')
                .populate('collections')
                .sort({ name: 1 });
            res.json(products);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener productos", error });
        }
    }
    // GET - Obtener producto por ID
    static async getProductById(req, res) {
        try {
            const product = await Product_1.default.findById(req.params.id)
                .populate('category')
                .populate('associatedSuppliers')
                .populate('collections');
            if (!product) {
                res.status(404).json({ message: "Producto no encontrado" });
                return;
            }
            res.json(product);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener producto", error });
        }
    }
    // DELETE - Eliminar producto
    static async deleteProduct(req, res) {
        try {
            // Buscar el producto y su registro de Shopify
            const product = await Product_1.default.findById(req.params.id);
            if (!product) {
                res.status(404).json({ message: "Producto no encontrado" });
                return;
            }
            // Buscar el registro de Shopify
            const ShopifyProduct = require("../models/Shopify").default;
            const shopifyProduct = await ShopifyProduct.findOne({ productId: product._id });
            if (shopifyProduct && shopifyProduct.shopifyProductId) {
                try {
                    const shopifyService = require("../services/shopifyService").getShopifyService();
                    await shopifyService.deleteProduct(shopifyProduct.shopifyProductId);
                    await ShopifyProduct.deleteOne({ _id: shopifyProduct._id });
                }
                catch (err) {
                    console.error("Error eliminando producto de Shopify:", err);
                }
            }
            await Product_1.default.findByIdAndDelete(req.params.id);
            res.json({ message: "Producto eliminado correctamente" });
        }
        catch (error) {
            res.status(500).json({ message: "Error al eliminar producto", error });
        }
    }
}
exports.ProductController = ProductController;
