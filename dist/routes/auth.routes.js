"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const router = (0, express_1.Router)();
// ✅ Rutas públicas
router.post("/register", auth_controller_1.AuthController.register);
router.post("/login", auth_controller_1.AuthController.login);
router.post("/verify-token", auth_controller_1.AuthController.verifyToken);
// ✅ Rutas protegidas
router.post("/refresh-token", verifyToken_1.verifyToken, auth_controller_1.AuthController.refreshToken);
router.post("/change-password", verifyToken_1.verifyToken, auth_controller_1.AuthController.changePassword);
router.post("/logout", verifyToken_1.verifyToken, auth_controller_1.AuthController.logout);
exports.default = router;
