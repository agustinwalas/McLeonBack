// backend/src/services/afipService.ts
import axios from "axios";
import Afip from "@afipsdk/afip.js";
import fs from "fs";

export interface AfipInvoiceRequest {
  puntoVenta: number;
  tipoComprobante: number;
  numeroComprobante: number;
  fechaEmision: string;
  importeTotal: number;
  importeNeto: number;
  importeIva: number;
  concepto: number;
  documentoTipo: number;
  documentoNumero: string;
  cuit: string;
}

export interface AfipResponse {
  cae: string;
  vencimiento: string;
  numero: number;
  resultado: string;
  observaciones?: string;
}

class AfipService {
  private baseUrl: string;
  private certificatePath: string;
  private privateKeyPath: string;
  private cuit: string;
  private mockMode: boolean;
  private afip: any;

  constructor() {
    this.certificatePath = process.env.AFIP_CERT_PATH || "";
    this.privateKeyPath = process.env.AFIP_KEY_PATH || "";
    this.cuit = process.env.AFIP_CUIT || "";
    this.mockMode = process.env.AFIP_MOCK_MODE === "true";

    const env = (process.env.AFIP_ENVIRONMENT || "testing").toLowerCase();
    const isProduction = env === "production";

    if (isProduction) {
      this.baseUrl =
        process.env.AFIP_PRODUCTION_URL ||
        "https://servicios1.afip.gov.ar/wsfev1/service.asmx";
    } else {
      this.baseUrl =
        process.env.AFIP_TESTING_URL ||
        "https://wswhomo.afip.gov.ar/wsfev1/service.asmx";
    }

    // Validar configuración
    const hasFiles = this.certificatePath && this.privateKeyPath;
    const hasEnvContent = process.env.AFIP_CERT_CONTENT && process.env.AFIP_KEY_CONTENT;
    
    if (!this.cuit) {
      throw new Error("AFIP_CUIT es requerido");
    }

    if (!hasFiles && !hasEnvContent) {
      console.error("[AFIP] Configuración incompleta. Se requiere:");
      console.error("Opción 1 - Archivos: AFIP_CERT_PATH y AFIP_KEY_PATH");
      console.error("Opción 2 - Variables: AFIP_CERT_CONTENT y AFIP_KEY_CONTENT");
      throw new Error("Configuración AFIP incompleta. Se requieren certificados.");
    }

    // Verificar archivos solo si se especificaron rutas
    if (hasFiles) {
      if (!fs.existsSync(this.certificatePath)) {
        throw new Error(`Archivo de certificado no encontrado: ${this.certificatePath}`);
      }
      if (!fs.existsSync(this.privateKeyPath)) {
        throw new Error(`Archivo de clave privada no encontrado: ${this.privateKeyPath}`);
      }
    }

    // Leer certificados (desde archivos o variables de entorno)
    let certContent: string;
    let keyContent: string;
    
    try {
      if (process.env.AFIP_CERT_CONTENT && process.env.AFIP_KEY_CONTENT) {
        // Usar contenido desde variables de entorno (para producción)
        console.log("[AFIP] Usando certificados desde variables de entorno");
        certContent = process.env.AFIP_CERT_CONTENT
          .replace(/\\n/g, '\n')   // Convertir \n literal a saltos de línea
          .replace(/\r\n/g, '\n')  // Normalizar saltos de línea
          .trim();
        
        keyContent = process.env.AFIP_KEY_CONTENT
          .replace(/\\n/g, '\n')   // Convertir \n literal a saltos de línea
          .replace(/\r\n/g, '\n')  // Normalizar saltos de línea
          .trim();
      } else {
        // Usar archivos locales (para desarrollo)
        console.log("[AFIP] Usando certificados desde archivos locales");
        certContent = fs.readFileSync(this.certificatePath, "utf8")
          .replace(/\r\n/g, '\n')  // Normalizar saltos de línea
          .trim();                 // Eliminar espacios al inicio y final
        
        keyContent = fs.readFileSync(this.privateKeyPath, "utf8")
          .replace(/\r\n/g, '\n')  // Normalizar saltos de línea
          .trim();                 // Eliminar espacios al inicio y final
      }
        
      // Validar formato del certificado
      if (!certContent.includes('-----BEGIN CERTIFICATE-----') || !certContent.includes('-----END CERTIFICATE-----')) {
        throw new Error("El certificado no tiene el formato PEM correcto. Debe contener '-----BEGIN CERTIFICATE-----' y '-----END CERTIFICATE-----'");
      }
      
      // Validar formato de la clave privada
      if (!keyContent.includes('-----BEGIN PRIVATE KEY-----') || !keyContent.includes('-----END PRIVATE KEY-----')) {
        throw new Error("La clave privada no tiene el formato PEM correcto. Debe contener '-----BEGIN PRIVATE KEY-----' y '-----END PRIVATE KEY-----'");
      }
      
      console.log("[AFIP] Certificado cargado correctamente");
      console.log("[AFIP] Clave privada cargada correctamente");
        
    } catch (fileError: any) {
      console.error("[AFIP] Error leyendo archivos de certificado:", fileError);
      throw new Error(`Error leyendo certificados: ${fileError?.message || 'Error desconocido'}`);
    }

    // Inicializar la instancia de AFIP SDK
    try {
      const config: any = {
        CUIT: this.cuit,
        cert: certContent, // Contenido del certificado limpio
        key: keyContent,   // Contenido de la clave privada limpio
        production: isProduction,
      };

      // Agregar access_token si está disponible (necesario para producción)
      if (process.env.AFIP_ACCESS_TOKEN) {
        config.access_token = process.env.AFIP_ACCESS_TOKEN;
      }
      
      console.log("[AFIP] Configuración:", {
        CUIT: config.CUIT,
        cert: config.cert,
        key: config.key,
        production: config.production
      });
      
      this.afip = new Afip(config);
    } catch (error) {
      console.error("[AFIP] Error inicializando SDK:", error);
      throw error;
    }
  }

