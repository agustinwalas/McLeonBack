"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientController = void 0;
const Client_1 = __importDefault(require("../models/Client"));
class ClientController {
    // GET - Obtener todos los clientes
    static async getAllClients(req, res) {
        try {
            const clients = await Client_1.default.find().sort({ name: 1 });
            res.json(clients);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener clientes", error });
        }
    }
    // GET - Obtener cliente por ID
    static async getClientById(req, res) {
        try {
            const client = await Client_1.default.findById(req.params.id);
            if (!client) {
                res.status(404).json({ message: "Cliente no encontrado" });
                return;
            }
            res.json(client);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener cliente", error });
        }
    }
    // POST - Crear nuevo cliente
    static async createClient(req, res) {
        try {
            const newClient = new Client_1.default(req.body);
            const savedClient = await newClient.save();
            res.status(201).json(savedClient);
        }
        catch (error) {
            res.status(400).json({ message: "Error al crear cliente", error });
        }
    }
    // PUT - Actualizar cliente
    static async updateClient(req, res) {
        try {
            const updatedClient = await Client_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedClient) {
                res.status(404).json({ message: "Cliente no encontrado" });
                return;
            }
            res.json(updatedClient);
        }
        catch (error) {
            res.status(400).json({ message: "Error al actualizar cliente", error });
        }
    }
    // DELETE - Eliminar cliente
    static async deleteClient(req, res) {
        try {
            const deletedClient = await Client_1.default.findByIdAndDelete(req.params.id);
            if (!deletedClient) {
                res.status(404).json({ message: "Cliente no encontrado" });
                return;
            }
            res.json({ message: "Cliente eliminado correctamente" });
        }
        catch (error) {
            res.status(500).json({ message: "Error al eliminar cliente", error });
        }
    }
    // GET - Buscar clientes por CUIT
    static async getClientsByCuit(req, res) {
        try {
            const { cuit } = req.params;
            const clients = await Client_1.default.find({ cuit }).sort({ name: 1 });
            res.json(clients);
        }
        catch (error) {
            res.status(500).json({ message: "Error al buscar clientes por CUIT", error });
        }
    }
    // GET - Buscar clientes por nombre
    static async searchClientsByName(req, res) {
        try {
            const { name } = req.query;
            const clients = await Client_1.default.find({
                name: { $regex: name, $options: "i" }
            }).sort({ name: 1 });
            res.json(clients);
        }
        catch (error) {
            res.status(500).json({ message: "Error al buscar clientes por nombre", error });
        }
    }
    // GET - Obtener clientes activos
    static async getActiveClients(req, res) {
        try {
            const clients = await Client_1.default.find({ isActive: true }).sort({ name: 1 });
            res.json(clients);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener clientes activos", error });
        }
    }
    // GET - Obtener clientes por tipo
    static async getClientsByType(req, res) {
        try {
            const { type } = req.params; // PERSONA_FISICA | PERSONA_JURIDICA
            const clients = await Client_1.default.find({ clientType: type }).sort({ name: 1 });
            res.json(clients);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener clientes por tipo", error });
        }
    }
    // GET - Obtener clientes por condición fiscal
    static async getClientsByTaxCondition(req, res) {
        try {
            const { condition } = req.params;
            const clients = await Client_1.default.find({ taxCondition: condition }).sort({ name: 1 });
            res.json(clients);
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener clientes por condición fiscal", error });
        }
    }
    // PATCH - Activar/Desactivar cliente
    static async toggleClientStatus(req, res) {
        try {
            const client = await Client_1.default.findById(req.params.id);
            if (!client) {
                res.status(404).json({ message: "Cliente no encontrado" });
                return;
            }
            client.isActive = !client.isActive;
            const updatedClient = await client.save();
            res.json(updatedClient);
        }
        catch (error) {
            res.status(400).json({ message: "Error al cambiar estado del cliente", error });
        }
    }
    // GET - Obtener estadísticas de clientes
    static async getClientsStats(req, res) {
        try {
            const total = await Client_1.default.countDocuments();
            const active = await Client_1.default.countDocuments({ isActive: true });
            const inactive = await Client_1.default.countDocuments({ isActive: false });
            const personaFisica = await Client_1.default.countDocuments({ clientType: "PERSONA_FISICA" });
            const personaJuridica = await Client_1.default.countDocuments({ clientType: "PERSONA_JURIDICA" });
            res.json({
                total,
                active,
                inactive,
                personaFisica,
                personaJuridica,
            });
        }
        catch (error) {
            res.status(500).json({ message: "Error al obtener estadísticas de clientes", error });
        }
    }
}
exports.ClientController = ClientController;
