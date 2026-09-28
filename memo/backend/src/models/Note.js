/**
 * Developer context for memo/backend/src/models/Note.js.
 * Purpose: define the Memo Note document stored by Mongoose.
 * Why here: note data schema is owned by Memo and must not become a Platform or Resume Builder concern.
 */
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
    {
        // Every note belongs to one authenticated account; the reference supports population and the index helps user-scoped lookups.
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Schema validation is a final persistence guard, even when API validation has already checked the same input.
        title: {
            type: String,
            required: [true, "Note title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        // Empty content is allowed so a user can create a note before typing its body.
        content: {
            type: String,
            default: "",
            maxlength: [50000, "Content cannot exceed 50,000 characters"],
        },
        folder: {
            type: String,
            default: "General",
            trim: true,
            maxlength: [50, "Folder name cannot exceed 50 characters"],
        },
        // Optional reference adds persistent hierarchy while older notes keep using their folder text unchanged.
        folderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MemoFolder",
            default: null,
        },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: (v) => v.length <= 10,
                message: "Cannot exceed 10 tags per note",
            },
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        // Notes are hidden/restorable through flags, so deleting one does not immediately erase its document.
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        // Clients send this version during edits so the repository can detect overwrites from concurrent sessions.
        version: {
            type: Number,
            default: 1,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes match common queries: a user's active notes sorted by recency, and notes filtered by folder or tag.
noteSchema.index({ userId: 1, isDeleted: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, folder: 1 });
noteSchema.index({ userId: 1, folderId: 1, isDeleted: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, tags: 1 });
// Text search uses MongoDB's text index rather than scanning every note body in application code.
noteSchema.index({ title: "text", content: "text" });

// Reuse the registered model during hot reloads or tests, where importing this module more than once is possible.
const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);

export default Note;
