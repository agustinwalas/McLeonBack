"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteController = void 0;
const Note_1 = require("../models/Note");
const Sale_1 = __importDefault(require("../models/Sale"));
const NoteTypes_1 = require("../types/NoteTypes");
const mongoose_1 = __importDefault(require("mongoose"));
class NoteController {
    // Obtener todas las notas con filtros y paginación
    static async getAllNotes(req, res) {
        try {
            const { noteType, clientId, originalSaleId, status, reason, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
            // Construir filtros
            const filters = { isActive: true };
            if (noteType)
                filters.noteType = noteType;
            if (clientId)
                filters.clientId = clientId;
            if (originalSaleId)
                filters.originalSaleId = originalSaleId;
            if (status)
                filters.status = status;
            if (reason)
                filters.reason = reason;
            // Filtro por fechas
            if (dateFrom || dateTo) {
                filters.createdAt = {};
                if (dateFrom)
                    filters.createdAt.$gte = new Date(dateFrom);
                if (dateTo)
                    filters.createdAt.$lte = new Date(dateTo);
            }
            // Paginación
            const skip = (Number(page) - 1) * Number(limit);
            // Consulta con populate
            const notes = await Note_1.Note.find(filters)
                .populate('clientId', 'name email cuit address')
                .populate('originalSaleId', 'saleNumber totalAmount createdAt')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));
            const totalNotes = await Note_1.Note.countDocuments(filters);
            const totalPages = Math.ceil(totalNotes / Number(limit));
            res.json({
                success: true,
                data: {
                    notes: notes.map(note => NoteController.formatNoteResponse(note)),
                    pagination: {
                        currentPage: Number(page),
                        totalPages,
                        totalItems: totalNotes,
                        itemsPerPage: Number(limit)
                    }
                }
            });
        }
        catch (error) {
            console.error("Error getting notes:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener las notas",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    // Obtener una nota por ID
    static async getNoteById(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID de nota inválido"
                });
            }
            const note = await Note_1.Note.findOne({ _id: id, isActive: true })
                .populate('clientId', 'name email cuit address')
                .populate('originalSaleId', 'saleNumber totalAmount createdAt items')
                .populate('createdBy', 'name email');
            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: "Nota no encontrada"
                });
            }
            res.json({
                success: true,
                data: NoteController.formatNoteResponse(note)
            });
        }
        catch (error) {
            console.error("Error getting note by id:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener la nota",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    // Crear nueva nota
    static async createNote(req, res) {
        try {
            const noteData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado"
                });
            }
            // Validar datos básicos
            const validation = await NoteController.validateNoteData(noteData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message
                });
            }
            // Verificar que la venta original existe
            const originalSale = await Sale_1.default.findById(noteData.originalSaleId)
                .populate('client');
            if (!originalSale) {
                return res.status(404).json({
                    success: false,
                    message: "Venta original no encontrada"
                });
            }
            // Verificar que tiene cliente asociado
            if (!originalSale.client) {
                return res.status(400).json({
                    success: false,
                    message: "La venta original no tiene cliente asociado"
                });
            }
            // Verificar que la venta tiene datos AFIP (es una factura válida)
            if (!originalSale.afipData || !originalSale.afipData.cae) {
                return res.status(400).json({
                    success: false,
                    message: "La venta original debe ser una factura con CAE válido de AFIP"
                });
            }
            // Verificar que tiene número de factura
            if (!originalSale.saleNumber) {
                return res.status(400).json({
                    success: false,
                    message: "La venta original debe tener número de comprobante"
                });
            }
            // Calcular montos
            const calculatedAmounts = NoteController.calculateAmounts(noteData.items);
            console.log('[NOTE] Datos AFIP de la venta original:', originalSale.afipData);
            console.log('[NOTE] Número de venta:', originalSale.saleNumber);
            // Extraer datos AFIP con manejo de diferentes formatos
            const afipData = originalSale.afipData || {};
            const cbteTipo = afipData.tipoComprobante || afipData.cbteTipo || 6;
            const ptoVta = afipData.puntoVenta || afipData.ptoVta || 1;
            const cbteNro = afipData.numeroComprobante || afipData.cbteNro || 0;
            const cbteFch = afipData.fechaEmision || afipData.cbteFch || new Date().toISOString().split('T')[0];
            console.log('[NOTE] Datos AFIP procesados:', { cbteTipo, ptoVta, cbteNro, cbteFch });
            // Crear nota
            const newNote = new Note_1.Note({
                noteType: noteData.noteType,
                originalSaleId: noteData.originalSaleId,
                originalInvoiceNumber: originalSale.saleNumber,
                // Datos AFIP de la factura original (requeridos)
                originalAfipData: {
                    cbteTipo,
                    ptoVta,
                    cbteNro,
                    cbteFch,
                    cae: afipData.cae
                },
                // Datos del cliente (copiados de la venta)
                clientId: typeof originalSale.client === 'string' ? originalSale.client : originalSale.client._id,
                clientName: originalSale.client.name || 'Cliente sin nombre',
                clientEmail: originalSale.client.email,
                clientCuit: originalSale.client.documentNumber || afipData.cuit,
                clientAddress: originalSale.client.address,
                // Motivo y descripción
                reason: noteData.reason,
                customReason: noteData.customReason,
                description: noteData.description,
                // Items con totales calculados (desglosando IVA)
                items: noteData.items.map(item => {
                    // El unitPrice viene CON IVA, lo desglosamos
                    const totalConIva = item.quantity * item.unitPrice;
                    const totalSinIva = totalConIva / 1.21; // Desglosar IVA
                    return {
                        productId: item.productId ? new mongoose_1.default.Types.ObjectId(item.productId) : undefined,
                        productName: item.productName,
                        productCode: item.productCode,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice, // Guardamos el precio unitario CON IVA
                        totalPrice: Math.round(totalSinIva * 100) / 100, // Pero el totalPrice es SIN IVA
                        description: item.description
                    };
                }),
                // Montos calculados
                subtotal: calculatedAmounts.subtotal,
                ivaAmount: calculatedAmounts.ivaAmount,
                totalAmount: calculatedAmounts.totalAmount,
                // Forma de pago (copiar de la venta original)
                paymentMethod: originalSale.paymentMethod,
                // Metadata
                createdBy: userId,
                status: 'DRAFT'
            });
            // Debug: Verificar que los montos coincidan
            const itemsTotal = newNote.items.reduce((sum, item) => sum + item.totalPrice, 0);
            console.log('[NOTE] Validación de montos:');
            console.log('- Suma de items (sin IVA):', Math.round(itemsTotal * 100) / 100);
            console.log('- Subtotal declarado (sin IVA):', newNote.subtotal);
            console.log('- IVA:', newNote.ivaAmount);
            console.log('- Total (con IVA):', newNote.totalAmount);
            let savedNote;
            try {
                savedNote = await newNote.save();
            }
            catch (saveError) {
                console.error('[NOTE] Error al guardar la nota:', saveError);
                console.error('[NOTE] Validation errors:', saveError.errors);
                return res.status(400).json({
                    success: false,
                    message: "Error de validación al crear la nota",
                    errors: saveError.errors || saveError.message
                });
            }
            // Populate para respuesta
            const populatedNote = await Note_1.Note.findById(savedNote._id)
                .populate('clientId', 'name email cuit address')
                .populate('originalSaleId', 'saleNumber totalAmount')
                .populate('createdBy', 'name email');
            res.status(201).json({
                success: true,
                message: "Nota creada exitosamente",
                data: NoteController.formatNoteResponse(populatedNote)
            });
        }
        catch (error) {
            console.error("Error creating note:", error);
            res.status(500).json({
                success: false,
                message: "Error al crear la nota",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    // Actualizar nota
    static async updateNote(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID de nota inválido"
                });
            }
            const note = await Note_1.Note.findOne({ _id: id, isActive: true });
            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: "Nota no encontrada"
                });
            }
            // No permitir editar notas ya enviadas a AFIP
            if (['SENT_TO_AFIP', 'COMPLETED'].includes(note.status)) {
                return res.status(400).json({
                    success: false,
                    message: "No se puede modificar una nota ya enviada a AFIP"
                });
            }
            // Actualizar campos
            if (updateData.reason)
                note.reason = updateData.reason;
            if (updateData.customReason !== undefined)
                note.customReason = updateData.customReason;
            if (updateData.description)
                note.description = updateData.description;
            if (updateData.status)
                note.status = updateData.status;
            // Si se actualizan items, recalcular montos
            if (updateData.items) {
                const calculatedAmounts = NoteController.calculateAmounts(updateData.items);
                note.items = updateData.items.map(item => ({
                    productId: item.productId ? new mongoose_1.default.Types.ObjectId(item.productId) : undefined,
                    productName: item.productName,
                    productCode: item.productCode,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                    description: item.description
                }));
                note.subtotal = calculatedAmounts.subtotal;
                note.ivaAmount = calculatedAmounts.ivaAmount;
                note.totalAmount = calculatedAmounts.totalAmount;
            }
            const updatedNote = await note.save();
            // Populate para respuesta
            const populatedNote = await Note_1.Note.findById(updatedNote._id)
                .populate('clientId', 'name email cuit address')
                .populate('originalSaleId', 'saleNumber totalAmount')
                .populate('createdBy', 'name email');
            res.json({
                success: true,
                message: "Nota actualizada exitosamente",
                data: NoteController.formatNoteResponse(populatedNote)
            });
        }
        catch (error) {
            console.error("Error updating note:", error);
            res.status(500).json({
                success: false,
                message: "Error al actualizar la nota",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    // Eliminar nota (soft delete)
    static async deleteNote(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID de nota inválido"
                });
            }
            const note = await Note_1.Note.findOne({ _id: id, isActive: true });
            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: "Nota no encontrada"
                });
            }
            // No permitir eliminar notas ya enviadas a AFIP
            if (['SENT_TO_AFIP', 'COMPLETED'].includes(note.status)) {
                return res.status(400).json({
                    success: false,
                    message: "No se puede eliminar una nota ya enviada a AFIP"
                });
            }
            note.isActive = false;
            await note.save();
            res.json({
                success: true,
                message: "Nota eliminada exitosamente"
            });
        }
        catch (error) {
            console.error("Error deleting note:", error);
            res.status(500).json({
                success: false,
                message: "Error al eliminar la nota",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    // Obtener estadísticas de notas
    static async getNoteStats(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            // Construir filtros de fecha
            const dateFilter = { isActive: true };
            if (dateFrom || dateTo) {
                dateFilter.createdAt = {};
                if (dateFrom)
                    dateFilter.createdAt.$gte = new Date(dateFrom);
                if (dateTo)
                    dateFilter.createdAt.$lte = new Date(dateTo);
            }
            // Agregaciones para estadísticas
            const [totalStats, statusStats, reasonStats] = await Promise.all([
                // Estadísticas generales
                Note_1.Note.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: null,
                            totalNotes: { $sum: 1 },
                            totalDebits: {
                                $sum: { $cond: [{ $eq: ["$noteType", "DEBITO"] }, 1, 0] }
                            },
                            totalCredits: {
                                $sum: { $cond: [{ $eq: ["$noteType", "CREDITO"] }, 1, 0] }
                            },
                            totalDebitAmount: {
                                $sum: { $cond: [{ $eq: ["$noteType", "DEBITO"] }, "$totalAmount", 0] }
                            },
                            totalCreditAmount: {
                                $sum: { $cond: [{ $eq: ["$noteType", "CREDITO"] }, "$totalAmount", 0] }
                            }
                        }
                    }
                ]),
                // Estadísticas por status
                Note_1.Note.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 },
                            totalAmount: { $sum: "$totalAmount" }
                        }
                    },
                    { $sort: { count: -1 } }
                ]),
                // Estadísticas por motivo
                Note_1.Note.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: "$reason",
                            count: { $sum: 1 },
                            totalAmount: { $sum: "$totalAmount" }
                        }
                    },
                    { $sort: { count: -1 } }
                ])
            ]);
            const stats = {
                totalNotes: totalStats[0]?.totalNotes || 0,
                totalDebits: totalStats[0]?.totalDebits || 0,
                totalCredits: totalStats[0]?.totalCredits || 0,
                totalDebitAmount: totalStats[0]?.totalDebitAmount || 0,
                totalCreditAmount: totalStats[0]?.totalCreditAmount || 0,
                notesByStatus: statusStats.map(stat => ({
                    status: stat._id,
                    count: stat.count,
                    totalAmount: stat.totalAmount
                })),
                notesByReason: reasonStats.map(stat => ({
                    reason: stat._id,
                    count: stat.count,
                    totalAmount: stat.totalAmount
                }))
            };
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error("Error getting note stats:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener estadísticas",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    // Obtener notas por venta original
    static async getNotesBySale(req, res) {
        try {
            const { saleId } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(saleId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID de venta inválido"
                });
            }
            const notes = await Note_1.Note.find({
                originalSaleId: saleId,
                isActive: true
            })
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
            res.json({
                success: true,
                data: notes.map(note => NoteController.formatNoteResponse(note))
            });
        }
        catch (error) {
            console.error("Error getting notes by sale:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener las notas de la venta",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    // Enviar nota a AFIP para obtener CAE
    static async sendToAfip(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID de nota inválido"
                });
            }
            // Obtener la nota
            const note = await Note_1.Note.findOne({ _id: id, isActive: true });
            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: "Nota no encontrada"
                });
            }
            // Verificar que no esté ya enviada
            if (note.status === 'COMPLETED' && note.cae) {
                return res.status(400).json({
                    success: false,
                    message: "Esta nota ya tiene CAE asignado"
                });
            }
            // Verificar que tenga los datos necesarios
            if (!note.originalAfipData || !note.originalAfipData.cbteTipo) {
                return res.status(400).json({
                    success: false,
                    message: "La nota no tiene datos AFIP de la factura original"
                });
            }
            // Cambiar estado a SENT_TO_AFIP
            note.status = 'SENT_TO_AFIP';
            await note.save();
            // Preparar datos para AFIP
            const afipData = {
                puntoVenta: note.originalAfipData.ptoVta,
                concepto: 1, // Productos
                documentoTipo: note.clientCuit ? 80 : 99, // 80=CUIT, 99=Sin identificar
                documentoNumero: note.clientCuit?.replace(/[-\s]/g, '') || "0",
                importeTotal: note.totalAmount,
                importeNeto: note.subtotal,
                importeIva: note.ivaAmount,
                fechaEmision: new Date().toISOString().split('T')[0],
                // Datos de la factura original (comprobante asociado)
                originalCbteTipo: note.originalAfipData.cbteTipo,
                originalPtoVta: note.originalAfipData.ptoVta,
                originalCbteNro: note.originalAfipData.cbteNro,
                originalCbteFch: note.originalAfipData.cbteFch
            };
            console.log("[NOTE CONTROLLER] Enviando nota a AFIP:", {
                noteId: note._id,
                noteType: note.noteType,
                afipData
            });
            // Importar el servicio AFIP
            const afipService = require('../services/afipService').default;
            let afipResult;
            // Enviar según el tipo de nota
            if (note.noteType === 'CREDITO') {
                afipResult = await afipService.authorizeCreditNote(afipData);
            }
            else {
                afipResult = await afipService.authorizeDebitNote(afipData);
            }
            console.log("[NOTE CONTROLLER] Respuesta de AFIP:", afipResult);
            // Actualizar nota con datos de AFIP
            const noteTipo = afipService.getInstance().determineNoteType(note.originalAfipData.cbteTipo, note.noteType === 'CREDITO');
            note.cbteTipo = noteTipo;
            note.ptoVta = afipData.puntoVenta;
            note.cbteDesde = afipResult.numero;
            note.cbteHasta = afipResult.numero;
            note.cbteFch = afipData.fechaEmision;
            note.cae = afipResult.cae;
            note.caeFchVto = afipResult.vencimiento;
            note.resultado = afipResult.resultado;
            note.observaciones = afipResult.observaciones;
            note.status = 'COMPLETED';
            // Generar número de nota único (manejar duplicados)
            let noteNumber = `${afipData.puntoVenta.toString().padStart(4, '0')}-${afipResult.numero.toString().padStart(8, '0')}`;
            let counter = afipResult.numero;
            let isUnique = false;
            while (!isUnique) {
                const existingNote = await Note_1.Note.findOne({ noteNumber, _id: { $ne: note._id } });
                if (!existingNote) {
                    isUnique = true;
                }
                else {
                    counter++;
                    noteNumber = `${afipData.puntoVenta.toString().padStart(4, '0')}-${counter.toString().padStart(8, '0')}`;
                    console.log(`[NOTE] Número duplicado, intentando con: ${noteNumber}`);
                }
            }
            note.noteNumber = noteNumber;
            const updatedNote = await note.save();
            // Populate para respuesta
            const populatedNote = await Note_1.Note.findById(updatedNote._id)
                .populate('clientId', 'name email cuit address')
                .populate('originalSaleId', 'saleNumber totalAmount')
                .populate('createdBy', 'name email');
            res.json({
                success: true,
                message: "Nota enviada a AFIP exitosamente",
                data: NoteController.formatNoteResponse(populatedNote)
            });
        }
        catch (error) {
            console.error("Error sending note to AFIP:", error);
            // Actualizar estado a ERROR si falla
            try {
                const { id } = req.params;
                await Note_1.Note.findByIdAndUpdate(id, {
                    status: 'ERROR',
                    observaciones: error instanceof Error ? error.message : "Error desconocido"
                });
            }
            catch (updateError) {
                console.error("Error updating note status:", updateError);
            }
            res.status(500).json({
                success: false,
                message: "Error al enviar la nota a AFIP",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    // Métodos auxiliares
    static validateNoteData(data) {
        if (!data.noteType || !Object.values(Note_1.NoteType).includes(data.noteType)) {
            return { isValid: false, message: "Tipo de nota inválido" };
        }
        if (!data.originalSaleId) {
            return { isValid: false, message: "ID de venta original requerido" };
        }
        if (!data.reason) {
            return { isValid: false, message: "Motivo requerido" };
        }
        if (!data.description || data.description.length > NoteTypes_1.NOTE_VALIDATION.MAX_DESCRIPTION_LENGTH) {
            return { isValid: false, message: `Descripción requerida (máximo ${NoteTypes_1.NOTE_VALIDATION.MAX_DESCRIPTION_LENGTH} caracteres)` };
        }
        if (!data.items || data.items.length === 0) {
            return { isValid: false, message: "Al menos un item es requerido" };
        }
        if (data.items.length > NoteTypes_1.NOTE_VALIDATION.MAX_ITEMS_PER_NOTE) {
            return { isValid: false, message: `Máximo ${NoteTypes_1.NOTE_VALIDATION.MAX_ITEMS_PER_NOTE} items por nota` };
        }
        // Validar items
        for (const item of data.items) {
            if (!item.productName) {
                return { isValid: false, message: "Nombre de producto requerido en todos los items" };
            }
            if (item.quantity < NoteTypes_1.NOTE_VALIDATION.MIN_ITEM_QUANTITY) {
                return { isValid: false, message: `Cantidad mínima: ${NoteTypes_1.NOTE_VALIDATION.MIN_ITEM_QUANTITY}` };
            }
            if (item.unitPrice < NoteTypes_1.NOTE_VALIDATION.MIN_AMOUNT) {
                return { isValid: false, message: "Precio unitario debe ser mayor a 0" };
            }
        }
        return { isValid: true };
    }
    static calculateAmounts(items) {
        // El precio unitario YA incluye IVA, entonces lo desglosamos
        const totalWithIva = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        // Desglosamos: Total = Neto + IVA, donde IVA = Neto * 0.21
        // Total = Neto * 1.21, entonces Neto = Total / 1.21
        const subtotal = totalWithIva / 1.21; // Neto sin IVA
        const ivaAmount = totalWithIva - subtotal; // IVA desglosado
        const totalAmount = totalWithIva; // Total ya viene con IVA incluido
        return {
            subtotal: Math.round(subtotal * 100) / 100, // Redondear a 2 decimales
            ivaAmount: Math.round(ivaAmount * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100
        };
    }
    static formatNoteResponse(note) {
        return {
            id: note._id.toString(),
            noteType: note.noteType,
            noteNumber: note.noteNumber,
            originalSaleId: note.originalSaleId.toString(),
            originalInvoiceNumber: note.originalInvoiceNumber,
            originalAfipData: note.originalAfipData,
            clientId: note.clientId.toString(),
            clientName: note.clientName,
            clientEmail: note.clientEmail,
            clientCuit: note.clientCuit,
            clientAddress: note.clientAddress,
            reason: note.reason,
            customReason: note.customReason,
            description: note.description,
            items: note.items.map(item => ({
                productId: item.productId?.toString(),
                productName: item.productName,
                productCode: item.productCode,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                description: item.description
            })),
            subtotal: note.subtotal,
            ivaAmount: note.ivaAmount,
            totalAmount: note.totalAmount,
            paymentMethod: note.paymentMethod,
            cbteTipo: note.cbteTipo,
            ptoVta: note.ptoVta,
            cbteDesde: note.cbteDesde,
            cbteHasta: note.cbteHasta,
            cbteFch: note.cbteFch,
            cae: note.cae,
            caeFchVto: note.caeFchVto,
            resultado: note.resultado,
            observaciones: note.observaciones,
            createdBy: note.createdBy.toString(),
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
            isActive: note.isActive,
            status: note.status
        };
    }
}
exports.NoteController = NoteController;
