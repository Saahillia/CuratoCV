/**
 * Persists Memo folder nodes with owner-scoped reads and parent validation.
 * No folder query accepts an owner identifier from an untrusted client payload.
 */
import Folder from "../models/Folder.js";
import Note from "../models/Note.js";

export const createFolder = async (userId, folderData) => Folder.create({
    userId,
    name: folderData.name,
    nameKey: folderData.name.toLowerCase(),
    parentId: folderData.parentId || null,
});

export const getFolderById = async (folderId, userId) =>
    Folder.findOne({ _id: folderId, userId }).lean();

export const listFolders = async (userId) =>
    Folder.find({ userId }).sort({ name: 1, createdAt: 1 }).lean();

export const deleteFolder = async (folderId, userId) =>
    Folder.findOneAndDelete({ _id: folderId, userId });

export const hasChildren = async (folderId, userId) => {
    const [hasChildFolders, hasDocuments] = await Promise.all([
        Folder.exists({ userId, parentId: folderId }),
        Note.exists({ userId, folderId, isDeleted: false }),
    ]);
    return Boolean(hasChildFolders || hasDocuments);
};

export const getDescendantFolderIds = async (folderId, userId) => {
    const ids = new Set([String(folderId)]);
    const stack = [String(folderId)];
    while (stack.length > 0) {
        const current = stack.pop();
        const children = await Folder.find({ userId, parentId: current }).select("_id").lean();
        for (const child of children) {
            const sid = String(child._id);
            if (!ids.has(sid)) {
                ids.add(sid);
                stack.push(sid);
            }
        }
    }
    return Array.from(ids);
};

export const deleteFoldersByIds = async (folderIds, userId) => {
    await Folder.deleteMany({ _id: { $in: folderIds }, userId });
};

export default { createFolder, getFolderById, listFolders, deleteFolder, hasChildren, getDescendantFolderIds, deleteFoldersByIds };
