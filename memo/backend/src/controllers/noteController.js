import noteService from "../services/noteService.js";
import logger from "@curatocv/platform-backend/configs/logger";

const isValidObjectId = (value) => {
    return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
};

export const createNote = async (req, res, next) => {
    try {
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

export default {
    createNote,
    getNoteById,
    listNotes,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
};
