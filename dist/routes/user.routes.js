"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const router = (0, express_1.Router)();
// ✅ Rutas de perfil propio (cualquier usuario autenticado)
router.get("/profile/me", verifyToken_1.verifyToken, user_controller_1.UserController.getMyProfile);
router.put("/profile/me", verifyToken_1.verifyToken, user_controller_1.UserController.updateMyProfile);
// ✅ Rutas básicas CRUD (solo admin)
router.get("/", verifyToken_1.verifyToken, verifyToken_1.isAdmin, user_controller_1.UserController.getAllUsers);
router.get("/:id", verifyToken_1.verifyToken, verifyToken_1.isAdmin, user_controller_1.UserController.getUserById);
router.post("/", verifyToken_1.verifyToken, verifyToken_1.isAdmin, user_controller_1.UserController.createUser);
router.put("/:id", verifyToken_1.verifyToken, verifyToken_1.isAdmin, user_controller_1.UserController.updateUser);
router.delete("/:id", verifyToken_1.verifyToken, verifyToken_1.isAdmin, user_controller_1.UserController.deleteUser);
exports.default = router;
