/**
 * Developer context for memo/backend/src/controllers/noteController.js.
 * Purpose: translate note API requests into note-service calls and HTTP responses.
 * Why here: HTTP details stay separate from note rules and persistence.
 */
import noteService from "../services/noteService.js";
import folderService from "../services/folderService.js";
import logger from "@curatocv/platform-backend/configs/logger";

const isValidObjectId = (value) => {
    // Reject malformed IDs before they reach Mongoose, whose cast errors
    // would otherwise become less predictable API failures.
    return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
};

export const listFolders = async (req, res, next) => {
    try {
        const result = await folderService.listFolders(req.userId);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return next(error);
    }
};

export const createFolder = async (req, res, next) => {
    try {
        const folder = await folderService.createFolder(req.userId, req.body);
        return res.status(201).json({
            success: true,
            data: { folder, message: "Folder created successfully." },
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteFolder = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid folder ID." },
            });
        }

        await folderService.deleteFolder(id, userId);
        return res.status(200).json({
            success: true,
            data: { message: "Folder deleted successfully." },
        });
    } catch (error) {
        return next(error);
    }
};

export const createNote = async (req, res, next) => {
    try {
        // Authentication middleware sets req.userId from the verified token;
        // never accept an owner ID from the request body.
        const userId = req.userId;
        const note = await noteService.createNote(userId, req.body);
        return res.status(201).json({
            success: true,
            data: { note, message: "Note created successfully." },
        });
    } catch (error) {
        return next(error);
    }
};

export const getNoteById = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid note ID." },
            });
        }

        const note = await noteService.getNote(id, userId);
        return res.status(200).json({
            success: true,
            data: { note },
        });
    } catch (error) {
        return next(error);
    }
};

export const listExplorer = async (req, res, next) => {
    try {
        const userId = req.userId;
        const result = await noteService.listExplorer(userId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};

export const listNotes = async (req, res, next) => {
    try {
        const userId = req.userId;
        const result = await noteService.listNotes(userId, req.query);
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};

export const updateNote = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid note ID." },
            });
        }

        // Multipart or older clients may send a version as text. Convert only
        // a non-empty numeric string so the repository can compare numbers.
        let expectedVersion = req.body.expectedVersion;
        if (typeof expectedVersion === "string" && expectedVersion.trim() !== "") {
            const parsed = parseInt(expectedVersion, 10);
            if (!isNaN(parsed)) expectedVersion = parsed;
        }

        const note = await noteService.updateNote(id, userId, req.body, expectedVersion);
        return res.status(200).json({
            success: true,
            data: { note, message: "Note updated successfully." },
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteNote = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid note ID." },
            });
        }

        // Normal delete moves a note to trash; the permanent endpoint is separate.
        await noteService.deleteNote(id, userId);
        return res.status(200).json({
            success: true,
            data: { message: "Note moved to trash." },
        });
    } catch (error) {
        return next(error);
    }
};

export const restoreNote = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid note ID." },
            });
        }

        const note = await noteService.restoreNote(id, userId);
        return res.status(200).json({
            success: true,
            data: { note, message: "Note restored successfully." },
        });
    } catch (error) {
        return next(error);
    }
};

export const permanentDeleteNote = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid note ID." },
            });
        }

        await noteService.permanentDeleteNote(id, userId);
        return res.status(200).json({
            success: true,
            data: { message: "Note permanently deleted." },
        });
    } catch (error) {
        return next(error);
    }
};

export const permanentDeleteFolder = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid folder ID." },
            });
        }

        const result = await folderService.permanentDeleteFolder(id, userId);
        return res.status(200).json({
            success: true,
            data: { message: "Folder and contents permanently deleted.", ...result },
        });
    } catch (error) {
        return next(error);
    }
};

export default {
    listFolders,
    createFolder,
    deleteFolder,
    permanentDeleteFolder,
    createNote,
    getNoteById,
    listNotes,
    listExplorer,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
};
