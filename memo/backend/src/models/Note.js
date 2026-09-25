import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Note title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
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
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        version: {
            type: Number,
            default: 1,
        },
    },
    {
        timestamps: true,
    }
);

noteSchema.index({ userId: 1, isDeleted: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, folder: 1 });
noteSchema.index({ userId: 1, tags: 1 });
noteSchema.index({ title: "text", content: "text" });

const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);

export default Note;
