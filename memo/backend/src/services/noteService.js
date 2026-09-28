/**
 * Developer context for memo/backend/src/services/noteService.js.
 * Purpose: apply note-domain validation and rules before the repository persists data.
 * Why here: note-domain decisions belong to Memo rather than Platform or the root composition package.
 */
import noteRepository from "../repositories/noteRepository.js";
import folderRepository from "../repositories/folderRepository.js";
import logger from "@curatocv/platform-backend/configs/logger";
import ApiError from "@curatocv/platform-backend/utils/apiError";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_FOLDER_LENGTH = 50;

export const createNote = async (userId, data) => {
    // Normalize first so storage receives a predictable title regardless of
    // surrounding whitespace; reject empty and oversized titles at the boundary.
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title || title.length > MAX_TITLE_LENGTH) {
        throw ApiError.badRequest("A valid title (1-200 characters) is required.");
    }

    const content = typeof data.content === "string" ? data.content : "";
    if (content.length > MAX_CONTENT_LENGTH) {
        throw ApiError.badRequest("Note content exceeds maximum allowed length of 50,000 characters.");
    }

    let folder = typeof data.folder === "string" ? data.folder.trim() : "General";
    if (folder.length > MAX_FOLDER_LENGTH) {
        throw ApiError.badRequest("Folder name cannot exceed 50 characters.");
    }

    let folderId = null;
    if (data.folderId !== undefined && data.folderId !== null && data.folderId !== "") {
        const id = String(data.folderId);
        if (!/^[a-fA-F0-9]{24}$/.test(id)) {
            throw ApiError.badRequest("Invalid folder ID.");
        }
        const selectedFolder = await folderRepository.getFolderById(id, userId);
        if (!selectedFolder) throw ApiError.notFound("Folder not found.");
        folderId = selectedFolder._id;
        // Store the canonical folder label with the reference for older clients that read the text field.
        folder = selectedFolder.name;
    }

    // Tags are optional. Keep only non-empty trimmed values and cap the number
    // so one request cannot create an unbounded tag list.
    const tags = Array.isArray(data.tags)
        ? data.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 10)
        : [];

    return await noteRepository.createNote(userId, {
        title,
        content,
        folder,
        folderId,
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
    // Build an allowlisted update object. Unknown request properties are not
    // forwarded to MongoDB, which prevents accidental mass assignment.
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

    if (updateData.folderId !== undefined) {
        if (updateData.folderId === null) {
            sanitized.folderId = null;
            sanitized.folder = "General";
        } else {
            const id = String(updateData.folderId);
            if (!/^[a-fA-F0-9]{24}$/.test(id)) {
                throw ApiError.badRequest("Invalid folder ID.");
            }
            const selectedFolder = await folderRepository.getFolderById(id, userId);
            if (!selectedFolder) throw ApiError.notFound("Folder not found.");
            sanitized.folderId = selectedFolder._id;
            sanitized.folder = selectedFolder.name;
        }
    } else if (updateData.folder !== undefined) {
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
    // Preserve recoverability: ordinary delete marks the note as deleted.
    return await noteRepository.softDeleteNote(noteId, userId);
};

export const restoreNote = async (noteId, userId) => {
    return await noteRepository.restoreNote(noteId, userId);
};

export const permanentDeleteNote = async (noteId, userId) => {
    return await noteRepository.permanentDeleteNote(noteId, userId);
};

export const listExplorer = async (userId) => {
    return await noteRepository.listExplorerMetadata(userId);
};

export default {
    createNote,
    getNote,
    listNotes,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
    listExplorer,
};
