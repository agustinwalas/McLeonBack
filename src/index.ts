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
import dailyProfitRoutes from "./routes/dailyProfit.routes";
import { initDailyProfitCron } from "./services/dailyProfitCron";

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io con CORS
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'https://distribuidora-mcleon.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
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

// Healthcheck endpoint para Railway
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
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
app.use("/api/daily-profits", dailyProfitRoutes);

// ==============================
//  CONEXIÓN A MONGODB
// ==============================
console.log('🔍 Verificando variables de entorno:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI existe?:', !!process.env.MONGO_URI);
console.log('MONGO_URI (primeros 50 chars):', process.env.MONGO_URI?.substring(0, 50));
console.log('JWT_SECRET existe?:', !!process.env.JWT_SECRET);
console.log('CLIENT_ORIGIN:', process.env.CLIENT_ORIGIN);

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  console.error('❌ ERROR: MONGO_URI no está definida en las variables de entorno');
  console.error('Variables disponibles:', Object.keys(process.env).sort().join(', '));
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
    // Inicializar cron de ganancias diarias después de conectar a MongoDB
    initDailyProfitCron();
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

