"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const note_controller_1 = require("../controllers/note.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const router = (0, express_1.Router)();
// Middleware: todas las rutas requieren autenticación
router.use(verifyToken_1.verifyToken);
// Rutas principales para notas
// GET /api/notes - Obtener todas las notas con filtros y paginación
router.get("/", note_controller_1.NoteController.getAllNotes);
// GET /api/notes/stats - Obtener estadísticas de notas
router.get("/stats", note_controller_1.NoteController.getNoteStats);
// GET /api/notes/sale/:saleId - Obtener notas por venta específica
router.get("/sale/:saleId", note_controller_1.NoteController.getNotesBySale);
// GET /api/notes/:id - Obtener nota por ID
router.get("/:id", note_controller_1.NoteController.getNoteById);
// POST /api/notes - Crear nueva nota  
router.post("/", note_controller_1.NoteController.createNote);
// POST /api/notes/:id/send-to-afip - Enviar nota a AFIP para obtener CAE
router.post("/:id/send-to-afip", note_controller_1.NoteController.sendToAfip);
// PUT /api/notes/:id - Actualizar nota
router.put("/:id", note_controller_1.NoteController.updateNote);
// DELETE /api/notes/:id - Eliminar nota (soft delete)
router.delete("/:id", note_controller_1.NoteController.deleteNote);
exports.default = router;
