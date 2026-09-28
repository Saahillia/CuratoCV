/**
 * Developer context for memo/backend/src/models/Bookmark.js.
 * Purpose: define the Memo Bookmark document stored by Mongoose using stable content-based anchoring.
 */
import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        noteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
            required: true,
            index: true,
        },
        anchorText: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, "Anchor text cannot exceed 500 characters"],
        },
        startOffset: {
            type: Number,
            required: true,
            default: 0,
        },
        title: {
            type: String,
            default: "",
            trim: true,
            maxlength: [200, "Bookmark title cannot exceed 200 characters"],
        },
        snippet: {
            type: String,
            default: "",
            trim: true,
            maxlength: [300, "Snippet cannot exceed 300 characters"],
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate bookmarks for the exact same user, note, anchorText, and startOffset
bookmarkSchema.index({ userId: 1, noteId: 1, anchorText: 1, startOffset: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, updatedAt: -1 });

const Bookmark = mongoose.models.Bookmark || mongoose.model("Bookmark", bookmarkSchema);

export default Bookmark;
