"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesPoints = exports.generateAfipVoucher = exports.getAfipVoucherInfo = exports.getAfipStatus = exports.generateAfipInvoice = exports.testConnection = void 0;
const afipService_1 = __importDefault(require("../services/afipService"));
const Sale_1 = __importDefault(require("../models/Sale"));
const testConnection = async (req, res) => {
    try {
        const authResult = await afipService_1.default.testConnection?.();
        if (authResult?.success) {
            res.json({
                success: true,
                message: "Conexión y autenticación con AFIP exitosa",
                details: authResult,
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: "No se pudo autenticar con AFIP",
                details: authResult,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al conectar con AFIP",
            error: error.message,
        });
    }
};
exports.testConnection = testConnection;
const generateAfipInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id.length !== 24) {
            res.status(400).json({ message: "ID de venta inválido" });
            return;
        }
        const sale = await Sale_1.default.findById(id).populate("client");
        if (!sale) {
            res.status(404).json({ message: "Venta no encontrada" });
            return;
        }
        if (!sale.client) {
            res.status(400).json({ message: "Venta sin cliente asociado" });
            return;
        }
        if (sale.afipData?.cae) {
            res.status(400).json({ message: "El comprobante ya fue generado" });
            return;
        }
        const client = sale.client;
        const tipoComprobante = afipService_1.default.determineInvoiceType(client.cuit || "");
        const importeNeto = sale.subtotal || 0;
        const importeIva = afipService_1.default.calculateTax(importeNeto, tipoComprobante);
        const importeTotal = sale.totalAmount || 0;
        if (importeTotal <= 0) {
            res.status(400).json({ message: "El importe total debe ser mayor a 0" });
            return;
        }
        const afipRequest = {
            puntoVenta: 1,
            tipoComprobante,
            numeroComprobante: 0,
            fechaEmision: new Date().toISOString().split("T")[0],
            importeTotal,
            importeNeto,
            importeIva,
            concepto: 1,
            documentoTipo: client.cuit ? 80 : 96,
            documentoNumero: client.cuit || client.dni || "0",
            cuit: client.cuit || "",
        };
        if (!afipRequest.documentoNumero || afipRequest.documentoNumero === "0") {
            res.status(400).json({
                message: "El cliente debe tener CUIT o DNI para generar el comprobante",
            });
            return;
        }
        const afipResponse = await afipService_1.default.authorizeInvoice(afipRequest);
        // LOGS DETALLADOS PARA DEBUG
        console.log("=== DEBUG AFIP RESPONSE ===");
        console.log("afipRequest enviado:", JSON.stringify(afipRequest, null, 2));
        console.log("afipResponse recibido:", JSON.stringify(afipResponse, null, 2));
        console.log("afipResponse.numero:", afipResponse?.numero);
        console.log("afipResponse.cae:", afipResponse?.cae);
        console.log("tipoComprobante:", tipoComprobante);
        console.log("=== FIN DEBUG ===");
        if (!afipResponse || !afipResponse.cae) {
            res.status(400).json({
                message: "Error en la respuesta de AFIP",
                observaciones: afipResponse?.observaciones || "Sin observaciones",
            });
            return;
        }
        sale.afipData = {
            cuit: process.env.AFIP_CUIT || "",
            puntoVenta: afipRequest.puntoVenta,
            tipoComprobante,
            numeroComprobante: afipResponse.numero,
            cae: afipResponse.cae,
            vencimientoCae: afipResponse.vencimiento,
            fechaEmision: afipRequest.fechaEmision,
            concepto: afipRequest.concepto,
            documentoTipo: afipRequest.documentoTipo,
            documentoNumero: afipRequest.documentoNumero,
            importeTotal,
            importeNeto,
            importeIva,
            estado: afipResponse.cae ? "AUTORIZADA" : "RECHAZADA",
            observaciones: afipResponse.observaciones,
        };
        console.log("=== DEBUG GUARDADO ===");
        console.log("Datos que se van a guardar:", JSON.stringify(sale.afipData, null, 2));
        await sale.save();
        console.log("Datos guardados en DB:", JSON.stringify(sale.afipData, null, 2));
        console.log("=== FIN DEBUG GUARDADO ===");
        res.json({
            success: true,
            afipData: sale.afipData,
            message: "Comprobante generado correctamente",
        });
    }
    catch (error) {
        console.error("Error generando comprobante AFIP:", error);
        const errorMessage = error?.message || "Error desconocido";
        const statusCode = error?.status || 500;
        res.status(statusCode).json({
            success: false,
            message: "Error generando comprobante AFIP",
            error: errorMessage,
            ...(process.env.NODE_ENV === "development" && { stack: error?.stack }),
        });
    }
};
exports.generateAfipInvoice = generateAfipInvoice;
const getAfipStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id.length !== 24) {
            res.status(400).json({ message: "ID de venta inválido" });
            return;
        }
        const sale = await Sale_1.default.findById(id);
        if (!sale) {
            res.status(404).json({ message: "Venta no encontrada" });
            return;
        }
        res.json({
            success: true,
            afipData: sale.afipData || null,
            hasAfipData: !!sale.afipData?.cae,
        });
    }
    catch (error) {
        console.error("Error consultando estado AFIP:", error);
        res.status(500).json({
            success: false,
            message: "Error consultando estado AFIP",
            error: error.message,
        });
    }
};
exports.getAfipStatus = getAfipStatus;
// Consultar información completa de factura en AFIP
const getAfipVoucherInfo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id.length !== 24) {
            res.status(400).json({ message: "ID de venta inválido" });
            return;
        }
        const sale = await Sale_1.default.findById(id);
        if (!sale) {
            res.status(404).json({ message: "Venta no encontrada" });
            return;
        }
        if (!sale.afipData?.cae) {
            res.status(404).json({ message: "Esta venta no tiene comprobante AFIP" });
            return;
        }
        // Verificar si tenemos los datos mínimos para consultar en AFIP
        // Usar los nombres correctos de los campos guardados
        const ptoVta = sale.afipData.puntoVenta || sale.afipData.ptoVta || 1;
        const cbteNro = sale.afipData.numeroComprobante || sale.afipData.cbteNro;
        const cbteTipo = sale.afipData.tipoComprobante || sale.afipData.cbteTipo;
        console.log("[AFIP] Todos los datos guardados en afipData:", sale.afipData);
        console.log("[AFIP] Datos extraídos:", {
            ptoVta,
            cbteNro,
            cbteTipo,
            cae: sale.afipData.cae
        });
        let afipInfo = null;
        let consultaAfipExitosa = false;
        // Solo consultar en AFIP si tenemos todos los datos necesarios
        if (cbteNro && cbteTipo && cbteTipo >= 1 && cbteTipo <= 9998) {
            try {
                console.log("[AFIP] Consultando información completa en AFIP...");
                afipInfo = await afipService_1.default.getVoucherInfo({
                    PtoVta: ptoVta,
                    CbteTipo: cbteTipo,
                    CbteNro: cbteNro
                });
                consultaAfipExitosa = true;
                console.log("[AFIP] Consulta exitosa");
            }
            catch (error) {
                console.warn("[AFIP] No se pudo consultar información completa:", error.message);
                afipInfo = { error: `No se pudo consultar en AFIP: ${error.message}` };
            }
        }
        else {
            console.log("[AFIP] Datos insuficientes para consultar en AFIP");
            afipInfo = {
                error: "Datos insuficientes para consultar en AFIP",
                faltantes: {
                    cbteNro: !cbteNro ? "requerido" : "ok",
                    cbteTipo: (!cbteTipo || cbteTipo < 1 || cbteTipo > 9998) ? "requerido (1-9998)" : "ok"
                }
            };
        }
        res.json({
            success: true,
            afipData: sale.afipData,
            afipInfo: afipInfo,
            consultaAfipExitosa: consultaAfipExitosa,
            hasAfipData: true,
            // Debug info
            debug: {
                todosLosDatosGuardados: sale.afipData,
                datosExtraidos: { ptoVta, cbteNro, cbteTipo },
                propiedadesDisponibles: Object.keys(sale.afipData || {})
            }
        });
    }
    catch (error) {
        console.error("Error consultando información AFIP:", error);
        res.status(500).json({
            success: false,
            message: "Error consultando información AFIP",
            error: error.message,
        });
    }
};
exports.getAfipVoucherInfo = getAfipVoucherInfo;
// Generar comprobante AFIP con payload personalizado
const generateAfipVoucher = async (req, res) => {
    try {
        const payload = req.body;
        // Validar que el payload tenga los campos requeridos
        const requiredFields = [
            'CbteTipo', 'PtoVta', 'Concepto', 'DocTipo', 'DocNro',
            'CbteFch', 'ImpTotal', 'ImpNeto', 'ImpIVA'
        ];
        for (const field of requiredFields) {
            if (payload[field] === undefined || payload[field] === null) {
                res.status(400).json({
                    success: false,
                    message: `Campo requerido faltante: ${field}`,
                });
                return;
            }
        }
        // Convertir payload a formato AfipInvoiceRequest
        const afipRequest = {
            puntoVenta: payload.PtoVta,
            tipoComprobante: payload.CbteTipo,
            numeroComprobante: 0, // Se calcula automáticamente
            fechaEmision: formatDateForAfip(payload.CbteFch),
            importeTotal: payload.ImpTotal,
            importeNeto: payload.ImpNeto,
            importeIva: payload.ImpIVA,
            concepto: payload.Concepto,
            documentoTipo: payload.DocTipo,
            documentoNumero: payload.DocNro.toString(),
            cuit: payload.EmisorCUIT?.toString() || process.env.AFIP_CUIT || "",
        };
        // Generar factura
        const afipResponse = await afipService_1.default.authorizeInvoice(afipRequest);
        // LOGS DETALLADOS PARA DEBUG (Voucher)
        console.log("=== DEBUG AFIP VOUCHER ===");
        console.log("afipRequest enviado:", JSON.stringify(afipRequest, null, 2));
        console.log("afipResponse recibido:", JSON.stringify(afipResponse, null, 2));
        console.log("afipResponse.numero:", afipResponse?.numero);
        console.log("afipResponse.cae:", afipResponse?.cae);
        console.log("=== FIN DEBUG VOUCHER ===");
        if (!afipResponse || !afipResponse.cae) {
            res.status(400).json({
                success: false,
                message: "Error en la respuesta de AFIP",
                observaciones: afipResponse?.observaciones || "Sin observaciones",
            });
            return;
        }
        // Actualizar la venta en la DB si existe VentaId
        let ventaActualizada = false;
        if (payload.VentaId) {
            try {
                const sale = await Sale_1.default.findById(payload.VentaId);
                if (sale) {
                    const datosAfip = {
                        cuit: process.env.AFIP_CUIT || "",
                        puntoVenta: afipRequest.puntoVenta,
                        tipoComprobante: afipRequest.tipoComprobante,
                        numeroComprobante: afipResponse.numero,
                        cae: afipResponse.cae,
                        vencimientoCae: afipResponse.vencimiento,
                        fechaEmision: afipRequest.fechaEmision,
                        concepto: afipRequest.concepto,
                        documentoTipo: afipRequest.documentoTipo,
                        documentoNumero: afipRequest.documentoNumero,
                        importeTotal: afipRequest.importeTotal,
                        importeNeto: afipRequest.importeNeto,
                        importeIva: afipRequest.importeIva,
                        estado: afipResponse.cae ? "AUTORIZADA" : "RECHAZADA",
                        observaciones: afipResponse.observaciones,
                    };
                    console.log("=== DEBUG GUARDADO VOUCHER ===");
                    console.log("Datos que se van a guardar:", JSON.stringify(datosAfip, null, 2));
                    sale.afipData = datosAfip;
                    await sale.save();
                    console.log("Venta actualizada correctamente. ID:", payload.VentaId);
                    console.log("Datos guardados en DB:", JSON.stringify(sale.afipData, null, 2));
                    console.log("=== FIN DEBUG GUARDADO VOUCHER ===");
                    ventaActualizada = true;
                }
                else {
                    console.warn("No se encontró la venta con ID:", payload.VentaId);
                }
            }
            catch (dbError) {
                console.error("Error actualizando la venta en DB:", dbError);
                // No fallar la respuesta por esto
            }
        }
        else {
            console.log("⚠️  No se proporcionó VentaId - el comprobante no se guardará en ninguna venta");
        }
        res.json({
            success: true,
            CAE: afipResponse.cae,
            CAEFchVto: afipResponse.vencimiento,
            CbteDesde: afipResponse.numero,
            CbteHasta: afipResponse.numero,
            Resultado: afipResponse.resultado,
            Observaciones: afipResponse.observaciones,
            message: "Comprobante generado correctamente",
            // Info adicional sobre guardado
            ventaActualizada: ventaActualizada,
            ventaId: payload.VentaId || null,
        });
    }
    catch (error) {
        console.error("Error generando comprobante AFIP con payload:", error);
        const errorMessage = error?.message || "Error desconocido";
        const statusCode = error?.status || 500;
        res.status(statusCode).json({
            success: false,
            message: "Error generando comprobante AFIP",
            error: errorMessage,
            ...(process.env.NODE_ENV === "development" && { stack: error?.stack }),
        });
    }
};
exports.generateAfipVoucher = generateAfipVoucher;
// Consultar puntos de venta autorizados
const getSalesPoints = async (req, res) => {
    try {
        const salesPoints = await afipService_1.default.getSalesPoints();
        res.json({
            success: true,
            message: "Puntos de venta obtenidos correctamente",
            data: salesPoints,
        });
    }
    catch (error) {
        console.error("Error obteniendo puntos de venta:", error);
        res.status(500).json({
            success: false,
            message: "Error obteniendo puntos de venta",
            error: error.message,
        });
    }
};
exports.getSalesPoints = getSalesPoints;
// Helper para formatear fecha
function formatDateForAfip(fechaAfip) {
    // Si viene en formato YYYYMMDD, convertir a YYYY-MM-DD
    if (fechaAfip.length === 8 && /^\d{8}$/.test(fechaAfip)) {
        return `${fechaAfip.substring(0, 4)}-${fechaAfip.substring(4, 6)}-${fechaAfip.substring(6, 8)}`;
    }
    return fechaAfip;
}
