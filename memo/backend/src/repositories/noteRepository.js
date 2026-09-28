/**
 * Developer context for memo/backend/src/repositories/noteRepository.js.
 * Purpose: perform user-scoped Memo note Repository database operations.
 * Why here: persistence mechanics stay separate, and user ownership filters must remain part of relevant queries.
 */
import Folder from "../models/Folder.js";
import Note from "../models/Note.js";
import logger from "@curatocv/platform-backend/configs/logger";
import ApiError from "@curatocv/platform-backend/utils/apiError";

export const createNote = async (userId, noteData) => {
    try {
        const note = await Note.create({
            userId,
            title: noteData.title,
            content: noteData.content || "",
            folder: noteData.folder || "General",
            folderId: noteData.folderId || null,
            tags: noteData.tags || [],
            isPinned: Boolean(noteData.isPinned),
            isArchived: Boolean(noteData.isArchived),
        });
        return note;
    } catch (error) {
        logger.error("Note repository create error:", error);
        throw error;
    }
};

export const getNoteById = async (noteId, userId) => {
    // Include the authenticated owner in the query itself. Knowing another
    // user's note ID is not enough to retrieve that note (IDOR protection).
    const note = await Note.findOne({ _id: noteId, userId, isDeleted: false });
    return note;
};

export const listNotes = async (userId, queryOptions = {}) => {
    const {
        page = 1,
        limit = 20,
        folder,
        folderId,
        tag,
        search,
        isArchived = false,
        isDeleted = false,
    } = queryOptions;

    // Every list query is scoped to one owner and one trash state before
    // optional filters are added.
    const query = { userId, isDeleted: Boolean(isDeleted) };

    if (folderId) {
        query.folderId = folderId;
    } else if (folder) {
        query.folder = folder;
    }

    if (tag) {
        query.tags = tag;
    }

    if (isArchived !== undefined) {
        query.isArchived = Boolean(isArchived);
    }

    if (search) {
        query.$text = { $search: search };
    }

    // Clamp page size so a caller cannot request an arbitrarily large result.
    // `skip` uses the normalized page and page size for pagination.
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [notes, total] = await Promise.all([
        Note.find(query)
            .sort({ isPinned: -1, updatedAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean(),
        Note.countDocuments(query),
    ]);

    return {
        notes,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / pageSize) || 1,
    };
};

export const updateNote = async (noteId, userId, updateData, expectedVersion) => {
    // Owner and active-state filters are part of the database lookup, not just
    // a check performed by the UI.
    const query = { _id: noteId, userId, isDeleted: false };

    if (expectedVersion !== undefined) {
        query.version = expectedVersion;
    }

    const note = await Note.findOne(query);

    if (!note) {
        // If the owner still has this note but its version changed, tell the
        // editor to refresh (409); otherwise report that it is unavailable (404).
        const exists = await Note.findOne({ _id: noteId, userId, isDeleted: false });
        if (exists && expectedVersion !== undefined && exists.version !== expectedVersion) {
            throw ApiError.conflict("Note has been modified elsewhere. Please refresh and try again.");
        }
        throw ApiError.notFound("Note not found.");
    }

    if (updateData.title !== undefined) note.title = updateData.title;
    if (updateData.content !== undefined) note.content = updateData.content;
    if (updateData.folderId !== undefined) {
        note.folderId = updateData.folderId;
        if (updateData.folder !== undefined) note.folder = updateData.folder;
    } else if (updateData.folder !== undefined) {
        note.folder = updateData.folder;
    }
    if (updateData.tags !== undefined) note.tags = updateData.tags;
    if (updateData.isPinned !== undefined) note.isPinned = updateData.isPinned;
    if (updateData.isArchived !== undefined) note.isArchived = updateData.isArchived;

    note.version += 1;
    await note.save();

    return note;
};

export const softDeleteNote = async (noteId, userId) => {
    // Trash is reversible: retain the document and record when it was deleted.
    const note = await Note.findOne({ _id: noteId, userId, isDeleted: false });
    if (!note) {
        throw ApiError.notFound("Note not found.");
    }

    note.isDeleted = true;
    note.deletedAt = new Date();
    await note.save();
    return note;
};

export const restoreNote = async (noteId, userId) => {
    const note = await Note.findOne({ _id: noteId, userId, isDeleted: true });
    if (!note) {
        throw ApiError.notFound("Deleted note not found.");
    }

    note.isDeleted = false;
    note.deletedAt = null;
    await note.save();
    return note;
};

export const permanentDeleteNote = async (noteId, userId) => {
    // Only records already in trash can be permanently removed through this API.
    const note = await Note.findOneAndDelete({ _id: noteId, userId, isDeleted: true });
    if (!note) {
        throw ApiError.notFound("Deleted note not found.");
    }
    return note;
};

export const listLegacyFolderNames = async (userId) => Note.distinct("folder", {
    userId,
    isDeleted: false,
    isArchived: false,
    folderId: null,
});

export const listExplorerMetadata = async (userId) => {
    const [notes, folders] = await Promise.all([
        Note.find({ userId, isDeleted: false, isArchived: false }).lean(),
        Folder.find({ userId }).lean(),
    ]);
    return {
        folders: folders.map((f) => ({
            _id: f._id,
            name: f.name,
            parentId: f.parentId || null,
        })),
        documents: notes.map((n) => ({
            _id: n._id,
            title: n.title,
            folderId: n.folderId || null,
            folder: n.folder || "General",
            updatedAt: n.updatedAt,
        })),
    };
};

export default {
    createNote,
    getNoteById,
    listNotes,
    updateNote,
    softDeleteNote,
    restoreNote,
    permanentDeleteNote,
    listLegacyFolderNames,
    listExplorerMetadata,
};
