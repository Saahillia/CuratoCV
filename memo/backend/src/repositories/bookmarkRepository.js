/**
 * Developer context for memo/backend/src/repositories/bookmarkRepository.js.
 * Purpose: perform user-scoped Memo Bookmark Repository database operations with strict IDOR protections using stable content anchors.
 */
import Bookmark from "../models/Bookmark.js";
import logger from "@curatocv/platform-backend/configs/logger";

export const createBookmark = async (userId, data) => {
    try {
        const bookmark = await Bookmark.create({
            userId,
            noteId: data.noteId,
            anchorText: data.anchorText,
            startOffset: data.startOffset || 0,
            title: data.title || "",
            snippet: data.snippet || "",
        });
        return bookmark;
    } catch (error) {
        logger.error("Bookmark repository create error:", error);
        throw error;
    }
};

export const getBookmarkById = async (bookmarkId, userId) => {
    return await Bookmark.findOne({ _id: bookmarkId, userId });
};

export const findBookmark = async (userId, noteId, anchorText, startOffset) => {
    return await Bookmark.findOne({ userId, noteId, anchorText, startOffset });
};

export const listBookmarksByNote = async (userId, noteId) => {
    return await Bookmark.find({ userId, noteId }).sort({ startOffset: 1, createdAt: 1 }).lean();
};

export const listAllBookmarks = async (userId) => {
    return await Bookmark.find({ userId })
        .populate("noteId", "title folder isDeleted")
        .sort({ updatedAt: -1 })
        .lean();
};

export const deleteBookmark = async (bookmarkId, userId) => {
    return await Bookmark.findOneAndDelete({ _id: bookmarkId, userId });
};

export const deleteBookmarkByLocation = async (userId, noteId, anchorText, startOffset) => {
    return await Bookmark.findOneAndDelete({ userId, noteId, anchorText, startOffset });
};

export const deleteBookmarksByNoteId = async (noteId, userId) => {
    return await Bookmark.deleteMany({ noteId, userId });
};

export default {
    createBookmark,
    getBookmarkById,
    findBookmark,
    listBookmarksByNote,
    listAllBookmarks,
    deleteBookmark,
    deleteBookmarkByLocation,
    deleteBookmarksByNoteId,
};
