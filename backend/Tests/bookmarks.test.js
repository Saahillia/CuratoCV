/**
 * Bookmarks backend verification: creation, duplicate prevention,
 * list per note/global, delete by id/location, ownership/IDOR.
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import User from "../../platform/backend/src/models/User.js";
import Note from "../../memo/backend/src/models/Note.js";
import Bookmark from "../../memo/backend/src/models/Bookmark.js";
import notesRouter from "../../memo/backend/src/routes/notesRoutes.js";
import errorMiddleware from "../../platform/backend/src/middlewares/errorMiddleware.js";
import { createAuthToken } from "./factories.js";

const app = express();
app.use(express.json());
app.use("/api/notes", notesRouter);
app.use(errorMiddleware);

describe("Bookmark backend verification", () => {
    let testUser, otherUser, testToken, otherToken, testNote;

    beforeEach(async () => {
        await User.deleteMany({});
        await Note.deleteMany({});
        await Bookmark.deleteMany({});

        testUser = await User.create({
            name: "Bookmark Tester",
            email: `bookmarks-tester-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });
        otherUser = await User.create({
            name: "Bookmark Other",
            email: `bookmarks-other-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });
        testToken = createAuthToken(testUser);
        otherToken = createAuthToken(otherUser);

        testNote = await Note.create({ userId: testUser._id, title: "Bookmark Note", content: "Some long content to bookmark" });
    });

    it("should create a bookmark for the user's own note with content anchor", async () => {
        const res = await request(app)
            .post(`/api/notes/${testNote._id}/bookmarks`)
            .set("Authorization", `Bearer ${testToken}`)
            .send({ anchorText: "Some long content", startOffset: 0, title: "Intro", snippet: "First sentence" });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.bookmark.noteId.toString()).toBe(testNote._id.toString());
        expect(res.body.data.bookmark.anchorText).toBe("Some long content");
    });

    it("should reject duplicate bookmark at same anchor location", async () => {
        await Bookmark.create({ userId: testUser._id, noteId: testNote._id, anchorText: "Section A", startOffset: 120, title: "Dup" });
        const res = await request(app)
            .post(`/api/notes/${testNote._id}/bookmarks`)
            .set("Authorization", `Bearer ${testToken}`)
            .send({ anchorText: "Section A", startOffset: 120 });
        expect(res.status).toBe(409);
    });

    it("should list bookmarks for a note", async () => {
        await Bookmark.create({ userId: testUser._id, noteId: testNote._id, anchorText: "Heading 1", startOffset: 0 });
        const res = await request(app)
            .get(`/api/notes/${testNote._id}/bookmarks`)
            .set("Authorization", `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.bookmarks.length).toBe(1);
        expect(res.body.data.bookmarks[0].anchorText).toBe("Heading 1");
    });

    it("should list all user bookmarks globally", async () => {
        await Bookmark.create({ userId: testUser._id, noteId: testNote._id, anchorText: "Global Section", startOffset: 0, title: "Global" });
        const res = await request(app)
            .get("/api/notes/bookmarks")
            .set("Authorization", `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.bookmarks.length).toBe(1);
    });

    it("should delete bookmark by id", async () => {
        const bm = await Bookmark.create({ userId: testUser._id, noteId: testNote._id, anchorText: "Delete Me", startOffset: 50 });
        const res = await request(app)
            .delete(`/api/notes/bookmarks/${bm._id}`)
            .set("Authorization", `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(await Bookmark.findById(bm._id)).toBeNull();
    });

    it("should delete bookmark by location (anchorText + startOffset)", async () => {
        await Bookmark.create({ userId: testUser._id, noteId: testNote._id, anchorText: "Location Target", startOffset: 50 });
        const res = await request(app)
            .delete(`/api/notes/${testNote._id}/bookmarks?anchorText=Location%20Target&startOffset=50`)
            .set("Authorization", `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(await Bookmark.findOne({ userId: testUser._id, noteId: testNote._id, anchorText: "Location Target" })).toBeNull();
    });

    it("should enforce note ownership (cross-user IDOR) on bookmark creation", async () => {
        const res = await request(app)
            .post(`/api/notes/${testNote._id}/bookmarks`)
            .set("Authorization", `Bearer ${otherToken}`)
            .send({ anchorText: "Unauthorized Anchor", startOffset: 0 });
        expect(res.status).toBe(404);
    });

    it("should enforce bookmark ownership on delete", async () => {
        const otherNote = await Note.create({ userId: otherUser._id, title: "Other Note" });
        const bm = await Bookmark.create({ userId: otherUser._id, noteId: otherNote._id, anchorText: "Other Anchor", startOffset: 0 });
        const res = await request(app)
            .delete(`/api/notes/bookmarks/${bm._id}`)
            .set("Authorization", `Bearer ${testToken}`);
        expect(res.status).toBe(404);
    });

    it("should allow multiple bookmarks per document at different anchor locations", async () => {
        await Bookmark.create({ userId: testUser._id, noteId: testNote._id, anchorText: "Point A", startOffset: 0 });
        await Bookmark.create({ userId: testUser._id, noteId: testNote._id, anchorText: "Point B", startOffset: 300 });
        const res = await request(app)
            .get(`/api/notes/${testNote._id}/bookmarks`)
            .set("Authorization", `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.bookmarks.length).toBe(2);
    });

    it("should reject bookmark creation with invalid document id", async () => {
        const res = await request(app)
            .post("/api/notes/invalidid/bookmarks")
            .set("Authorization", `Bearer ${testToken}`)
            .send({ anchorText: "Test Anchor" });
        expect(res.status).toBe(400);
    });
});
