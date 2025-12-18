import { Router } from "express";
import { ClientController } from "../controllers/client.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// ✅ Rutas básicas CRUD
router.get("/", verifyToken, ClientController.getAllClients);
router.get("/:id", verifyToken, ClientController.getClientById);
router.post("/", verifyToken, ClientController.createClient);
router.put("/:id", verifyToken, ClientController.updateClient);
router.delete("/:id", verifyToken, ClientController.deleteClient);

// ✅ Rutas de búsqueda y filtros
router.get("/search/name", verifyToken, ClientController.searchClientsByName);
router.get("/filter/active", verifyToken, ClientController.getActiveClients);
router.get("/filter/type/:type", verifyToken, ClientController.getClientsByType);
router.get("/filter/tax-condition/:condition", verifyToken, ClientController.getClientsByTaxCondition);
router.get("/cuit/:cuit", verifyToken, ClientController.getClientsByCuit);

// ✅ Rutas adicionales
router.patch("/:id/toggle", verifyToken, ClientController.toggleClientStatus);
router.get("/stats/overview", verifyToken, ClientController.getClientsStats);

export default router;
