import { Request, Response } from "express";
import SupplierInvoice from "../models/SupplierInvoice";
import Supplier from "../models/Supplier";
import { 
  CreateSupplierInvoiceRequest, 
  UpdateSupplierInvoiceRequest,
  SupplierInvoiceResponse 
} from "../types/SupplierInvoiceTypes";

// Obtener todas las facturas de proveedores
export const getAllSupplierInvoices = async (req: Request, res: Response) => {
  try {
    const { 
      page, 
      limit, 
      supplierId, 
      startDate, 
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Solo aplicar paginación si se especifican page y limit
    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 0; // 0 = sin límite
    const skip = (page && limit) ? (pageNum - 1) * limitNum : 0;

    // Construir filtros
    const filters: any = {};
    
    if (supplierId) {
      filters.supplierId = supplierId;
    }

    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate as string);
      if (endDate) filters.date.$lte = new Date(endDate as string);
    }

    // Construir ordenamiento
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Construir query base
    let query = SupplierInvoice.find(filters)
      .populate('supplier', 'name email')
      .sort(sort);

    // Aplicar paginación solo si se especifica
    if (page && limit) {
      query = query.skip(skip).limit(limitNum);
    }

    const [invoices, total] = await Promise.all([
      query.lean(),
      SupplierInvoice.countDocuments(filters)
    ]);

    const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 1;

    // Respuesta adaptada según si hay paginación o no
    if (page && limit) {
      res.json({
        invoices,
        currentPage: pageNum,
        totalPages,
        totalInvoices: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      });
    } else {
      // Sin paginación, devolver todas las facturas
      res.json({
        invoices,
        totalInvoices: total
      });
    }
  } catch (error) {
    console.error("Error al obtener facturas de proveedores:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// Obtener una factura por ID
export const getSupplierInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await SupplierInvoice.findById(id)
      .populate('supplier', 'name email phone address')
      .lean();

    if (!invoice) {
      res.status(404).json({ error: "Factura no encontrada" });
      return;
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error al obtener factura:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// Crear nueva factura de proveedor
export const createSupplierInvoice = async (req: Request, res: Response) => {
  try {
    const { supplierId, businessName, invoiceNumber, date, amount }: CreateSupplierInvoiceRequest = req.body;

    // Validaciones básicas
    if (!supplierId || !businessName || !invoiceNumber || !date || amount === undefined) {
      res.status(400).json({ 
        error: "Todos los campos son requeridos (supplierId, businessName, invoiceNumber, date, amount)" 
      });
      return;
    }

    // Verificar si ya existe una factura con el mismo número para el mismo proveedor
    const existingInvoice = await SupplierInvoice.findOne({
      supplierId,
      invoiceNumber
    });

    if (existingInvoice) {
      res.status(400).json({ 
        error: "Ya existe una factura con este número para el proveedor seleccionado" 
      });
      return;
    }

    // Crear la factura
    const newInvoice = new SupplierInvoice({
      supplierId,
      businessName: businessName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      date: new Date(date),
      amount: parseFloat(amount.toString())
    });

    const savedInvoice = await newInvoice.save();
    
    // Obtener la factura con los datos del proveedor
    const invoiceWithSupplier = await SupplierInvoice.findById(savedInvoice._id)
      .populate('supplier', 'name email')
      .lean();

    res.status(201).json(invoiceWithSupplier);
  } catch (error) {
    console.error("Error al crear factura:", error);
    
    if (error instanceof Error && error.message.includes('proveedor especificado no existe')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// Actualizar factura de proveedor
export const updateSupplierInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateSupplierInvoiceRequest = req.body;

    // Verificar que la factura existe
    const existingInvoice = await SupplierInvoice.findById(id);
    if (!existingInvoice) {
      res.status(404).json({ error: "Factura no encontrada" });
      return;
    }

    // Si se actualiza el número de factura, verificar duplicados
    if (updates.invoiceNumber && updates.invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicateInvoice = await SupplierInvoice.findOne({
        supplierId: existingInvoice.supplierId,
        invoiceNumber: updates.invoiceNumber,
        _id: { $ne: id }
      });

      if (duplicateInvoice) {
        res.status(400).json({ 
          error: "Ya existe una factura con este número para el proveedor" 
        });
        return;
      }
    }

    // Procesar actualizaciones
    const processedUpdates: any = {};
    
    if (updates.businessName) processedUpdates.businessName = updates.businessName.trim();
    if (updates.invoiceNumber) processedUpdates.invoiceNumber = updates.invoiceNumber.trim();
    if (updates.date) processedUpdates.date = new Date(updates.date);
    if (updates.amount !== undefined) processedUpdates.amount = parseFloat(updates.amount.toString());

    const updatedInvoice = await SupplierInvoice.findByIdAndUpdate(
      id,
      processedUpdates,
      { new: true, runValidators: true }
    ).populate('supplier', 'name email').lean();

    res.json(updatedInvoice);
  } catch (error) {
    console.error("Error al actualizar factura:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// Eliminar factura de proveedor
export const deleteSupplierInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedInvoice = await SupplierInvoice.findByIdAndDelete(id);

    if (!deletedInvoice) {
      res.status(404).json({ error: "Factura no encontrada" });
      return;
    }

    res.json({ 
      message: "Factura eliminada exitosamente",
      deletedInvoice: {
        id: deletedInvoice._id,
        invoiceNumber: deletedInvoice.invoiceNumber,
        businessName: deletedInvoice.businessName
      }
    });
  } catch (error) {
    console.error("Error al eliminar factura:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

// Obtener estadísticas de facturas por proveedor
export const getSupplierInvoiceStats = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { year } = req.query;

    const matchStage: any = { supplierId: supplierId };
    
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    const stats = await SupplierInvoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
          lastInvoiceDate: { $max: "$date" },
          firstInvoiceDate: { $min: "$date" }
        }
      }
    ]);

    const monthlyStats = await SupplierInvoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
      general: stats[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        averageAmount: 0,
        minAmount: 0,
        maxAmount: 0,
        lastInvoiceDate: null,
        firstInvoiceDate: null
      },
      monthly: monthlyStats
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};