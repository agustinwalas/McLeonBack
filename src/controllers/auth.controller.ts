import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

export class AuthController {
  // POST - Registrar usuario
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, isAdmin } = req.body;
      
      // Verificar si el email ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: "Email ya registrado" });
        return;
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Crear nuevo usuario
      const newUser = new User({ 
        name, 
        email, 
        phone, 
        isAdmin, 
        password: hashedPassword 
      });
      
      const savedUser = await newUser.save();

      // Generar token
      const token = jwt.sign(
        { 
          id: savedUser._id, 
          email: savedUser.email, 
          isAdmin: savedUser.isAdmin 
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "365d" }
      );

      res.status(201).json({
        message: "Usuario creado correctamente",
        token,
        user: {
          _id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone,
          isAdmin: savedUser.isAdmin,
        },
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error al registrar usuario", 
        error: (error as Error).message 
      });
    }
  }

  // POST - Iniciar sesión
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Verificar si el usuario existe
      const user = await User.findOne({ email });
      if (!user) {
        res.status(400).json({ message: "Usuario no encontrado" });
        return;
      }

      // Verificar contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: "Contraseña incorrecta" });
        return;
      }

      // Generar token
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          isAdmin: user.isAdmin 
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "365d" }
      );

      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error al iniciar sesión", 
        error: (error as Error).message 
      });
    }
  }

  // POST - Verificar token
  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      
      if (!token) {
        res.status(401).json({ message: "Token no proporcionado" });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        res.status(401).json({ message: "Token inválido" });
        return;
      }

      res.json({
        valid: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error) {
      res.status(401).json({ 
        message: "Token inválido", 
        error: (error as Error).message 
      });
    }
  }

  // POST - Refrescar token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      
      if (!token) {
        res.status(401).json({ message: "Token no proporcionado" });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      const user = await User.findById(decoded.id);
      
      if (!user) {
        res.status(401).json({ message: "Usuario no encontrado" });
        return;
      }

      // Generar nuevo token
      const newToken = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          isAdmin: user.isAdmin 
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "365d" }
      );

      res.json({
        token: newToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error) {
      res.status(401).json({ 
        message: "Error al refrescar token", 
        error: (error as Error).message 
      });
    }
  }

  // POST - Cambiar contraseña
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: "Usuario no autenticado" });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      // Verificar contraseña actual
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ message: "Contraseña actual incorrecta" });
        return;
      }

      // Hash de la nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
      await user.save();

      res.json({ message: "Contraseña cambiada correctamente" });
    } catch (error) {
      res.status(500).json({ 
        message: "Error al cambiar contraseña", 
        error: (error as Error).message 
      });
    }
  }

  // POST - Logout (invalidar token - opcional)
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // En JWT stateless, el logout se maneja en el frontend
      // Pero puedes implementar una blacklist de tokens si es necesario
      res.json({ message: "Logout exitoso" });
    } catch (error) {
      res.status(500).json({ 
        message: "Error al cerrar sesión", 
        error: (error as Error).message 
      });
    }
  }
}