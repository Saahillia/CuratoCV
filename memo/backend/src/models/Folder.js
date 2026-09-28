/**
 * Stores a Memo user's folder tree independently from notes, including empty folders.
 * Parent references stay inside Memo and are validated against the authenticated owner.
 */
import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Folder name is required"],
            trim: true,
            maxlength: [50, "Folder name cannot exceed 50 characters"],
        },
        nameKey: {
            type: String,
            required: true,
            select: false,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MemoFolder",
            default: null,
        },
    },
    { timestamps: true },
);

// Derive a stable case-insensitive key so sibling folders cannot differ only by capitalization.
folderSchema.pre("validate", function deriveNameKey() {
    if (this.name) this.nameKey = this.name.trim().toLowerCase();
});

folderSchema.index({ userId: 1, parentId: 1, nameKey: 1 }, { unique: true });

const Folder = mongoose.models.MemoFolder || mongoose.model("MemoFolder", folderSchema);

export default Folder;
