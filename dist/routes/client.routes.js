"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const router = (0, express_1.Router)();
// ✅ Rutas básicas CRUD
router.get("/", verifyToken_1.verifyToken, client_controller_1.ClientController.getAllClients);
router.get("/:id", verifyToken_1.verifyToken, client_controller_1.ClientController.getClientById);
router.post("/", verifyToken_1.verifyToken, client_controller_1.ClientController.createClient);
router.put("/:id", verifyToken_1.verifyToken, client_controller_1.ClientController.updateClient);
router.delete("/:id", verifyToken_1.verifyToken, client_controller_1.ClientController.deleteClient);
// ✅ Rutas de búsqueda y filtros
router.get("/search/name", verifyToken_1.verifyToken, client_controller_1.ClientController.searchClientsByName);
router.get("/filter/active", verifyToken_1.verifyToken, client_controller_1.ClientController.getActiveClients);
router.get("/filter/type/:type", verifyToken_1.verifyToken, client_controller_1.ClientController.getClientsByType);
router.get("/filter/tax-condition/:condition", verifyToken_1.verifyToken, client_controller_1.ClientController.getClientsByTaxCondition);
router.get("/cuit/:cuit", verifyToken_1.verifyToken, client_controller_1.ClientController.getClientsByCuit);
// ✅ Rutas adicionales
router.patch("/:id/toggle", verifyToken_1.verifyToken, client_controller_1.ClientController.toggleClientStatus);
router.get("/stats/overview", verifyToken_1.verifyToken, client_controller_1.ClientController.getClientsStats);
exports.default = router;
