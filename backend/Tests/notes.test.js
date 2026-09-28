/**
 * Developer context for backend/Tests/notes.test.js.
 * Purpose: documents the test scenarios for notes.test.
 * Why separate: keep expected behavior and regression checks close to the tested contract; production behavior stays in its owning module.
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import User from "../../platform/backend/src/models/User.js";
import Note from "../../memo/backend/src/models/Note.js";
import Folder from "../../memo/backend/src/models/Folder.js";
import notesRouter from "../../memo/backend/src/routes/notesRoutes.js";
import errorMiddleware from "../../platform/backend/src/middlewares/errorMiddleware.js";
import { createAuthToken } from "./factories.js";

const app = express();
app.use(express.json());

// Mount the controller/route logic
app.use("/api/notes", notesRouter);
app.use(errorMiddleware);

describe("Notes Foundation & API Verification", () => {
    let testUser;
    let otherUser;
    let testToken;
    let otherToken;

    beforeEach(async () => {
        await User.deleteMany({});
        await Note.deleteMany({});

        testUser = await User.create({
            name: "Notes Tester",
            email: `notes-tester-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });

        otherUser = await User.create({
            name: "Other Notes Tester",
            email: `notes-other-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });

        testToken = createAuthToken(testUser);
        otherToken = createAuthToken(otherUser);
    });

    it("should create a new note with valid payload", async () => {
        const response = await request(app)
            .post("/api/notes/create")
            .set("Authorization", `Bearer ${testToken}`)
            .send({
                title: "Engineering Architecture Note",
                content: "Detailed markdown content discussing monorepos.",
                folder: "Architecture",
                tags: ["architecture", "monorepo"],
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.note.title).toBe("Engineering Architecture Note");
        expect(response.body.data.note.userId.toString()).toBe(testUser._id.toString());
        expect(response.body.data.note.version).toBe(1);
    });

    it("should list notes with folder filtering and pagination", async () => {
        await Note.create([
            {
                userId: testUser._id,
                title: "Note 1",
                folder: "Work",
            },
            {
                userId: testUser._id,
                title: "Note 2",
                folder: "Personal",
            },
            {
                userId: testUser._id,
                title: "Note 3",
                folder: "Work",
            },
            {
                userId: otherUser._id,
                title: "Other's Note",
                folder: "Work",
            },
        ]);

        const response = await request(app)
            .get("/api/notes?folder=Work")
            .set("Authorization", `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.notes.length).toBe(2);
        expect(response.body.data.total).toBe(2);
    });

    it("should enforce optimistic concurrency on note updates", async () => {
        const note = await Note.create({
            userId: testUser._id,
            title: "Concurrency Note",
            content: "Initial content",
            version: 1,
        });

        // First update with valid version
        const update1 = await request(app)
            .put(`/api/notes/${note._id}`)
            .set("Authorization", `Bearer ${testToken}`)
            .send({
                title: "Updated Title",
                expectedVersion: 1,
            });

        expect(update1.status).toBe(200);
        expect(update1.body.data.note.version).toBe(2);

        // Second update with stale version
        const update2 = await request(app)
            .put(`/api/notes/${note._id}`)
            .set("Authorization", `Bearer ${testToken}`)
            .send({
                title: "Conflicting Title",
                expectedVersion: 1,
            });

        expect(update2.status).toBe(409);
    });

    it("should handle soft delete and restore lifecycle", async () => {
        const note = await Note.create({
            userId: testUser._id,
            title: "Soft Delete Note",
        });

        // Soft delete
        const delRes = await request(app)
            .delete(`/api/notes/${note._id}`)
            .set("Authorization", `Bearer ${testToken}`);

        expect(delRes.status).toBe(200);

        // Verify it doesn't show in standard list
        const listRes = await request(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${testToken}`);

        expect(listRes.body.data.notes.length).toBe(0);

        // Restore
        const restoreRes = await request(app)
            .post(`/api/notes/${note._id}/restore`)
            .set("Authorization", `Bearer ${testToken}`);

        expect(restoreRes.status).toBe(200);

        const restoredList = await request(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${testToken}`);

        expect(restoredList.body.data.notes.length).toBe(1);
    });

    it("should prevent unauthorized users from accessing or modifying another user's notes", async () => {
        const note = await Note.create({
            userId: testUser._id,
            title: "Private Note",
        });

        const getRes = await request(app)
            .get(`/api/notes/${note._id}`)
            .set("Authorization", `Bearer ${otherToken}`);

        expect(getRes.status).toBe(404);

        const updateRes = await request(app)
            .put(`/api/notes/${note._id}`)
            .set("Authorization", `Bearer ${otherToken}`)
            .send({ title: "Hacked" });

        expect(updateRes.status).toBe(404);
    });

    it("creates owner-scoped nested folders and filters notes by folder ID", async () => {
        const rootResponse = await request(app)
            .post("/api/notes/folders")
            .set("Authorization", `Bearer ${testToken}`)
            .send({ name: "Projects" });

        expect(rootResponse.status).toBe(201);
        const rootFolder = rootResponse.body.data.folder;

        const childResponse = await request(app)
            .post("/api/notes/folders")
            .set("Authorization", `Bearer ${testToken}`)
            .send({ name: "Research", parentId: rootFolder._id });

        expect(childResponse.status).toBe(201);
        expect(childResponse.body.data.folder.parentId).toBe(rootFolder._id);

        const createNoteResponse = await request(app)
            .post("/api/notes/create")
            .set("Authorization", `Bearer ${testToken}`)
            .send({ title: "Reading list", folderId: childResponse.body.data.folder._id });

        expect(createNoteResponse.status).toBe(201);
        expect(createNoteResponse.body.data.note.folderId).toBe(childResponse.body.data.folder._id);

        const listResponse = await request(app)
            .get(`/api/notes?folderId=${childResponse.body.data.folder._id}`)
            .set("Authorization", `Bearer ${testToken}`);

        expect(listResponse.status).toBe(200);
        expect(listResponse.body.data.notes).toHaveLength(1);
        expect(listResponse.body.data.notes[0].title).toBe("Reading list");

        const folderListResponse = await request(app)
            .get("/api/notes/folders")
            .set("Authorization", `Bearer ${testToken}`);

        expect(folderListResponse.body.data.folders).toHaveLength(2);
    });

    it("does not allow one user to create a nested folder under another user's folder", async () => {
        const folder = await Folder.create({ userId: testUser._id, name: "Private" });

        const response = await request(app)
            .post("/api/notes/folders")
            .set("Authorization", `Bearer ${otherToken}`)
            .send({ name: "Attempted access", parentId: folder._id.toString() });

        expect(response.status).toBe(404);
        expect(await Folder.countDocuments({ userId: otherUser._id })).toBe(0);
    });
});

describe("Folder deletion", () => {
    let user, token;
    beforeEach(async () => {
        await User.deleteMany({});
        await Folder.deleteMany({});
        await Note.deleteMany({});
        user = await User.create({ name: "Folder Del", email: `fd-${Date.now()}@test.com`, password: "Password123!" });
        token = createAuthToken(user);
    });

    it("deletes an empty folder", async () => {
        const folder = await Folder.create({ userId: user._id, name: "Empty", parentId: null });
        const res = await request(app).delete(`/api/notes/folders/${folder._id}`).set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(await Folder.exists({ _id: folder._id, userId: user._id })).toBeFalsy();
    });

    it("rejects deleting a non-empty folder with child documents", async () => {
        const folder = await Folder.create({ userId: user._id, name: "NonEmpty", parentId: null });
        await Note.create({ userId: user._id, title: "In folder", folderId: folder._id, isDeleted: false });
        const res = await request(app).delete(`/api/notes/folders/${folder._id}`).set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(400);
        expect(await Folder.exists({ _id: folder._id, userId: user._id })).toBeTruthy();
    });

    it("rejects deleting a non-empty folder with child folders", async () => {
        const parent = await Folder.create({ userId: user._id, name: "Parent", parentId: null });
        await Folder.create({ userId: user._id, name: "Child", parentId: parent._id });
        const res = await request(app).delete(`/api/notes/folders/${parent._id}`).set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(400);
    });

    it("permanently deletes a folder and its nested subfolders and documents recursively", async () => {
        const root = await Folder.create({ userId: user._id, name: "Root", parentId: null });
        const child = await Folder.create({ userId: user._id, name: "Child", parentId: root._id });
        const grandchild = await Folder.create({ userId: user._id, name: "Grandchild", parentId: child._id });

        const doc1 = await Note.create({ userId: user._id, title: "Doc 1", folderId: root._id, isDeleted: false });
        const doc2 = await Note.create({ userId: user._id, title: "Doc 2", folderId: grandchild._id, isDeleted: false });

        const res = await request(app)
            .delete(`/api/notes/folders/${root._id}/permanent`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.deletedFolders).toBe(3);
        expect(res.body.data.deletedNotes).toBe(2);

        // Verify all 3 folders are deleted
        expect(await Folder.countDocuments({ _id: { $in: [root._id, child._id, grandchild._id] } })).toBe(0);
        // Verify both notes are deleted
        expect(await Note.countDocuments({ _id: { $in: [doc1._id, doc2._id] } })).toBe(0);
    });

    it("prevents one user from permanently deleting another user's folder or contents", async () => {
        const otherUser = await User.create({ name: "Victim", email: `victim-${Date.now()}@test.com`, password: "Password123!" });
        const victimFolder = await Folder.create({ userId: otherUser._id, name: "VictimFolder", parentId: null });
        const victimNote = await Note.create({ userId: otherUser._id, title: "VictimNote", folderId: victimFolder._id });

        const res = await request(app)
            .delete(`/api/notes/folders/${victimFolder._id}/permanent`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(await Folder.exists({ _id: victimFolder._id })).toBeTruthy();
        expect(await Note.exists({ _id: victimNote._id })).toBeTruthy();
    });
});

describe("Document folderId update and hierarchy", () => {
    let user, token;
    beforeEach(async () => {
        await User.deleteMany({});
        await Folder.deleteMany({});
        await Note.deleteMany({});
        user = await User.create({ name: "FolderUpdate", email: `fu-${Date.now()}@t.com`, password: "Password123!" });
        token = createAuthToken(user);
    });

    it("moves document folder A -> folder B with ownership check", async () => {
        const a = await Folder.create({ userId: user._id, name: "A", parentId: null });
        const b = await Folder.create({ userId: user._id, name: "B", parentId: null });
        const note = await Note.create({ userId: user._id, title: "Move", folderId: a._id, folder: "A" });
        const res = await request(app).put(`/api/notes/${note._id}`).set("Authorization", `Bearer ${token}`).send({ folderId: b._id.toString() });
        expect(res.status).toBe(200);
        expect(res.body.data.note.folderId.toString()).toBe(b._id.toString());
        expect(res.body.data.note.folder).toBe("B");
    });

    it("moves document to root with folderId null", async () => {
        const f = await Folder.create({ userId: user._id, name: "F", parentId: null });
        const note = await Note.create({ userId: user._id, title: "RootMove", folderId: f._id, folder: "F" });
        const res = await request(app).put(`/api/notes/${note._id}`).set("Authorization", `Bearer ${token}`).send({ folderId: null });
        expect(res.status).toBe(200);
        expect(res.body.data.note.folderId).toBeNull();
    });

    it("omits folderId and keeps folder unchanged", async () => {
        const f = await Folder.create({ userId: user._id, name: "Keep", parentId: null });
        const note = await Note.create({ userId: user._id, title: "Keep", folderId: f._id, folder: "Keep" });
        const res = await request(app).put(`/api/notes/${note._id}`).set("Authorization", `Bearer ${token}`).send({ title: "Keep2" });
        expect(res.status).toBe(200);
        expect(res.body.data.note.folderId.toString()).toBe(f._id.toString());
    });

    it("rejects cross-user folderId update", async () => {
        const other = await User.create({ name: "Other", email: `o-${Date.now()}@t.com`, password: "Password123!" });
        const otherF = await Folder.create({ userId: other._id, name: "OtherF", parentId: null });
        const note = await Note.create({ userId: user._id, title: "X", folderId: null, folder: "General" });
        const res = await request(app).put(`/api/notes/${note._id}`).set("Authorization", `Bearer ${token}`).send({ folderId: otherF._id.toString() });
        expect(res.status).toBe(404);
    });

    it("includes root document and explorer hierarchy", async () => {
        await Note.create({ userId: user._id, title: "RootDoc", folderId: null, folder: "General" });
        const f1 = await Folder.create({ userId: user._id, name: "Parent", parentId: null });
        await Note.create({ userId: user._id, title: "ChildDoc", folderId: f1._id, folder: "Parent" });
        const res = await request(app).get("/api/notes/explorer").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.documents.some(d => d.title === "RootDoc")).toBe(true);
        expect(res.body.data.folders.some(f => f.name === "Parent")).toBe(true);
    });

    it("excludes soft-deleted notes from explorer", async () => {
        const note = await Note.create({ userId: user._id, title: "Del", folderId: null });
        await request(app).delete(`/api/notes/${note._id}`).set("Authorization", `Bearer ${token}`);
        const res = await request(app).get("/api/notes/explorer").set("Authorization", `Bearer ${token}`);
        expect(res.body.data.documents.some(d => d.title === "Del")).toBe(false);
    });

    it("recreates folder after deletion", async () => {
        const f = await Folder.create({ userId: user._id, name: "Re", parentId: null });
        await request(app).delete(`/api/notes/folders/${f._id}`).set("Authorization", `Bearer ${token}`);
        const res = await request(app).post("/api/notes/folders").set("Authorization", `Bearer ${token}`).send({ name: "Re" });
        expect(res.status).toBe(201);
    });

    it("creates deep nesting 3 levels", async () => {
        const a = await Folder.create({ userId: user._id, name: "A", parentId: null });
        const b = await Folder.create({ userId: user._id, name: "B", parentId: a._id });
        const c = await Folder.create({ userId: user._id, name: "C", parentId: b._id });
        expect(c.parentId.toString()).toBe(b._id.toString());
    });

    it("protects against cross-user parentId", async () => {
        const other = await User.create({ name: "O2", email: `o2-${Date.now()}@t.com`, password: "Password123!" });
        const otherF = await Folder.create({ userId: other._id, name: "OtherP", parentId: null });
        const res = await request(app).post("/api/notes/folders").set("Authorization", `Bearer ${token}`).send({ name: "Bad", parentId: otherF._id.toString() });
        expect(res.status).toBe(404);
    });

    it("preserves version/OCC when updating folderId", async () => {
        const f = await Folder.create({ userId: user._id, name: "Ver", parentId: null });
        const note = await Note.create({ userId: user._id, title: "Ver", version: 3, folderId: null });
        const res = await request(app).put(`/api/notes/${note._id}`).set("Authorization", `Bearer ${token}`).send({ folderId: f._id.toString(), expectedVersion: 3 });
        expect(res.status).toBe(200);
        expect(res.body.data.note.version).toBe(4);
    });

    it("replaces stale version with 409 when updating folderId", async () => {
        const f = await Folder.create({ userId: user._id, name: "Stale", parentId: null });
        const note = await Note.create({ userId: user._id, title: "Stale", version: 2, folderId: null });
        const res = await request(app).put(`/api/notes/${note._id}`).set("Authorization", `Bearer ${token}`).send({ folderId: f._id.toString(), expectedVersion: 1 });
        expect(res.status).toBe(409);
    });
});

describe("Notes Search", () => {
    let user, otherUser, token, otherToken;
    beforeEach(async () => {
        await User.deleteMany({});
        await Note.deleteMany({});
        await Folder.deleteMany({});
        user = await User.create({ name: "SearchUser", email: `su-${Date.now()}@t.com`, password: "Password123!" });
        otherUser = await User.create({ name: "OtherSearchUser", email: `osu-${Date.now()}@t.com`, password: "Password123!" });
        token = createAuthToken(user);
        otherToken = createAuthToken(otherUser);
    });

    it("searches documents by title and content using text index", async () => {
        await Note.create({ userId: user._id, title: "Architecture Roadmap", content: "Microservices and monorepos" });
        await Note.create({ userId: user._id, title: "Unrelated Note", content: "Random thoughts about coffee" });
        await Note.create({ userId: user._id, title: "Deployment Guide", content: "Kubernetes cluster setup" });

        // Search by title keyword
        const resTitle = await request(app).get("/api/notes?search=Roadmap").set("Authorization", `Bearer ${token}`);
        expect(resTitle.status).toBe(200);
        expect(resTitle.body.data.notes).toHaveLength(1);
        expect(resTitle.body.data.notes[0].title).toBe("Architecture Roadmap");

        // Search by content keyword
        const resContent = await request(app).get("/api/notes?search=Kubernetes").set("Authorization", `Bearer ${token}`);
        expect(resContent.status).toBe(200);
        expect(resContent.body.data.notes).toHaveLength(1);
        expect(resContent.body.data.notes[0].title).toBe("Deployment Guide");
    });

    it("enforces strict user-scoped isolation in search", async () => {
        await Note.create({ userId: user._id, title: "Secret Architecture", content: "Confidential plan" });
        await Note.create({ userId: otherUser._id, title: "Secret Architecture", content: "Other user confidential plan" });

        const res = await request(app).get("/api/notes?search=Secret").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.notes).toHaveLength(1);
        expect(res.body.data.notes[0].userId.toString()).toBe(user._id.toString());
        expect(res.body.data.notes[0].content).toBe("Confidential plan");
    });

    it("excludes soft-deleted notes from search results", async () => {
        const note = await Note.create({ userId: user._id, title: "Deleted Architecture", content: "Old plan" });
        await request(app).delete(`/api/notes/${note._id}`).set("Authorization", `Bearer ${token}`);

        const res = await request(app).get("/api/notes?search=Architecture").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.notes).toHaveLength(0);
    });
});

