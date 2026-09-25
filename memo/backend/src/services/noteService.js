import noteRepository from "../repositories/noteRepository.js";
import logger from "@curatocv/platform-backend/configs/logger";
import ApiError from "@curatocv/platform-backend/utils/apiError";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_FOLDER_LENGTH = 50;

export const createNote = async (userId, data) => {
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title || title.length > MAX_TITLE_LENGTH) {
        throw ApiError.badRequest("A valid title (1-200 characters) is required.");
    }

    const content = typeof data.content === "string" ? data.content : "";
    if (content.length > MAX_CONTENT_LENGTH) {
        throw ApiError.badRequest("Note content exceeds maximum allowed length of 50,000 characters.");
    }

    const folder = typeof data.folder === "string" ? data.folder.trim() : "General";
    if (folder.length > MAX_FOLDER_LENGTH) {
        throw ApiError.badRequest("Folder name cannot exceed 50 characters.");
    }

    const tags = Array.isArray(data.tags)
        ? data.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 10)
        : [];

    return await noteRepository.createNote(userId, {
        title,
        content,
        folder,
        tags,
        isPinned: Boolean(data.isPinned),
        isArchived: Boolean(data.isArchived),
    });
};

export const getNote = async (noteId, userId) => {
    const note = await noteRepository.getNoteById(noteId, userId);
    if (!note) {
        throw ApiError.notFound("Note not found.");
    }
    return note;
};

export const listNotes = async (userId, queryParams) => {
    return await noteRepository.listNotes(userId, queryParams);
};

export const updateNote = async (noteId, userId, updateData, expectedVersion) => {
    const sanitized = {};

    if (updateData.title !== undefined) {
        const title = String(updateData.title).trim();
        if (!title || title.length > MAX_TITLE_LENGTH) {
            throw ApiError.badRequest("A valid title (1-200 characters) is required.");
        }
        sanitized.title = title;
    }

    if (updateData.content !== undefined) {
        const content = String(updateData.content);
        if (content.length > MAX_CONTENT_LENGTH) {
            throw ApiError.badRequest("Note content exceeds maximum allowed length of 50,000 characters.");
        }
        sanitized.content = content;
    }

    if (updateData.folder !== undefined) {
        const folder = String(updateData.folder).trim();
        if (folder.length > MAX_FOLDER_LENGTH) {
            throw ApiError.badRequest("Folder name cannot exceed 50 characters.");
        }
        sanitized.folder = folder;
    }

    if (updateData.tags !== undefined) {
        if (!Array.isArray(updateData.tags)) {
            throw ApiError.badRequest("Tags must be an array.");
        }
        sanitized.tags = updateData.tags
            .map(t => String(t).trim())
            .filter(Boolean)
            .slice(0, 10);
    }

    if (updateData.isPinned !== undefined) {
        sanitized.isPinned = Boolean(updateData.isPinned);
    }

    if (updateData.isArchived !== undefined) {
        sanitized.isArchived = Boolean(updateData.isArchived);
    }

    return await noteRepository.updateNote(noteId, userId, sanitized, expectedVersion);
};

export const deleteNote = async (noteId, userId) => {
    return await noteRepository.softDeleteNote(noteId, userId);
};

export const restoreNote = async (noteId, userId) => {
    return await noteRepository.restoreNote(noteId, userId);
};

export const permanentDeleteNote = async (noteId, userId) => {
    return await noteRepository.permanentDeleteNote(noteId, userId);
};

export default {
    createNote,
    getNote,
    listNotes,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
};