  // Probar autenticación real con AFIP usando el SDK oficial
  async testConnection(): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      if (this.mockMode) {
        return {
          success: false,
          error: "Token mock: revisar integración real con AFIP",
        };
      }

      // Usar el SDK para obtener el token de acceso
      const loginTicket = await this.afip.GetServiceTA("wsfe", true);

      if (loginTicket && loginTicket.token) {
        return {
          success: true,
          token: loginTicket.token.substring(0, 50) + "...", // Mostrar solo parte del token
        };
      } else {
        return { success: false, error: "No se obtuvo token válido del SDK" };
      }
    } catch (error: any) {
      console.error("[AFIP] Error en testConnection:", error);
      return { success: false, error: error.message };
    }
  }

  // Obtener token de autenticación usando el SDK oficial
  async getAuthToken(): Promise<string> {
    if (this.mockMode) return "mock_token_123";

    try {
      const loginTicket = await this.afip.GetServiceTA("wsfe", true);

      if (loginTicket && loginTicket.token) {
        return loginTicket.token;
      } else {
        throw new Error("No se obtuvo token válido del SDK");
      }
    } catch (error: any) {
      console.error("[AFIP] Error obteniendo token:", error);
      throw new Error("Error obteniendo token AFIP: " + error.message);
    }
  }

  // Obtener último número de comprobante
  async getLastInvoiceNumber(
    puntoVenta: number,
    tipoComprobante: number
  ): Promise<number> {
    try {
      const token = await this.getAuthToken();

      const response = await axios.post(
        `${this.baseUrl}/FECompUltimoAutorizado`,
        {
          Auth: {
            Token: token,
            Sign: "signature",
            Cuit: this.cuit,
          },
          PtoVta: puntoVenta,
          CbteTipo: tipoComprobante,
        }
      );

      return (response.data as any)?.FECompUltimoAutorizadoResult?.CbteNro || 0;
    } catch (error) {
      console.error("Error obteniendo último número:", error);
      return 0;
    }
  }

  // Autorizar comprobante usando el SDK oficial
  async authorizeInvoice(
    invoiceData: AfipInvoiceRequest
  ): Promise<AfipResponse> {
    try {
      // Usar el SDK para obtener el último número
      const lastInvoiceNumber = await this.afip.ElectronicBilling.getLastVoucher(
        invoiceData.puntoVenta,
        invoiceData.tipoComprobante
      );
      
      const nextNumber = lastInvoiceNumber + 1;

      // Crear la factura usando el SDK
      const invoiceRequest = {
        CantReg: 1,
        PtoVta: invoiceData.puntoVenta,
        CbteTipo: invoiceData.tipoComprobante,
        Concepto: invoiceData.concepto,
        DocTipo: invoiceData.documentoTipo,
        DocNro: parseInt(invoiceData.documentoNumero),
        CbteDesde: nextNumber,
        CbteHasta: nextNumber,
        CbteFch: parseInt(invoiceData.fechaEmision.replace(/-/g, "")),
        ImpTotal: invoiceData.importeTotal,
        ImpTotConc: 0,
        ImpNeto: invoiceData.importeNeto,
        ImpOpEx: 0,
        ImpIVA: invoiceData.importeIva,
        ImpTrib: 0,
        MonId: "PES",
        MonCotiz: 1,
        Iva: [
          {
            Id: 5, // 21%
            BaseImp: invoiceData.importeNeto,
            Importe: invoiceData.importeIva,
          },
        ],
      };

      // Solicitar CAE usando el SDK
      const result = await this.afip.ElectronicBilling.createVoucher(invoiceRequest);

      if (result.Errors && result.Errors.length > 0) {
        throw new Error(`Error AFIP: ${result.Errors[0].Msg}`);
      }

      return {
        cae: result.CAE,
        vencimiento: result.CAEFchVto,
        numero: nextNumber,
        resultado: result.Resultado,
        observaciones: result.Observaciones || "",
      };
    } catch (error: any) {
      console.error("Error autorizando comprobante:", error);
      throw new Error(`Error generando factura AFIP: ${error.message}`);
    }
  }

  // Obtener puntos de venta autorizados
  async getSalesPoints(): Promise<any[]> {
    try {
      const salesPoints = await this.afip.ElectronicBilling.getSalesPoints();
      return salesPoints;
    } catch (error: any) {
      console.error("Error obteniendo puntos de venta:", error);
      throw new Error(`Error obteniendo puntos de venta: ${error.message}`);
    }
  }

  // Obtener información completa de un comprobante desde AFIP
  async getVoucherInfo(params: {
    PtoVta: number;
    CbteTipo: number;
    CbteNro: number;
  }): Promise<any> {
    try {
      console.log("[AFIP] Consultando información de comprobante con parámetros:", {
        PtoVta: params.PtoVta,
        CbteTipo: params.CbteTipo,
        CbteNro: params.CbteNro,
        tipos: {
          PtoVta: typeof params.PtoVta,
          CbteTipo: typeof params.CbteTipo,
          CbteNro: typeof params.CbteNro
        }
      });

      // Validar que los parámetros sean números válidos
      if (!Number.isInteger(params.PtoVta) || params.PtoVta < 1) {
        throw new Error(`PtoVta inválido: ${params.PtoVta}`);
      }
      if (!Number.isInteger(params.CbteTipo) || params.CbteTipo < 1 || params.CbteTipo > 9998) {
        throw new Error(`CbteTipo inválido: ${params.CbteTipo}`);
      }
      if (!Number.isInteger(params.CbteNro) || params.CbteNro < 1) {
        throw new Error(`CbteNro inválido: ${params.CbteNro}`);
      }
      
      const voucherInfo = await this.afip.ElectronicBilling.getVoucherInfo(
        params.PtoVta,
        params.CbteTipo,
        params.CbteNro
      );
      
      console.log("[AFIP] Información de comprobante obtenida:", voucherInfo);
      return voucherInfo;
    } catch (error: any) {
      console.error("[AFIP] Error obteniendo información de comprobante:", error);
      throw new Error(`Error consultando comprobante en AFIP: ${error.message}`);
    }
  }

  // Determinar tipo de comprobante según cliente
  determineInvoiceType(clientCuit: string): number {
    if (!clientCuit || clientCuit.trim() === "") {
      return 11; // Factura C - Consumidor Final
    }

    // Validar formato CUIT básico
    const cuitClean = clientCuit.replace(/[-\s]/g, "");
    if (cuitClean.length === 11 && /^\d+$/.test(cuitClean)) {
      return 6; // Factura B - Responsable Inscripto
    }

    return 11; // Factura C por defecto
  }

  // Calcular IVA según tipo de comprobante
  calculateTax(neto: number, tipoComprobante: number): number {
    switch (tipoComprobante) {
      case 1: // Factura A
      case 6: // Factura B
        return Math.round(neto * 0.21 * 100) / 100; // 21% IVA, redondear a 2 decimales
      case 11: // Factura C
      default:
        return 0; // No discrimina IVA
    }
  }

  // Obtener nombre del tipo de comprobante
  getInvoiceTypeName(tipoComprobante: number): string {
    const tipos: { [key: number]: string } = {
      1: "Factura A",
      6: "Factura B",
      11: "Factura C",
      51: "Factura M",
    };
    return tipos[tipoComprobante] || `Tipo ${tipoComprobante}`;
  }

  // Validar datos antes de enviar a AFIP
  validateInvoiceData(data: AfipInvoiceRequest): string[] {
    const errors: string[] = [];

    if (!data.puntoVenta || data.puntoVenta < 1) {
      errors.push("Punto de venta inválido");
    }

    if (!data.tipoComprobante || ![1, 6, 11].includes(data.tipoComprobante)) {
      errors.push("Tipo de comprobante no válido");
    }

    if (!data.documentoNumero || data.documentoNumero === "0") {
      errors.push("Número de documento requerido");
    }

    if (data.importeTotal <= 0) {
      errors.push("El importe total debe ser mayor a 0");
    }

    if (data.importeNeto < 0) {
      errors.push("El importe neto no puede ser negativo");
    }

    if (data.importeIva < 0) {
      errors.push("El importe IVA no puede ser negativo");
    }

    return errors;
  }

  // Formatear número de comprobante
  formatInvoiceNumber(puntoVenta: number, numeroComprobante: number): string {
    return `${puntoVenta.toString().padStart(4, "0")}-${numeroComprobante.toString().padStart(8, "0")}`;
  }

  // Verificar estado del servicio AFIP (para pruebas de conectividad)
  async checkServiceStatus(): Promise<boolean> {
    try {
      // TODO: Implementar ping real a AFIP
 
      return true; // Mock: siempre disponible
    } catch (error) {
      console.error("Error verificando servicio AFIP:", error);
      return false;
    }
  }

  // ============= MÉTODOS PARA NOTAS DE CRÉDITO Y DÉBITO =============

  /**
   * Determinar tipo de nota según el tipo de factura original
   * @param originalCbteTipo Tipo de comprobante original (1=Factura A, 6=Factura B, etc.)
   * @param isCredit true para Nota de Crédito, false para Nota de Débito
   * @returns Código AFIP del tipo de nota
   */
  determineNoteType(originalCbteTipo: number, isCredit: boolean): number {
    if (isCredit) {
      // Notas de Crédito
      switch (originalCbteTipo) {
        case 1:  return 3;  // Nota de Crédito A
        case 6:  return 8;  // Nota de Crédito B
        case 11: return 13; // Nota de Crédito C
        default: return 8;  // Por defecto Nota de Crédito B
      }
    } else {
      // Notas de Débito
      switch (originalCbteTipo) {
        case 1:  return 2;  // Nota de Débito A
        case 6:  return 7;  // Nota de Débito B
        case 11: return 12; // Nota de Débito C
        default: return 7;  // Por defecto Nota de Débito B
      }
    }
  }

  /**
   * Autorizar Nota de Crédito en AFIP
   */
  async authorizeCreditNote(noteData: {
    puntoVenta: number;
    concepto: number;
    documentoTipo: number;
    documentoNumero: string;
    importeTotal: number;
    importeNeto: number;
    importeIva: number;
    fechaEmision: string;
    // Datos del comprobante asociado (factura original) - REQUERIDO por AFIP
    originalCbteTipo: number;
    originalPtoVta: number;
    originalCbteNro: number;
    originalCbteFch: string;
  }): Promise<AfipResponse> {
    try {
      console.log("[AFIP] Iniciando autorización de Nota de Crédito");
      console.log("[AFIP] Datos recibidos:", noteData);

      // Determinar tipo de nota según factura original
      const noteTipo = this.determineNoteType(noteData.originalCbteTipo, true);
      console.log(`[AFIP] Tipo de nota determinado: ${noteTipo} (Nota de Crédito ${noteTipo === 3 ? 'A' : noteTipo === 8 ? 'B' : 'C'})`);

      // Obtener el último número de nota
      const lastNoteNumber = await this.afip.ElectronicBilling.getLastVoucher(
        noteData.puntoVenta,
        noteTipo
      );
      const nextNumber = lastNoteNumber + 1;
      console.log(`[AFIP] Último número de Nota de Crédito: ${lastNoteNumber}, Próximo: ${nextNumber}`);

      // Construir request para AFIP
      const noteRequest = {
        CantReg: 1,
        PtoVta: noteData.puntoVenta,
        CbteTipo: noteTipo,
        Concepto: noteData.concepto,
        DocTipo: noteData.documentoTipo,
        DocNro: parseInt(noteData.documentoNumero),
        CbteDesde: nextNumber,
        CbteHasta: nextNumber,
        CbteFch: parseInt(noteData.fechaEmision.replace(/-/g, "")),
        ImpTotal: noteData.importeTotal,
        ImpTotConc: 0,
        ImpNeto: noteData.importeNeto,
        ImpOpEx: 0,
        ImpIVA: noteData.importeIva,
        ImpTrib: 0,
        MonId: "PES",
        MonCotiz: 1,
        // Comprobantes Asociados (OBLIGATORIO para notas)
        CbtesAsoc: [
          {
            Tipo: noteData.originalCbteTipo,
            PtoVta: noteData.originalPtoVta,
            Nro: noteData.originalCbteNro,
            Cuit: this.cuit,
            CbteFct: parseInt(noteData.originalCbteFch.replace(/-/g, ""))
          }
        ],
        // IVA (solo si aplica - tipo A o B)
        Iva: noteTipo === 3 || noteTipo === 8 ? [
          {
            Id: 5, // 21%
            BaseImp: noteData.importeNeto,
            Importe: noteData.importeIva,
          },
        ] : undefined,
      };

      console.log("[AFIP] Request para AFIP:", JSON.stringify(noteRequest, null, 2));

      // Solicitar CAE usando el SDK
      const result = await this.afip.ElectronicBilling.createVoucher(noteRequest);
      console.log("[AFIP] Respuesta de AFIP:", result);

      if (result.Errors && result.Errors.length > 0) {
        throw new Error(`Error AFIP: ${result.Errors[0].Msg}`);
      }

      return {
        cae: result.CAE,
        vencimiento: result.CAEFchVto,
        numero: nextNumber,
        resultado: result.Resultado,
        observaciones: result.Observaciones || "",
      };
    } catch (error: any) {
      console.error("[AFIP] Error autorizando Nota de Crédito:", error);
      throw new Error(`Error generando Nota de Crédito AFIP: ${error.message}`);
    }
  }

  /**
   * Autorizar Nota de Débito en AFIP
   */
  async authorizeDebitNote(noteData: {
    puntoVenta: number;
    concepto: number;
    documentoTipo: number;
    documentoNumero: string;
    importeTotal: number;
    importeNeto: number;
    importeIva: number;
    fechaEmision: string;
    // Datos del comprobante asociado (factura original) - REQUERIDO por AFIP
    originalCbteTipo: number;
    originalPtoVta: number;
    originalCbteNro: number;
    originalCbteFch: string;
  }): Promise<AfipResponse> {
    try {
      console.log("[AFIP] Iniciando autorización de Nota de Débito");
      console.log("[AFIP] Datos recibidos:", noteData);

      // Determinar tipo de nota según factura original
      const noteTipo = this.determineNoteType(noteData.originalCbteTipo, false);
      console.log(`[AFIP] Tipo de nota determinado: ${noteTipo} (Nota de Débito ${noteTipo === 2 ? 'A' : noteTipo === 7 ? 'B' : 'C'})`);

      // Obtener el último número de nota
      const lastNoteNumber = await this.afip.ElectronicBilling.getLastVoucher(
        noteData.puntoVenta,
        noteTipo
      );
      const nextNumber = lastNoteNumber + 1;
      console.log(`[AFIP] Último número de Nota de Débito: ${lastNoteNumber}, Próximo: ${nextNumber}`);

      // Construir request para AFIP
      const noteRequest = {
        CantReg: 1,
        PtoVta: noteData.puntoVenta,
        CbteTipo: noteTipo,
        Concepto: noteData.concepto,
        DocTipo: noteData.documentoTipo,
        DocNro: parseInt(noteData.documentoNumero),
        CbteDesde: nextNumber,
        CbteHasta: nextNumber,
        CbteFch: parseInt(noteData.fechaEmision.replace(/-/g, "")),
        ImpTotal: noteData.importeTotal,
        ImpTotConc: 0,
        ImpNeto: noteData.importeNeto,
        ImpOpEx: 0,
        ImpIVA: noteData.importeIva,
        ImpTrib: 0,
        MonId: "PES",
        MonCotiz: 1,
        // Comprobantes Asociados (OBLIGATORIO para notas)
        CbtesAsoc: [
          {
            Tipo: noteData.originalCbteTipo,
            PtoVta: noteData.originalPtoVta,
            Nro: noteData.originalCbteNro,
            Cuit: this.cuit,
            CbteFct: parseInt(noteData.originalCbteFch.replace(/-/g, ""))
          }
        ],
        // IVA (solo si aplica - tipo A o B)
        Iva: noteTipo === 2 || noteTipo === 7 ? [
          {
            Id: 5, // 21%
            BaseImp: noteData.importeNeto,
            Importe: noteData.importeIva,
          },
        ] : undefined,
      };

      console.log("[AFIP] Request para AFIP:", JSON.stringify(noteRequest, null, 2));

      // Solicitar CAE usando el SDK
      const result = await this.afip.ElectronicBilling.createVoucher(noteRequest);
      console.log("[AFIP] Respuesta de AFIP:", result);

      if (result.Errors && result.Errors.length > 0) {
        throw new Error(`Error AFIP: ${result.Errors[0].Msg}`);
      }

      return {
        cae: result.CAE,
        vencimiento: result.CAEFchVto,
        numero: nextNumber,
        resultado: result.Resultado,
        observaciones: result.Observaciones || "",
      };
    } catch (error: any) {
      console.error("[AFIP] Error autorizando Nota de Débito:", error);
      throw new Error(`Error generando Nota de Débito AFIP: ${error.message}`);
    }
  }

  /**
   * Obtener nombre del tipo de nota
   */
  getNoteTypeName(tipoComprobante: number): string {
    const tipos: { [key: number]: string } = {
      2: "Nota de Débito A",
      3: "Nota de Crédito A",
      7: "Nota de Débito B",
      8: "Nota de Crédito B",
      12: "Nota de Débito C",
      13: "Nota de Crédito C",
    };
    return tipos[tipoComprobante] || `Tipo ${tipoComprobante}`;
  }
}

