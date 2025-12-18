import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// ✅ Rutas públicas
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/verify-token", AuthController.verifyToken);

// ✅ Rutas protegidas
router.post("/refresh-token", verifyToken, AuthController.refreshToken);
router.post("/change-password", verifyToken, AuthController.changePassword);
router.post("/logout", verifyToken, AuthController.logout);

export default router;