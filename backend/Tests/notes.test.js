import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import User from "../../platform/backend/src/models/User.js";
import Note from "../../notes/backend/src/models/Note.js";
import notesRouter from "../../notes/backend/src/routes/notesRoutes.js";
import errorMiddleware from "../../platform/backend/src/middlewares/errorMiddleware.js";

// Mock auth middleware to inject req.userId from header for targeted testing
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    req.userId = req.headers["x-user-id"];
    next();
});

// Mount the controller/route logic
app.use("/api/notes", notesRouter);
app.use(errorMiddleware);

describe("Notes Foundation & API Verification", () => {
    let testUser;
    let otherUser;

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
    });

    it("should create a new note with valid payload", async () => {
        const response = await request(app)
            .post("/api/notes/create")
            .set("x-user-id", testUser._id.toString())
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
            .set("x-user-id", testUser._id.toString());

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
            .set("x-user-id", testUser._id.toString())
            .send({
                title: "Updated Title",
                expectedVersion: 1,
            });

        expect(update1.status).toBe(200);
        expect(update1.body.data.note.version).toBe(2);

        // Second update with stale version
        const update2 = await request(app)
            .put(`/api/notes/${note._id}`)
            .set("x-user-id", testUser._id.toString())
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
            .set("x-user-id", testUser._id.toString());

        expect(delRes.status).toBe(200);

        // Verify it doesn't show in standard list
        const listRes = await request(app)
            .get("/api/notes")
            .set("x-user-id", testUser._id.toString());

        expect(listRes.body.data.notes.length).toBe(0);

        // Restore
        const restoreRes = await request(app)
            .post(`/api/notes/${note._id}/restore`)
            .set("x-user-id", testUser._id.toString());

        expect(restoreRes.status).toBe(200);

        const restoredList = await request(app)
            .get("/api/notes")
            .set("x-user-id", testUser._id.toString());

        expect(restoredList.body.data.notes.length).toBe(1);
    });

    it("should prevent unauthorized users from accessing or modifying another user's notes", async () => {
        const note = await Note.create({
            userId: testUser._id,
            title: "Private Note",
        });

        const getRes = await request(app)
            .get(`/api/notes/${note._id}`)
            .set("x-user-id", otherUser._id.toString());

        expect(getRes.status).toBe(404);

        const updateRes = await request(app)
            .put(`/api/notes/${note._id}`)
            .set("x-user-id", otherUser._id.toString())
            .send({ title: "Hacked" });

        expect(updateRes.status).toBe(404);
    });
});
