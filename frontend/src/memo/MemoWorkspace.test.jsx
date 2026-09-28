import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MemoWorkspace from "@curatocv/memo-frontend/pages/MemoWorkspace";

const { apiGet, apiPost } = vi.hoisted(() => ({
    apiGet: vi.fn(),
    apiPost: vi.fn(),
}));

vi.mock("@curatocv/api-client", () => ({
    default: {
        get: apiGet,
        post: apiPost,
    },
}));

vi.mock("react-redux", () => ({
    useSelector: (select) => select({ auth: { user: { name: "Saahil Lia", email: "saahil@example.com" } } }),
    useDispatch: () => vi.fn(),
}));

const configureApi = ({ folders = [], legacyFolders = [], notes = [] } = {}) => {
    apiGet.mockImplementation((path) => {
        if (path === "/notes/folders") {
            return Promise.resolve({
                data: {
                    data: { folders, legacyFolders },
                },
            });
        }
        if (path === "/notes/explorer") {
            return Promise.resolve({
                data: {
                    data: {
                        folders: folders.map(f => ({ _id: f._id, name: f.name, parentId: f.parentId || null })),
                        documents: notes.map(n => ({ _id: n._id, title: n.title, folderId: n.folderId || null, folder: n.folder || "General", updatedAt: n.updatedAt || n.createdAt })),
                    },
                },
            });
        }
        return Promise.resolve({
            data: {
                data: { notes, total: notes.length, page: 1, pages: 1 },
            },
        });
    });
};

