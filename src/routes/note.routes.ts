import { Router } from "express";
import { NoteController } from "../controllers/note.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// Middleware: todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas principales para notas

// GET /api/notes - Obtener todas las notas con filtros y paginación
router.get("/", NoteController.getAllNotes as any);

// GET /api/notes/stats - Obtener estadísticas de notas
router.get("/stats", NoteController.getNoteStats as any);

// GET /api/notes/sale/:saleId - Obtener notas por venta específica
router.get("/sale/:saleId", NoteController.getNotesBySale as any);

// GET /api/notes/:id - Obtener nota por ID
router.get("/:id", NoteController.getNoteById as any);

// POST /api/notes - Crear nueva nota  
router.post("/", NoteController.createNote as any);

// POST /api/notes/:id/send-to-afip - Enviar nota a AFIP para obtener CAE
router.post("/:id/send-to-afip", NoteController.sendToAfip as any);

// PUT /api/notes/:id - Actualizar nota
router.put("/:id", NoteController.updateNote as any);

// DELETE /api/notes/:id - Eliminar nota (soft delete)
router.delete("/:id", NoteController.deleteNote as any);

export default router;