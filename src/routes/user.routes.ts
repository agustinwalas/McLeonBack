import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { isAdmin, verifyToken } from "../middleware/verifyToken";


const router = Router();

// ✅ Rutas de perfil propio (cualquier usuario autenticado)
router.get("/profile/me", verifyToken, UserController.getMyProfile);
router.put("/profile/me", verifyToken, UserController.updateMyProfile);

// ✅ Rutas básicas CRUD (solo admin)
router.get("/", verifyToken, isAdmin, UserController.getAllUsers);
router.get("/:id", verifyToken, isAdmin, UserController.getUserById);
router.post("/", verifyToken, isAdmin, UserController.createUser);
router.put("/:id", verifyToken, isAdmin, UserController.updateUser);
router.delete("/:id", verifyToken, isAdmin, UserController.deleteUser);

export default router;