describe("MemoWorkspace", () => {
    beforeEach(() => {
        apiGet.mockReset();
        apiPost.mockReset();
        configureApi();
    });

    const renderWorkspace = () => render(
        <MemoryRouter>
            <MemoWorkspace />
        </MemoryRouter>,
    );

    it("uses the shared brand and provides a responsive folder sidebar", async () => {
        configureApi({
            folders: [
                { _id: "folder-projects", name: "Projects", parentId: null },
                { _id: "folder-research", name: "Research", parentId: "folder-projects" },
            ],
            legacyFolders: ["General"],
        });
        renderWorkspace();

        expect(screen.getByRole("link", { name: "CuratoCV home" })).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Memo", level: 1 })).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Think it. Save it. Find it again." })).toBeTruthy();
        expect(screen.getAllByRole("link", { name: "Products" })).toHaveLength(2);
        expect(document.querySelector('nav[aria-label="Memo actions"] a svg')?.classList.contains("lucide-arrow-left")).toBe(true);
        expect(screen.getByRole("complementary", { name: "Memo workspace roadmap" }).className).toContain("memo-workspace-roadmap");
        expect(await screen.findByRole("button", { name: "General" })).toBeTruthy();
        expect(screen.getByRole("complementary", { name: "Folder sidebar" }).className).toContain("hidden");
        const explorer = screen.getByRole("navigation", { name: "Memo Explorer" });
        const explorerToolbar = screen.getByRole("toolbar", { name: "Memo Explorer actions" });
        expect(within(explorerToolbar).getByRole("button", { name: "New Folder" }).getAttribute("title")).toBeNull();
        expect(within(explorerToolbar).getByRole("tooltip", { name: "New Folder" })).toBeTruthy();
        expect(within(explorerToolbar).getByRole("button", { name: "New File" })).toBeTruthy();
        expect(within(explorerToolbar).getByRole("button", { name: "Refresh Explorer" })).toBeTruthy();
        expect(within(explorerToolbar).getByRole("button", { name: "Collapse All Folders" })).toBeTruthy();
        expect(within(explorer).getByRole("button", { name: "Collapse Projects" }).getAttribute("aria-expanded")).toBe("true");
        fireEvent.click(within(explorerToolbar).getByRole("button", { name: "Collapse All Folders" }));
        expect(within(explorer).getByRole("button", { name: "Expand Projects" }).getAttribute("aria-expanded")).toBe("false");
        fireEvent.click(within(explorerToolbar).getByRole("button", { name: "Refresh Explorer" }));
        await waitFor(() => expect(apiGet.mock.calls.filter(([path]) => path === "/notes/folders").length).toBeGreaterThan(1));

        fireEvent.click(screen.getByRole("button", { name: "Open Memo folder sidebar" }));
        const mobileSidebar = screen.getByRole("dialog", { name: "Memo folder sidebar" });
        expect(within(mobileSidebar).getByRole("button", { name: "General" })).toBeTruthy();

        fireEvent.click(within(mobileSidebar).getByRole("button", { name: "Close folder sidebar" }));
        expect(screen.queryByRole("dialog", { name: "Memo folder sidebar" })).toBeNull();
    });

    it("loads documents using the existing notes API and shows title, preview, and creation time", async () => {
        const createdAt = "2026-02-10T08:30:00.000Z";
        configureApi({
            notes: [{
                _id: "note-1",
                title: "Project ideas",
                folder: "General",
                content: "A short document preview",
                createdAt,
            }],
        });

        renderWorkspace();

        expect(await screen.findByRole("heading", { name: "Project ideas" })).toBeTruthy();
        expect(screen.getAllByText("A short document preview")[0]).toBeTruthy();
        expect(screen.getByRole("navigation", { name: "Memo Explorer" }).querySelector('button[title="Project ideas"]')).toBeTruthy();
        expect(document.querySelector(`time[datetime="${createdAt}"]`)?.textContent).toBe(
            new Date(createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
        );
        expect(apiGet).toHaveBeenCalledWith("/notes", expect.objectContaining({
            params: { page: 1, limit: 20 },
            signal: expect.any(AbortSignal),
        }));
    });

    it("opens the Platform account menu with profile settings and billing routes", async () => {
        renderWorkspace();

        fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
        const accountMenu = screen.getByRole("menu", { name: "Account options" });
        expect(within(accountMenu).getByText("Saahil Lia")).toBeTruthy();
        expect(within(accountMenu).getByRole("menuitem", { name: "Profile & settings" }).getAttribute("href")).toBe("/app/profile");
        expect(within(accountMenu).getByRole("menuitem", { name: "Billing" }).getAttribute("href")).toBe("/app/billing");

        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("menu", { name: "Account options" })).toBeNull();
    });

    it("tracks folder and file navigation in clickable breadcrumbs", async () => {
        configureApi({
            folders: [
                { _id: "folder-projects", name: "Projects", parentId: null },
                { _id: "folder-research", name: "Research", parentId: "folder-projects" },
            ],
            notes: [{
                _id: "note-research",
                title: "Interview notes",
                content: "Prepare examples",
                folder: "Research",
                folderId: "folder-research",
                createdAt: "2026-04-04T10:00:00.000Z",
            }],
        });
        renderWorkspace();

        const explorer = screen.getByRole("navigation", { name: "Memo Explorer" });
        fireEvent.click(await within(explorer).findByRole("button", { name: "Expand Research" }));
        fireEvent.click(await within(explorer).findByRole("button", { name: "Interview notes" }));

        const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
        expect(breadcrumb.textContent).toContain("Projects");
        expect(breadcrumb.textContent).toContain("Research");
        expect(breadcrumb.textContent).toContain("Interview notes");
        expect(within(breadcrumb).getByText("Interview notes").getAttribute("aria-current")).toBe("page");

        fireEvent.click(within(breadcrumb).getByRole("button", { name: "Projects" }));
        expect(await screen.findByRole("heading", { name: "Projects" })).toBeTruthy();
        expect(within(breadcrumb).queryByText("Interview notes")).toBeNull();
    });

    it("creates a root folder from the Explorer toolbar and selects it", async () => {
        apiPost.mockResolvedValue({
            data: { data: { folder: { _id: "folder-1", name: "Interview prep", parentId: null } } },
        });
        renderWorkspace();

        const explorerToolbar = screen.getByRole("toolbar", { name: "Memo Explorer actions" });
        fireEvent.click(within(explorerToolbar).getByRole("button", { name: "New Folder" }));

        const inlineInput = await screen.findByRole("textbox", { name: "New folder name" });
        fireEvent.change(inlineInput, { target: { value: "Interview prep" } });
        fireEvent.keyDown(inlineInput, { key: "Enter", code: "Enter" });

        await waitFor(() => expect(apiPost).toHaveBeenCalledWith("/notes/folders", { name: "Interview prep" }));
        expect(await screen.findByRole("heading", { name: "Interview prep" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Interview prep" }).getAttribute("aria-current")).toBe("page");
    });

    it("creates a nested folder under the currently selected folder", async () => {
        configureApi({ folders: [{ _id: "folder-parent", name: "Projects", parentId: null }] });
        apiPost.mockResolvedValue({
            data: { data: { folder: { _id: "folder-child", name: "Research", parentId: "folder-parent" } } },
        });
        renderWorkspace();

        fireEvent.click(await screen.findByRole("button", { name: "Projects" }));
        const explorerToolbar = screen.getByRole("toolbar", { name: "Memo Explorer actions" });
        fireEvent.click(within(explorerToolbar).getByRole("button", { name: "New Folder" }));

        const inlineInput = await screen.findByRole("textbox", { name: "New folder name" });
        fireEvent.change(inlineInput, { target: { value: "Research" } });
        fireEvent.keyDown(inlineInput, { key: "Enter", code: "Enter" });

        await waitFor(() => expect(apiPost).toHaveBeenCalledWith("/notes/folders", {
            name: "Research",
            parentId: "folder-parent",
        }));
        expect(await screen.findByRole("button", { name: "Research" })).toBeTruthy();
    });

    it("creates a document in the selected folder and navigates to editor", async () => {
        const folder = { _id: "folder-1", name: "Plans", parentId: null };
        configureApi({ folders: [folder] });
        apiPost.mockResolvedValue({ data: { success: true, data: { note: { _id: "note-new-123" } } } });

        renderWorkspace();
        fireEvent.click(await screen.findByRole("button", { name: "Plans" }));
        const explorerToolbar = screen.getByRole("toolbar", { name: "Memo Explorer actions" });
        fireEvent.click(within(explorerToolbar).getByRole("button", { name: "New File" }));

        const inlineInput = await screen.findByRole("textbox", { name: "New file name" });
        fireEvent.change(inlineInput, { target: { value: "Launch plan" } });
        fireEvent.keyDown(inlineInput, { key: "Enter", code: "Enter" });

        await waitFor(() => expect(apiPost).toHaveBeenCalledWith("/notes/create", {
            title: "Launch plan",
            content: "",
            folderId: "folder-1",
        }));
    });

    it("shows a recoverable document-load failure", async () => {
        apiGet.mockImplementation((path) => path === "/notes/folders"
            ? Promise.resolve({ data: { data: { folders: [], legacyFolders: [] } } })
            : Promise.reject(new Error("Service unavailable")));

        renderWorkspace();

        const alerts = await screen.findAllByRole("alert");
        expect(alerts.some((alert) => alert.textContent.includes("Service unavailable"))).toBe(true);
        expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    });

    // ── Hierarchical tree rendering ──────────────────────────────────────────

    it("Case 1: renders a document directly under its parent folder, not after the tree", async () => {
        // Structure: Root > Folder A > Document A
        configureApi({
            folders: [{ _id: "folder-a", name: "Folder A", parentId: null }],
            notes: [{ _id: "doc-a", title: "Document A", folderId: "folder-a", folder: "Folder A", content: "", createdAt: "2026-01-01T00:00:00.000Z" }],
        });
        renderWorkspace();

        const explorer = screen.getByRole("navigation", { name: "Memo Explorer" });

        // Folder A must be visible with an expand chevron (it has a child document)
        const folderABtn = await within(explorer).findByRole("button", { name: "Folder A" });
        expect(folderABtn).toBeTruthy();

        // Expand Folder A
        const expandBtn = within(explorer).getByRole("button", { name: /Expand Folder A|Collapse Folder A/ });
        if (expandBtn.getAttribute("aria-expanded") === "false") {
            fireEvent.click(expandBtn);
        }

        // Document A must appear inside the explorer nav, directly under Folder A — not at root
        const docBtn = await within(explorer).findByTitle("Document A");
        expect(docBtn).toBeTruthy();

        // Verify Document A is not a sibling of Folder A at the same list level:
        // Document A's <li> must be a descendant of Folder A's <li>, not a sibling
        const folderALi = folderABtn.closest("li");
        expect(folderALi.contains(docBtn)).toBe(true);
    });

    it("Case 2: renders a document under a deeply nested folder (grandchild)", async () => {
        // Structure: Root > Folder A > Folder B > Document B
        configureApi({
            folders: [
                { _id: "folder-a", name: "Folder A", parentId: null },
                { _id: "folder-b", name: "Folder B", parentId: "folder-a" },
            ],
            notes: [{ _id: "doc-b", title: "Document B", folderId: "folder-b", folder: "Folder B", content: "", createdAt: "2026-01-01T00:00:00.000Z" }],
        });
        renderWorkspace();

        const explorer = screen.getByRole("navigation", { name: "Memo Explorer" });

        // Expand Folder A to reveal Folder B
        const expandA = await within(explorer).findByRole("button", { name: /Expand Folder A|Collapse Folder A/ });
        if (expandA.getAttribute("aria-expanded") === "false") fireEvent.click(expandA);

        // Expand Folder B to reveal Document B
        const expandB = await within(explorer).findByRole("button", { name: /Expand Folder B|Collapse Folder B/ });
        if (expandB.getAttribute("aria-expanded") === "false") fireEvent.click(expandB);

        // Document B must be nested inside Folder B's <li>
        const docBtn = await within(explorer).findByTitle("Document B");
        const folderBBtn = within(explorer).getByRole("button", { name: "Folder B" });
        const folderBLi = folderBBtn.closest("li");
        expect(folderBLi.contains(docBtn)).toBe(true);

        // Document B must NOT be at the root level (not a direct child of the root <ul>)
        const folderABtn = within(explorer).getByRole("button", { name: "Folder A" });
        const folderALi = folderABtn.closest("li");
        // Folder B is inside Folder A, and Document B is inside Folder B
        expect(folderALi.contains(folderBLi)).toBe(true);
        expect(folderBLi.contains(docBtn)).toBe(true);
    });

    it("Case 3: folders and documents that share a parent are siblings in one unified list", async () => {
        // Structure:
        //   Root > Folder A > Folder B > Document B
        //                   > Document A
        //        > Document Root
        configureApi({
            folders: [
                { _id: "folder-a", name: "Folder A", parentId: null },
                { _id: "folder-b", name: "Folder B", parentId: "folder-a" },
            ],
            notes: [
                { _id: "doc-b", title: "Document B", folderId: "folder-b", folder: "Folder B", content: "", createdAt: "2026-01-01T00:00:00.000Z" },
                { _id: "doc-a", title: "Document A", folderId: "folder-a", folder: "Folder A", content: "", createdAt: "2026-01-01T00:00:00.000Z" },
                { _id: "doc-root", title: "Document Root", folderId: null, folder: "", content: "", createdAt: "2026-01-01T00:00:00.000Z" },
            ],
        });
        renderWorkspace();

        const explorer = screen.getByRole("navigation", { name: "Memo Explorer" });

        // Expand Folder A
        const expandA = await within(explorer).findByRole("button", { name: /Expand Folder A|Collapse Folder A/ });
        if (expandA.getAttribute("aria-expanded") === "false") fireEvent.click(expandA);

        // Expand Folder B
        const expandB = await within(explorer).findByRole("button", { name: /Expand Folder B|Collapse Folder B/ });
        if (expandB.getAttribute("aria-expanded") === "false") fireEvent.click(expandB);

        const folderABtn = within(explorer).getByRole("button", { name: "Folder A" });
        const folderBBtn = within(explorer).getByRole("button", { name: "Folder B" });
        const folderALi = folderABtn.closest("li");
        const folderBLi = folderBBtn.closest("li");
        const docABtn = await within(explorer).findByTitle("Document A");
        const docBBtn = await within(explorer).findByTitle("Document B");
        const docRootBtn = await within(explorer).findByTitle("Document Root");

        // Folder B and Document A are both direct children of Folder A's subtree
        expect(folderALi.contains(folderBLi)).toBe(true);
        expect(folderALi.contains(docABtn)).toBe(true);

        // Document B is inside Folder B, not escaping to a higher level
        expect(folderBLi.contains(docBBtn)).toBe(true);

        // Document A must NOT be inside Folder B
        expect(folderBLi.contains(docABtn)).toBe(false);

        // Document Root is at root level — not inside Folder A
        expect(folderALi.contains(docRootBtn)).toBe(false);
    });

    it("Case 4: creation order does not affect hierarchy — documents land under their declared folderId", async () => {
        // All items created in this order, but hierarchy determined by parentId/folderId:
        //   Folder A (root), Folder B (inside A), Document B (inside B), Document A (inside A), Document Root (root)
        configureApi({
            folders: [
                { _id: "fa", name: "A", parentId: null },
                { _id: "fb", name: "B", parentId: "fa" },
            ],
            notes: [
                // Created last but belongs at root
                { _id: "d-root", title: "Doc Root", folderId: null, folder: "", content: "", createdAt: "2026-01-05T00:00:00.000Z" },
                // Created second-last but belongs under A
                { _id: "d-a", title: "Doc A", folderId: "fa", folder: "A", content: "", createdAt: "2026-01-04T00:00:00.000Z" },
                // Created first but belongs under B
                { _id: "d-b", title: "Doc B", folderId: "fb", folder: "B", content: "", createdAt: "2026-01-03T00:00:00.000Z" },
            ],
        });
        renderWorkspace();

        const explorer = screen.getByRole("navigation", { name: "Memo Explorer" });

        // Expand A then B
        const expA = await within(explorer).findByRole("button", { name: /Expand A|Collapse A/ });
        if (expA.getAttribute("aria-expanded") === "false") fireEvent.click(expA);
        const expB = await within(explorer).findByRole("button", { name: /Expand B|Collapse B/ });
        if (expB.getAttribute("aria-expanded") === "false") fireEvent.click(expB);

        const btnA = within(explorer).getByRole("button", { name: "A" });
        const btnB = within(explorer).getByRole("button", { name: "B" });
        const liA = btnA.closest("li");
        const liB = btnB.closest("li");
        const docABtn = await within(explorer).findByTitle("Doc A");
        const docBBtn = await within(explorer).findByTitle("Doc B");
        const docRootBtn = await within(explorer).findByTitle("Doc Root");

        // Doc B must be inside folder B's li
        expect(liB.contains(docBBtn)).toBe(true);
        // Doc A must be inside folder A's li but NOT inside folder B's li
        expect(liA.contains(docABtn)).toBe(true);
        expect(liB.contains(docABtn)).toBe(false);
        // Doc Root must NOT be inside folder A's li
        expect(liA.contains(docRootBtn)).toBe(false);
    });

    describe("Memo Workspace Hybrid Search", () => {
        it("renders accessible search input in the sidebar", () => {
            renderWorkspace();
            const searchInputs = screen.getAllByRole("searchbox", { name: "Search folders and documents" });
            expect(searchInputs.length).toBeGreaterThan(0);
            expect(searchInputs[0].getAttribute("placeholder")).toBe("Search folders and documents...");
        });

        it("filters folders client-side based on search term", async () => {
            configureApi({
                folders: [
                    { _id: "folder-arch", name: "Architecture", parentId: null },
                    { _id: "folder-rand", name: "Random Notes", parentId: null },
                ],
            });
            renderWorkspace();

            const searchInput = (await screen.findAllByRole("searchbox", { name: "Search folders and documents" }))[0];
            fireEvent.change(searchInput, { target: { value: "Arch" } });

            const searchRegions = await screen.findAllByRole("region", { name: "Search results" });
            expect(searchRegions.length).toBeGreaterThan(0);
            expect(within(searchRegions[0]).getByText("Architecture")).toBeTruthy();
            expect(within(searchRegions[0]).queryByText("Random Notes")).toBeNull();
        });

        it("calls debounced backend search API and renders matching documents", async () => {
            configureApi({
                notes: [
                    { _id: "doc-1", title: "Microservices Guide", folderId: null, content: "Backend guide", createdAt: "2026-01-01T00:00:00.000Z" },
                ],
            });
            renderWorkspace();

            const searchInput = (await screen.findAllByRole("searchbox", { name: "Search folders and documents" }))[0];
            fireEvent.change(searchInput, { target: { value: "Microservices" } });

            await waitFor(() => {
                expect(apiGet).toHaveBeenCalledWith(
                    expect.stringContaining("/notes?search=Microservices"),
                    expect.objectContaining({ signal: expect.any(AbortSignal) })
                );
            });

            const searchRegions = await screen.findAllByRole("region", { name: "Search results" });
            expect(within(searchRegions[0]).getByText("Microservices Guide")).toBeTruthy();
        });

        it("handles loading and error states during search", async () => {
            let rejectFn;
            apiGet.mockImplementation((path) => {
                if (path.startsWith("/notes?search=")) {
                    return new Promise((_res, rej) => {
                        rejectFn = () => rej({ response: { data: { message: "Search service unavailable" } } });
                    });
                }
                if (path === "/notes/folders" || path === "/notes/explorer") {
                    return Promise.resolve({ data: { data: { folders: [], documents: [], legacyFolders: [] } } });
                }
                return Promise.resolve({ data: { data: { notes: [], total: 0 } } });
            });

            renderWorkspace();
            const searchInput = (await screen.findAllByRole("searchbox", { name: "Search folders and documents" }))[0];
            fireEvent.change(searchInput, { target: { value: "Test" } });

            expect(await screen.findByLabelText("Loading search results")).toBeTruthy();

            await waitFor(() => expect(rejectFn).toBeDefined());
            rejectFn();

            expect(await screen.findByRole("alert")).toBeTruthy();
            expect(screen.getByText("Search service unavailable")).toBeTruthy();
        });

        it("shows empty state when no folders or documents match", async () => {
            apiGet.mockImplementation((path) => {
                if (path.startsWith("/notes?search=")) {
                    return Promise.resolve({ data: { data: { notes: [] } } });
                }
                return Promise.resolve({ data: { data: { folders: [], documents: [], notes: [] } } });
            });

            renderWorkspace();
            const searchInput = (await screen.findAllByRole("searchbox", { name: "Search folders and documents" }))[0];
            fireEvent.change(searchInput, { target: { value: "NonExistentTerm" } });

            expect(await screen.findByText("No matching folders or documents found.")).toBeTruthy();
        });

        it("deduplicates documents appearing in both local explorer and backend results", async () => {
            const sharedDoc = { _id: "doc-shared", title: "Shared Doc", folderId: null, createdAt: "2026-01-01T00:00:00.000Z" };
            configureApi({
                notes: [sharedDoc],
            });
            apiGet.mockImplementation((path) => {
                if (path === "/notes/explorer") {
                    return Promise.resolve({ data: { data: { folders: [], documents: [sharedDoc] } } });
                }
                if (path.startsWith("/notes?search=")) {
                    return Promise.resolve({ data: { data: { notes: [sharedDoc] } } });
                }
                return Promise.resolve({ data: { data: { folders: [], notes: [sharedDoc] } } });
            });

            renderWorkspace();
            const searchInput = (await screen.findAllByRole("searchbox", { name: "Search folders and documents" }))[0];
            fireEvent.change(searchInput, { target: { value: "Shared" } });

            const searchRegions = await screen.findAllByRole("region", { name: "Search results" });
            const matchingDocButtons = within(searchRegions[0]).getAllByText("Shared Doc");
            expect(matchingDocButtons).toHaveLength(1);
        });

        it("clears search and restores normal explorer hierarchy via clear button and Escape key", async () => {
            configureApi({
                folders: [{ _id: "f1", name: "Work Projects", parentId: null }],
                notes: [{ _id: "d1", title: "Task List", folderId: "f1", createdAt: "2026-01-01T00:00:00.000Z" }],
            });

            renderWorkspace();
            const searchInput = (await screen.findAllByRole("searchbox", { name: "Search folders and documents" }))[0];

            // Type to search
            fireEvent.change(searchInput, { target: { value: "Work" } });
            expect(screen.queryByRole("button", { name: "All documents" })).toBeNull();

            // Clear using button
            const clearBtn = screen.getByRole("button", { name: "Clear search" });
            fireEvent.click(clearBtn);
            expect(searchInput.value).toBe("");
            expect(await screen.findByRole("button", { name: "All documents" })).toBeTruthy();

            // Type again and clear using Escape key
            fireEvent.change(searchInput, { target: { value: "Work" } });
            await waitFor(() => expect(screen.queryByRole("button", { name: "All documents" })).toBeNull());

            fireEvent.keyDown(searchInput, { key: "Escape", code: "Escape", charCode: 27 });
            await waitFor(() => expect(searchInput.value).toBe(""));
            expect(await screen.findByRole("button", { name: "All documents" })).toBeTruthy();
        });

        it("navigates to folder when clicking a folder search result", async () => {
            configureApi({
                folders: [{ _id: "folder-target", name: "Target Folder", parentId: null }],
            });
            renderWorkspace();

            const searchInput = (await screen.findAllByRole("searchbox", { name: "Search folders and documents" }))[0];
            fireEvent.change(searchInput, { target: { value: "Target" } });

            const searchRegions = await screen.findAllByRole("region", { name: "Search results" });
            const folderBtn = within(searchRegions[0]).getByRole("button", { name: /Target Folder/ });
            fireEvent.click(folderBtn);

            expect(await screen.findByRole("heading", { name: "Target Folder" })).toBeTruthy();
        });
    });
});
