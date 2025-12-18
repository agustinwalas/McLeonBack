"use strict";
// src/types/SaleTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryType = exports.PriceType = exports.PaymentMethod = void 0;
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "EFECTIVO";
    PaymentMethod["CREDIT_CARD"] = "TARJETA_CREDITO";
    PaymentMethod["DEBIT_CARD"] = "TARJETA_DEBITO";
    PaymentMethod["BANK_TRANSFER"] = "TRANSFERENCIA";
    PaymentMethod["CHECK"] = "CHEQUE";
    PaymentMethod["MERCADO_PAGO"] = "MERCADO_PAGO";
    PaymentMethod["MULTIPLE"] = "MULTIPLE";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PriceType;
(function (PriceType) {
    PriceType["WHOLESALE"] = "MAYORISTA";
    PriceType["RETAIL"] = "MINORISTA";
})(PriceType || (exports.PriceType = PriceType = {}));
var DeliveryType;
(function (DeliveryType) {
    DeliveryType["PICKUP"] = "RETIRO_LOCAL";
    DeliveryType["DELIVERY"] = "ENVIO";
})(DeliveryType || (exports.DeliveryType = DeliveryType = {}));