// Instancia lazy para evitar problemas con variables de entorno
let afipServiceInstance: AfipService | null = null;

export default {
  getInstance(): AfipService {
    if (!afipServiceInstance) {
      afipServiceInstance = new AfipService();
    }
    return afipServiceInstance;
  },
  
  // Métodos directos para compatibilidad
  get testConnection() {
    return this.getInstance().testConnection?.bind(this.getInstance());
  },
  
  get authorizeInvoice() {
    return this.getInstance().authorizeInvoice?.bind(this.getInstance());
  },
  
  get determineInvoiceType() {
    return this.getInstance().determineInvoiceType?.bind(this.getInstance());
  },
  
  get calculateTax() {
    return this.getInstance().calculateTax?.bind(this.getInstance());
  },
  
  get getSalesPoints() {
    return this.getInstance().getSalesPoints?.bind(this.getInstance());
  },
  
  get getVoucherInfo() {
    return this.getInstance().getVoucherInfo?.bind(this.getInstance());
  },
  
  get authorizeCreditNote() {
    return this.getInstance().authorizeCreditNote?.bind(this.getInstance());
  },
  
  get authorizeDebitNote() {
    return this.getInstance().authorizeDebitNote?.bind(this.getInstance());
  },
  
  get determineNoteType() {
    return this.getInstance().determineNoteType?.bind(this.getInstance());
  },
  
  get getNoteTypeName() {
    return this.getInstance().getNoteTypeName?.bind(this.getInstance());
  }
};
