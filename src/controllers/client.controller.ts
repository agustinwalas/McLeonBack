import { Request, Response } from "express";
import Client from "../models/Client";

export class ClientController {
  // GET - Obtener todos los clientes
  static async getAllClients(req: Request, res: Response) {
    try {
      const clients = await Client.find().sort({ name: 1 });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clientes", error });
    }
  }

  // GET - Obtener cliente por ID
  static async getClientById(req: Request, res: Response) {
    try {
      const client = await Client.findById(req.params.id);
      
      if (!client) {
        res.status(404).json({ message: "Cliente no encontrado" });
        return;
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cliente", error });
    }
  }

  // POST - Crear nuevo cliente
  static async createClient(req: Request, res: Response) {
    try {
      const newClient = new Client(req.body);
      const savedClient = await newClient.save();
      res.status(201).json(savedClient);
    } catch (error) {
      res.status(400).json({ message: "Error al crear cliente", error });
    }
  }

  // PUT - Actualizar cliente
  static async updateClient(req: Request, res: Response) {
    try {
      const updatedClient = await Client.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      
      if (!updatedClient) {
        res.status(404).json({ message: "Cliente no encontrado" });
        return;
      }
      
      res.json(updatedClient);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar cliente", error });
    }
  }

  // DELETE - Eliminar cliente
  static async deleteClient(req: Request, res: Response) {
    try {
      const deletedClient = await Client.findByIdAndDelete(req.params.id);
      
      if (!deletedClient) {
        res.status(404).json({ message: "Cliente no encontrado" });
        return;
      }
      
      res.json({ message: "Cliente eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar cliente", error });
    }
  }

  // GET - Buscar clientes por CUIT
  static async getClientsByCuit(req: Request, res: Response) {
    try {
      const { cuit } = req.params;
      const clients = await Client.find({ cuit }).sort({ name: 1 });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al buscar clientes por CUIT", error });
    }
  }

  // GET - Buscar clientes por nombre
  static async searchClientsByName(req: Request, res: Response) {
    try {
      const { name } = req.query;
      const clients = await Client.find({
        name: { $regex: name as string, $options: "i" }
      }).sort({ name: 1 });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al buscar clientes por nombre", error });
    }
  }

  // GET - Obtener clientes activos
  static async getActiveClients(req: Request, res: Response) {
    try {
      const clients = await Client.find({ isActive: true }).sort({ name: 1 });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clientes activos", error });
    }
  }

  // GET - Obtener clientes por tipo
  static async getClientsByType(req: Request, res: Response) {
    try {
      const { type } = req.params; // PERSONA_FISICA | PERSONA_JURIDICA
      const clients = await Client.find({ clientType: type }).sort({ name: 1 });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clientes por tipo", error });
    }
  }

  // GET - Obtener clientes por condición fiscal
  static async getClientsByTaxCondition(req: Request, res: Response) {
    try {
      const { condition } = req.params;
      const clients = await Client.find({ taxCondition: condition }).sort({ name: 1 });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clientes por condición fiscal", error });
    }
  }

  // PATCH - Activar/Desactivar cliente
  static async toggleClientStatus(req: Request, res: Response) {
    try {
      const client = await Client.findById(req.params.id);
      
      if (!client) {
        res.status(404).json({ message: "Cliente no encontrado" });
        return;
      }
      
      client.isActive = !client.isActive;
      const updatedClient = await client.save();
      
      res.json(updatedClient);
    } catch (error) {
      res.status(400).json({ message: "Error al cambiar estado del cliente", error });
    }
  }

  // GET - Obtener estadísticas de clientes
  static async getClientsStats(req: Request, res: Response) {
    try {
      const total = await Client.countDocuments();
      const active = await Client.countDocuments({ isActive: true });
      const inactive = await Client.countDocuments({ isActive: false });
      const personaFisica = await Client.countDocuments({ clientType: "PERSONA_FISICA" });
      const personaJuridica = await Client.countDocuments({ clientType: "PERSONA_JURIDICA" });

      res.json({
        total,
        active,
        inactive,
        personaFisica,
        personaJuridica,
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas de clientes", error });
    }
  }
}