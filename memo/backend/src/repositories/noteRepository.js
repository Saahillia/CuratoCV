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
    const note = await Note.findOne({ _id: noteId, userId, isDeleted: false });
    return note;
};

export const listNotes = async (userId, queryOptions = {}) => {
    const {
        page = 1,
        limit = 20,
        folder,
        tag,
        search,
        isArchived = false,
        isDeleted = false,
    } = queryOptions;

    const query = { userId, isDeleted: Boolean(isDeleted) };

    if (folder) {
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
    const query = { _id: noteId, userId, isDeleted: false };

    if (expectedVersion !== undefined) {
        query.version = expectedVersion;
    }

    const note = await Note.findOne(query);

    if (!note) {
        // Check if note exists at all to differentiate 404 vs 409
        const exists = await Note.findOne({ _id: noteId, userId, isDeleted: false });
        if (exists && expectedVersion !== undefined && exists.version !== expectedVersion) {
            throw ApiError.conflict("Note has been modified elsewhere. Please refresh and try again.");
        }
        throw ApiError.notFound("Note not found.");
    }

    if (updateData.title !== undefined) note.title = updateData.title;
    if (updateData.content !== undefined) note.content = updateData.content;
    if (updateData.folder !== undefined) note.folder = updateData.folder;
    if (updateData.tags !== undefined) note.tags = updateData.tags;
    if (updateData.isPinned !== undefined) note.isPinned = updateData.isPinned;
    if (updateData.isArchived !== undefined) note.isArchived = updateData.isArchived;

    note.version += 1;
    await note.save();

    return note;
};

export const softDeleteNote = async (noteId, userId) => {
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
    const note = await Note.findOneAndDelete({ _id: noteId, userId, isDeleted: true });
    if (!note) {
        throw ApiError.notFound("Deleted note not found.");
    }
    return note;
};

export default {
    createNote,
    getNoteById,
    listNotes,
    updateNote,
    softDeleteNote,
    restoreNote,
    permanentDeleteNote,
};
