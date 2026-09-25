import express from "express";
import protect from "@curatocv/platform-backend/middlewares/authMiddleware.js";
import {
    createNote,
    getNoteById,
    listNotes,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
} from "../controllers/noteController.js";

const notesRouter = express.Router();

notesRouter.use(protect);

notesRouter.get("/", listNotes);
notesRouter.post("/create", createNote);
notesRouter.get("/:id", getNoteById);
notesRouter.put("/:id", updateNote);
notesRouter.delete("/:id", deleteNote);
notesRouter.post("/:id/restore", restoreNote);
notesRouter.delete("/:id/permanent", permanentDeleteNote);

export default notesRouter;
