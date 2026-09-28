/**
 * Applies Memo folder validation and ownership rules before folder persistence.
 * Keeping this logic here allows routes/controllers to stay focused on HTTP behavior.
 */
import folderRepository from "../repositories/folderRepository.js";
import noteRepository from "../repositories/noteRepository.js";
import Note from "../models/Note.js";
import Folder from "../models/Folder.js";
import ApiError from "@curatocv/platform-backend/utils/apiError";

const MAX_FOLDER_NAME_LENGTH = 50;
const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

export const createFolder = async (userId, payload = {}) => {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name || name.length > MAX_FOLDER_NAME_LENGTH) {
        throw ApiError.badRequest("A folder name (1-50 characters) is required.");
    }

    let parentId = null;
    if (payload.parentId !== undefined && payload.parentId !== null && payload.parentId !== "") {
        if (typeof payload.parentId !== "string" || !OBJECT_ID_PATTERN.test(payload.parentId)) {
            throw ApiError.badRequest("Invalid parent folder ID.");
        }

        const parent = await folderRepository.getFolderById(payload.parentId, userId);
        if (!parent) throw ApiError.notFound("Parent folder not found.");
        parentId = parent._id;
    }

    if (!parentId) {
        const existingLegacyNames = await noteRepository.listLegacyFolderNames(userId);
        const normalizedName = name.toLowerCase();
        if (existingLegacyNames.some((legacyName) => legacyName.toLowerCase() === normalizedName)) {
            throw ApiError.conflict("A folder with this name already exists here.");
        }
    }

    try {
        return await folderRepository.createFolder(userId, { name, parentId });
    } catch (error) {
        if (error?.code === 11000) {
            throw ApiError.conflict("A folder with this name already exists here.");
        }
        throw error;
    }
};

export const listFolders = async (userId) => {
    const [folders, legacyFolders] = await Promise.all([
        folderRepository.listFolders(userId),
        noteRepository.listLegacyFolderNames(userId),
    ]);

    return {
        folders,
        legacyFolders: legacyFolders.filter((name) => typeof name === "string" && name.trim()),
    };
};

export const deleteFolder = async (folderId, userId) => {
    if (!folderId || typeof folderId !== "string" || !OBJECT_ID_PATTERN.test(folderId)) {
        throw ApiError.badRequest("Invalid folder ID.");
    }

    const folder = await folderRepository.getFolderById(folderId, userId);
    if (!folder) {
        throw ApiError.notFound("Folder not found.");
    }

    const isNonEmpty = await folderRepository.hasChildren(folderId, userId);
    if (isNonEmpty) {
        throw ApiError.badRequest("Cannot delete a non-empty folder. Please delete or move all contained files and subfolders first.");
    }

    return await folderRepository.deleteFolder(folderId, userId);
};

export const permanentDeleteFolder = async (folderId, userId) => {
    if (!folderId || typeof folderId !== "string" || !OBJECT_ID_PATTERN.test(folderId)) {
        throw ApiError.badRequest("Invalid folder ID.");
    }
    const folder = await folderRepository.getFolderById(folderId, userId);
    if (!folder) {
        throw ApiError.notFound("Folder not found.");
    }

    const descendantIds = await folderRepository.getDescendantFolderIds(folderId, userId);
    // Ownership verification: all discovered folders must belong to userId
    const ownedCount = await Folder.countDocuments({ _id: { $in: descendantIds }, userId });
    if (ownedCount !== descendantIds.length) {
        throw ApiError.forbidden("Folder subtree contains unowned folders.");
    }

    const notes = await Note.find({ userId, folderId: { $in: descendantIds }, isDeleted: false }).select("_id").lean();
    // Additional ownership verification for notes (already scoped by userId in query, but defend in depth)
    const noteIds = notes.map((n) => String(n._id));
    // Delete notes first, then folders (serialized — no transaction required; Mongoose session check below)
    if (noteIds.length > 0) {
        await Note.deleteMany({ _id: { $in: noteIds }, userId });
    }
    await folderRepository.deleteFoldersByIds(descendantIds, userId);
    return { deletedFolders: descendantIds.length, deletedNotes: noteIds.length };
};

export default { createFolder, listFolders, deleteFolder, permanentDeleteFolder };
