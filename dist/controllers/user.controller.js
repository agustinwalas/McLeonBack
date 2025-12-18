"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
class UserController {
    // GET - Obtener todos los usuarios (solo admin)
    static async getAllUsers(req, res) {
        try {
            const users = await User_1.default.find().select("-password").sort({ name: 1 });
            res.json(users);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener usuarios", error });
        }
    }
    // GET - Obtener usuario por ID
    static async getUserById(req, res) {
        try {
            const user = await User_1.default.findById(req.params.id).select("-password");
            if (!user) {
                res.status(404).json({ message: "Usuario no encontrado" });
                return;
            }
            res.json(user);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener usuario", error });
        }
    }
    // POST - Crear nuevo usuario (solo admin)
    static async createUser(req, res) {
        try {
            const { name, email, password, phone, isAdmin } = req.body;
            // Verificar si el email ya existe
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                res.status(400).json({ message: "Email ya registrado" });
                return;
            }
            // Hash de la contraseña
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // Crear nuevo usuario
            const newUser = new User_1.default({
                name,
                email,
                phone,
                isAdmin: isAdmin || false,
                password: hashedPassword
            });
            const savedUser = await newUser.save();
            // Retornar sin password
            const userResponse = await User_1.default.findById(savedUser._id).select("-password");
            res.status(201).json(userResponse);
        }
        catch (error) {
            res.status(400).json({ message: "Error al crear usuario", error });
        }
    }
    // PUT - Actualizar usuario
    static async updateUser(req, res) {
        try {
            const { password, ...updateData } = req.body;
            // Si se envía password, hashearlo
            if (password) {
                updateData.password = await bcryptjs_1.default.hash(password, 10);
            }
            const updatedUser = await User_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
            if (!updatedUser) {
                res.status(404).json({ message: "Usuario no encontrado" });
                return;
            }
            res.json(updatedUser);
        }
        catch (error) {
            res.status(400).json({ message: "Error al actualizar usuario", error });
        }
    }
    // DELETE - Eliminar usuario
    static async deleteUser(req, res) {
        try {
            const deletedUser = await User_1.default.findByIdAndDelete(req.params.id);
            if (!deletedUser) {
                res.status(404).json({ message: "Usuario no encontrado" });
                return;
            }
            res.json({ message: "Usuario eliminado correctamente" });
        }
        catch (error) {
            res.status(500).json({ message: "Error al eliminar usuario", error });
        }
    }
    // GET - Obtener perfil del usuario autenticado
    static async getMyProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: "Usuario no autenticado" });
                return;
            }
            const user = await User_1.default.findById(userId).select("-password");
            if (!user) {
                res.status(404).json({ message: "Usuario no encontrado" });
                return;
            }
            res.json(user);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener perfil", error });
        }
    }
    // PUT - Actualizar perfil propio
    static async updateMyProfile(req, res) {
        try {
            const userId = req.user?.id;
            const { password, isAdmin, ...updateData } = req.body; // No permitir cambio de isAdmin
            if (!userId) {
                res.status(401).json({ message: "Usuario no autenticado" });
                return;
            }
            // Si se envía password, hashearlo
            if (password) {
                updateData.password = await bcryptjs_1.default.hash(password, 10);
            }
            const updatedUser = await User_1.default.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
            if (!updatedUser) {
                res.status(404).json({ message: "Usuario no encontrado" });
                return;
            }
            res.json(updatedUser);
        }
        catch (error) {
            res.status(400).json({ message: "Error al actualizar perfil", error });
        }
    }
}
exports.UserController = UserController;
