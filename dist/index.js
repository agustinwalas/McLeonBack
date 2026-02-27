"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Cargar variables de entorno PRIMERO
const dotenv_1 = __importDefault(require("dotenv"));
if (process.env.NODE_ENV !== "production") {
    dotenv_1.default.config(); // Solo en local
}
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
// Rutas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const supplierInvoice_routes_1 = __importDefault(require("./routes/supplierInvoice.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const sale_routes_1 = __importDefault(require("./routes/sale.routes"));
const marginConfig_routes_1 = __importDefault(require("./routes/marginConfig.routes"));
const afip_routes_1 = __importDefault(require("./routes/afip.routes"));
const note_routes_1 = __importDefault(require("./routes/note.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const dailyProfit_routes_1 = __importDefault(require("./routes/dailyProfit.routes"));
const dailyProfitCron_1 = require("./services/dailyProfitCron");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Configuración de Socket.io con CORS
const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    'http://localhost:5173'
].filter((origin) => typeof origin === 'string');
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
// Middlewares - CORS
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
}));
app.use(express_1.default.json());
// Ruta básica para verificar que la API está viva
app.get("/", (req, res) => {
    res.send("API del restaurante funcionando 🍣");
});
// Healthcheck endpoint para Railway
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
// Rutas principales
app.use("/api", auth_routes_1.default);
app.use("/api/user", user_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/clients", client_routes_1.default);
app.use("/api/suppliers", supplier_routes_1.default);
app.use("/api/supplier-invoices", supplierInvoice_routes_1.default);
app.use("/api/sales", sale_routes_1.default);
app.use("/api/marginConfig", marginConfig_routes_1.default);
app.use("/api/afip", afip_routes_1.default);
app.use("/api/notes", note_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/daily-profits", dailyProfit_routes_1.default);
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
mongoose_1.default
    .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    family: 4,
})
    .then(() => {
    console.log('✅ Conectado a MongoDB');
    // Inicializar cron de ganancias diarias después de conectar a MongoDB
    (0, dailyProfitCron_1.initDailyProfitCron)();
})
    .catch((err) => {
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
