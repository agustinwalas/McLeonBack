"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientType = exports.AfipCondicionIva = exports.DocumentType = exports.TaxCondition = void 0;
// ===============================
// AFIP: Enums y catálogos
// ===============================
var TaxCondition;
(function (TaxCondition) {
    TaxCondition["RESPONSABLE_INSCRIPTO"] = "Responsable Inscripto";
    TaxCondition["MONOTRIBUTO"] = "Monotributo";
    TaxCondition["CONSUMIDOR_FINAL"] = "Consumidor Final";
    TaxCondition["EXENTO"] = "Exento";
    TaxCondition["NO_RESPONSABLE"] = "No Responsable";
    TaxCondition["MONOTRIBUTO_SOCIAL"] = "Monotributo Social";
    TaxCondition["PEQUENO_CONTRIBUYENTE_EVENTUAL"] = "Peque\u00F1o Contribuyente Eventual";
    TaxCondition["PEQUENO_CONTRIBUYENTE_EVENTUAL_SOCIAL"] = "Peque\u00F1o Contribuyente Eventual Social";
    TaxCondition["NO_CATEGORIZADO"] = "No Categorizado";
})(TaxCondition || (exports.TaxCondition = TaxCondition = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["CUIT"] = "CUIT";
    DocumentType["CUIL"] = "CUIL";
    DocumentType["CDI"] = "CDI";
    DocumentType["LE"] = "LE";
    DocumentType["LC"] = "LC";
    DocumentType["DNI"] = "DNI";
    DocumentType["PASSPORT"] = "PASSPORT";
    DocumentType["CONSUMIDOR_FINAL"] = "CONSUMIDOR_FINAL";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var AfipCondicionIva;
(function (AfipCondicionIva) {
    AfipCondicionIva[AfipCondicionIva["RESPONSABLE_INSCRIPTO"] = 1] = "RESPONSABLE_INSCRIPTO";
    AfipCondicionIva[AfipCondicionIva["EXENTO"] = 2] = "EXENTO";
    AfipCondicionIva[AfipCondicionIva["CONSUMIDOR_FINAL"] = 5] = "CONSUMIDOR_FINAL";
    AfipCondicionIva[AfipCondicionIva["RESPONSABLE_NO_INSCRIPTO"] = 6] = "RESPONSABLE_NO_INSCRIPTO";
    AfipCondicionIva[AfipCondicionIva["MONOTRIBUTO"] = 11] = "MONOTRIBUTO";
    AfipCondicionIva[AfipCondicionIva["PEQUENO_CONTRIBUYENTE_EVENTUAL"] = 13] = "PEQUENO_CONTRIBUYENTE_EVENTUAL";
    AfipCondicionIva[AfipCondicionIva["MONOTRIBUTO_SOCIAL"] = 14] = "MONOTRIBUTO_SOCIAL";
    AfipCondicionIva[AfipCondicionIva["PEQUENO_CONTRIBUYENTE_EVENTUAL_SOCIAL"] = 15] = "PEQUENO_CONTRIBUYENTE_EVENTUAL_SOCIAL";
    AfipCondicionIva[AfipCondicionIva["NO_CATEGORIZADO"] = 99] = "NO_CATEGORIZADO";
})(AfipCondicionIva || (exports.AfipCondicionIva = AfipCondicionIva = {}));
var ClientType;
(function (ClientType) {
    ClientType["PERSONA_FISICA"] = "PERSONA_FISICA";
    ClientType["PERSONA_JURIDICA"] = "PERSONA_JURIDICA";
})(ClientType || (exports.ClientType = ClientType = {}));
