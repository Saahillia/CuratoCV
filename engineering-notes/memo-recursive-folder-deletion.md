---
name: memo-recursive-folder-deletion
description: Recursive permanent folder subtree deletion with strict owner scoping and frontend confirmation modal
metadata:
  type: project
---

# Memo Recursive Permanent Folder Deletion

## What
Implemented Phase A of the Memo workspace architecture: recursive permanent folder deletion (`DELETE /api/notes/folders/:id/permanent`) along with a frontend confirmation dialog and comprehensive backend test coverage.

## Why
Users need to be able to clean up non-empty folder hierarchies without manual single-folder extraction, while guaranteeing strict multi-tenant authorization (`req.userId`) so users can never delete or access other users' folders or documents.

## Internal Working
1. **Repository Layer (`folderRepository.js`)**:
   - `getDescendantFolderIds(folderId, userId)`: Iteratively traverses tree nodes downward starting from `folderId`, collecting all descendant folder IDs in a `Set`.
   - `deleteFoldersByIds(folderIds, userId)`: Deletes multiple folders matching `_id IN folderIds` and scoped by `userId`.
2. **Service Layer (`folderService.js`)**:
   - `permanentDeleteFolder(folderId, userId)`:
     - Validates folder existence and ownership.
     - Fetches all descendant IDs and asserts that every discovered folder belongs strictly to `userId`.
     - Finds all active non-deleted notes within the subtree (`folderId: { $in: descendantIds }`) and deletes them.
     - Deletes all discovered folders in the subtree.
3. **Controller & Route Layer (`noteController.js`, `notesRoutes.js`)**:
   - Exposes `DELETE /api/notes/folders/:id/permanent` protected by `protect` authentication middleware.
4. **Frontend UX (`MemoWorkspace.jsx`)**:
   - When attempting to delete a non-empty folder returns a 400 bad request, the workspace catches the error and opens a confirmation modal detailing permanent recursive deletion.
   - Confirmation triggers the permanent delete endpoint, refreshing explorer and document lists.

## Failure Modes and Trade-offs
- **Orphaned Subtrees / IDOR**: Prevented by validating that `ownedCount === descendantIds.length` before executing any deletions.
- **Transactions**: MongoDB standalone instances lack replica set multi-document sessions; serialized cascading deletion (notes deleted first, then folders bottom-up) ensures consistency without requiring replica set transactions.

[[memo-explorer-hierarchy]]
[[memo-workspace-navigation]]
