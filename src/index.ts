// Cargar variables de entorno PRIMERO
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config(); // Solo en local
}

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import http from "http";

// Rutas
import authRoutes from "./routes/auth.routes";
import clientRoutes from "./routes/client.routes";
import supplierRoutes from "./routes/supplier.routes";
import supplierInvoiceRoutes from "./routes/supplierInvoice.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import userRouter from "./routes/user.routes";
import saleRoutes from "./routes/sale.routes";
import marginConfigRoutes from "./routes/marginConfig.routes";
import afipRoutes from "./routes/afip.routes";
import noteRoutes from "./routes/note.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io con CORS
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173'
].filter((origin): origin is string => typeof origin === 'string');

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Middlewares - CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  })
);
app.use(express.json());

// Ruta básica para verificar que la API está viva
app.get("/", (req, res) => {
  res.send("API del restaurante funcionando 🍣");
});

// Rutas principales
app.use("/api", authRoutes);
app.use("/api/user", userRouter);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/supplier-invoices", supplierInvoiceRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/marginConfig", marginConfigRoutes);
app.use("/api/afip", afipRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ==============================
//  CONEXIÓN A MONGODB
// ==============================
const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  console.error('❌ ERROR: MONGO_URI no está definida en las variables de entorno');
  process.exit(1);
}

// Conexión a MongoDB
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    family: 4,
  } as any)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
  })
  .catch((err: any) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

// ==============================
//  ARRANQUE DEL SERVER
// ==============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

