/**
 * Developer context for memo/backend/src/routes/notesRoutes.js.
 * Purpose: declare the Memo notes Routes HTTP contract.
 * Why here: Memo owns note routes; backend/server.js composes them under the compatibility prefix /api/notes.
 */
import express from "express";
import protect from "@curatocv/platform-backend/middlewares/authMiddleware";
import {
    createNote,
    getNoteById,
    listNotes,
    listExplorer,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
    listFolders,
    createFolder,
    deleteFolder,
    permanentDeleteFolder,
} from "../controllers/noteController.js";

const notesRouter = express.Router();

// Protect the whole router once so every note operation receives the same authenticated-user context.
notesRouter.use(protect);

// Folder and explorer metadata endpoints share the authenticated /api/notes contract and precede the dynamic note-ID route.
notesRouter.get("/explorer", listExplorer);
notesRouter.get("/folders", listFolders);
notesRouter.post("/folders", createFolder);
notesRouter.delete("/folders/:id/permanent", permanentDeleteFolder);
notesRouter.delete("/folders/:id", deleteFolder);

// Keep these HTTP paths stable: the root composition mounts this router under the legacy-compatible /api/notes prefix.
notesRouter.get("/", listNotes);
notesRouter.post("/create", createNote);
notesRouter.get("/:id", getNoteById);
notesRouter.put("/:id", updateNote);
notesRouter.delete("/:id", deleteNote);
notesRouter.post("/:id/restore", restoreNote);
notesRouter.delete("/:id/permanent", permanentDeleteNote);

export default notesRouter;
