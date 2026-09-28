/**
 * Developer context for memo/backend/src/services/bookmarkService.js.
 * Purpose: apply bookmark validation, document authorization, and business rules using stable content anchors.
 */
import bookmarkRepository from "../repositories/bookmarkRepository.js";
import noteRepository from "../repositories/noteRepository.js";
import ApiError from "@curatocv/platform-backend/utils/apiError";

export const createBookmark = async (userId, data) => {
    const { noteId, anchorText, startOffset, title, snippet } = data;

    if (!noteId || !/^[a-fA-F0-9]{24}$/.test(String(noteId))) {
        throw ApiError.badRequest("Valid note ID is required.");
    }

    const note = await noteRepository.getNoteById(noteId, userId);
    if (!note) {
        throw ApiError.notFound("Note not found or you do not have permission to bookmark this note.");
    }

    if (!anchorText || typeof anchorText !== "string" || anchorText.trim().length === 0) {
        throw ApiError.badRequest("Valid anchor text is required.");
    }

    const parsedStartOffset = Number(startOffset) >= 0 ? Number(startOffset) : 0;
    const trimmedAnchor = anchorText.trim().slice(0, 500);

    // Check for duplicate
    const existing = await bookmarkRepository.findBookmark(userId, noteId, trimmedAnchor, parsedStartOffset);
    if (existing) {
        throw ApiError.conflict("Bookmark already exists for this exact location.");
    }

    const bookmarkTitle = typeof title === "string" && title.trim() ? title.trim().slice(0, 200) : trimmedAnchor.slice(0, 40) || "Untitled Bookmark";
    const bookmarkSnippet = typeof snippet === "string" ? snippet.trim().slice(0, 300) : "";

    return await bookmarkRepository.createBookmark(userId, {
        noteId,
        anchorText: trimmedAnchor,
        startOffset: parsedStartOffset,
        title: bookmarkTitle,
        snippet: bookmarkSnippet,
    });
};

export const listBookmarksByNote = async (userId, noteId) => {
    if (!noteId || !/^[a-fA-F0-9]{24}$/.test(String(noteId))) {
        throw ApiError.badRequest("Valid note ID is required.");
    }

    const note = await noteRepository.getNoteById(noteId, userId);
    if (!note) {
        throw ApiError.notFound("Note not found.");
    }

    return await bookmarkRepository.listBookmarksByNote(userId, noteId);
};

export const listAllBookmarks = async (userId) => {
    const bookmarks = await bookmarkRepository.listAllBookmarks(userId);
    return bookmarks.filter(b => b.noteId && !b.noteId.isDeleted);
};

export const deleteBookmark = async (bookmarkId, userId) => {
    if (!bookmarkId || !/^[a-fA-F0-9]{24}$/.test(String(bookmarkId))) {
        throw ApiError.badRequest("Valid bookmark ID is required.");
    }

    const deleted = await bookmarkRepository.deleteBookmark(bookmarkId, userId);
    if (!deleted) {
        throw ApiError.notFound("Bookmark not found or unauthorized.");
    }

    return deleted;
};

export const deleteBookmarkByLocation = async (userId, noteId, anchorText, startOffset) => {
    if (!noteId || !/^[a-fA-F0-9]{24}$/.test(String(noteId))) {
        throw ApiError.badRequest("Valid note ID is required.");
    }

    const trimmedAnchor = typeof anchorText === "string" ? anchorText.trim() : "";
    const parsedStartOffset = Number(startOffset) >= 0 ? Number(startOffset) : 0;

    const deleted = await bookmarkRepository.deleteBookmarkByLocation(userId, noteId, trimmedAnchor, parsedStartOffset);
    if (!deleted) {
        throw ApiError.notFound("Bookmark not found at specified location.");
    }

    return deleted;
};

export default {
    createBookmark,
    listBookmarksByNote,
    listAllBookmarks,
    deleteBookmark,
    deleteBookmarkByLocation,
};
