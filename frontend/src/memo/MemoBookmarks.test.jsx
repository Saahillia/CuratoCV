import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MemoEditor from "@curatocv/memo-frontend/pages/MemoEditor";

const { apiGet, apiPost, apiPut, apiDelete } = vi.hoisted(() => ({
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPut: vi.fn(),
    apiDelete: vi.fn(),
}));

vi.mock("@curatocv/api-client", () => ({
    default: {
        get: apiGet,
        post: apiPost,
        put: apiPut,
        delete: apiDelete,
    },
}));

vi.mock("react-redux", () => ({
    useSelector: (select) => select({ auth: { user: { name: "Saahil Lia", email: "saahil@example.com" } } }),
    useDispatch: () => vi.fn(),
}));

const mockNote = {
    _id: "60d0fe4f5311236168a109ca",
    title: "Testing Architecture Note",
    content: "Introduction to resilient software systems and stable bookmarking anchors.",
};

const mockBookmarks = [
    {
        _id: "bm-1",
        noteId: { _id: "60d0fe4f5311236168a109ca", title: "Testing Architecture Note" },
        anchorText: "Introduction to resilient software",
        startOffset: 0,
        title: "Introduction",
        snippet: "Introduction to resilient...",
        createdAt: new Date().toISOString(),
    },
];

describe("MemoEditor Bookmarking & Center", () => {
    beforeEach(() => {
        apiGet.mockReset();
        apiPost.mockReset();
        apiPut.mockReset();
        apiDelete.mockReset();

        apiGet.mockImplementation((path) => {
            if (path === `/notes/${mockNote._id}`) {
                return Promise.resolve({
                    data: { data: { note: mockNote } },
                });
            }
            if (path === "/notes/bookmarks") {
                return Promise.resolve({
                    data: { data: { bookmarks: mockBookmarks } },
                });
            }
            return Promise.resolve({ data: {} });
        });
    });

    const renderEditor = () =>
        render(
            <MemoryRouter initialEntries={[`/products/memo/editor?id=${mockNote._id}`]}>
                <Routes>
                    <Route path="/products/memo/editor" element={<MemoEditor />} />
                </Routes>
            </MemoryRouter>
        );

    it("renders document and loads existing bookmark ribbon active state", async () => {
        renderEditor();

        await waitFor(() => {
            expect(screen.getByDisplayValue(mockNote.content)).toBeDefined();
        });

        // The ribbon button should exist and have pressed state active
        const ribbon = screen.getByRole("button", { name: /Remove bookmark for Page 1/i });
        expect(ribbon).toBeDefined();
        expect(ribbon.getAttribute("aria-pressed")).toBe("true");
    });

    it("toggles bookmark deletion optimistically when active ribbon is clicked", async () => {
        apiDelete.mockResolvedValueOnce({ data: { success: true } });
        renderEditor();

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Remove bookmark for Page 1/i })).toBeDefined();
        });

        const ribbon = screen.getByRole("button", { name: /Remove bookmark for Page 1/i });
        fireEvent.click(ribbon);

        // Optimistically toggled to inactive
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Bookmark Page 1/i })).toBeDefined();
        });

        expect(apiDelete).toHaveBeenCalledWith(`/notes/bookmarks/${mockBookmarks[0]._id}`);
    });

    it("opens Bookmark Center sidepane and lists bookmarks", async () => {
        renderEditor();

        await waitFor(() => {
            expect(screen.getByTitle("Bookmark Center")).toBeDefined();
        });

        // Click tool switcher for Bookmarks
        fireEvent.click(screen.getByTitle("Bookmark Center"));

        await waitFor(() => {
            expect(screen.getByText("Bookmark Center")).toBeDefined();
            expect(screen.getByText("Introduction")).toBeDefined();
            expect(screen.getByText(/Current note/i)).toBeDefined();
        });
    });

    it("handles bookmark click navigation and highlight trigger in Bookmark Center", async () => {
        renderEditor();

        fireEvent.click(screen.getByTitle("Bookmark Center"));

        await waitFor(() => {
            expect(screen.getByText("Introduction")).toBeDefined();
        });

        // Click bookmark item
        fireEvent.click(screen.getByText("Introduction"));

        // Content should be focused
        const textarea = screen.getByPlaceholderText("Start typing your memo or notes here...");
        expect(document.activeElement === textarea).toBe(true);
    });

    it("optimistically deletes bookmark from Bookmark Center sidepane", async () => {
        apiDelete.mockResolvedValueOnce({ data: { success: true } });
        renderEditor();

        fireEvent.click(screen.getByTitle("Bookmark Center"));

        await waitFor(() => {
            expect(screen.getByTitle("Delete bookmark")).toBeDefined();
        });

        const deleteBtn = screen.getByTitle("Delete bookmark");
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(screen.getByText("No bookmarks yet")).toBeDefined();
        });

        expect(apiDelete).toHaveBeenCalledWith(`/notes/bookmarks/${mockBookmarks[0]._id}`);
    });
});
