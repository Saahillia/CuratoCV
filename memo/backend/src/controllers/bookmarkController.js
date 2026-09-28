/**
 * Developer context for memo/backend/src/controllers/bookmarkController.js.
 * Purpose: translate bookmark API requests into service calls and HTTP responses with stable content anchors.
 */
import bookmarkService from "../services/bookmarkService.js";

const isValidObjectId = (value) => {
    return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
};

export const createBookmark = async (req, res, next) => {
    try {
        const userId = req.userId;
        const noteId = req.params.noteId || req.body.noteId;
        const { anchorText, startOffset, title, snippet } = req.body;

        const bookmark = await bookmarkService.createBookmark(userId, {
            noteId,
            anchorText,
            startOffset,
            title,
            snippet,
        });

        return res.status(201).json({
            success: true,
            data: { bookmark, message: "Bookmark saved successfully." },
        });
    } catch (error) {
        return next(error);
    }
};

export const listBookmarksByNote = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { noteId } = req.params;

        if (!isValidObjectId(noteId)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid note ID." },
            });
        }

        const bookmarks = await bookmarkService.listBookmarksByNote(userId, noteId);
        return res.status(200).json({
            success: true,
            data: { bookmarks },
        });
    } catch (error) {
        return next(error);
    }
};

export const listAllBookmarks = async (req, res, next) => {
    try {
        const userId = req.userId;
        const bookmarks = await bookmarkService.listAllBookmarks(userId);
        return res.status(200).json({
            success: true,
            data: { bookmarks },
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteBookmark = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { bookmarkId } = req.params;

        if (!isValidObjectId(bookmarkId)) {
            return res.status(400).json({
                success: false,
                error: { code: "INVALID_ID", message: "Invalid bookmark ID." },
            });
        }

        await bookmarkService.deleteBookmark(bookmarkId, userId);
        return res.status(200).json({
            success: true,
            data: { message: "Bookmark removed successfully." },
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteBookmarkByLocation = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { noteId } = req.params;
        const { anchorText, startOffset } = req.query;

        await bookmarkService.deleteBookmarkByLocation(userId, noteId, anchorText, startOffset);
        return res.status(200).json({
            success: true,
            data: { message: "Bookmark removed successfully." },
        });
    } catch (error) {
        return next(error);
    }
};

export default {
    createBookmark,
    listBookmarksByNote,
    listAllBookmarks,
    deleteBookmark,
    deleteBookmarkByLocation,
};
