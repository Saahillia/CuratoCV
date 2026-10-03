import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Settings from "@curatocv/platform-frontend/pages/Settings";
import Profile from "@curatocv/platform-frontend/pages/Profile";

const { dispatchMock, getCurrentUserMock, updateCurrentUserMock } = vi.hoisted(() => ({
    dispatchMock: vi.fn(),
    getCurrentUserMock: vi.fn(),
    updateCurrentUserMock: vi.fn(),
}));

vi.mock("react-redux", () => ({
    useSelector: (select) => select({
        auth: {
            user: {
                id: "user-1",
                name: "Saahil Lia",
                email: "saahil@example.com",
                emailVerified: true,
                createdAt: "2024-01-15T00:00:00.000Z",
            },
        },
    }),
    useDispatch: () => dispatchMock,
}));

vi.mock("@curatocv/platform-frontend/services/authService", () => ({
    default: {
        getCurrentUser: getCurrentUserMock,
        updateCurrentUser: updateCurrentUserMock,
    },
}));

vi.mock("@curatocv/api-client", () => ({ default: { delete: vi.fn() } }));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));

describe("Account center", () => {
    beforeEach(() => {
        dispatchMock.mockReset();
        getCurrentUserMock.mockReset();
        updateCurrentUserMock.mockReset();
    });

    it("shows the shared account navigation and useful links for both products", () => {
        render(
            <MemoryRouter initialEntries={["/app/settings"]}>
                <Settings />
            </MemoryRouter>,
        );

        expect(screen.getByRole("heading", { name: "Settings", level: 1 })).toBeTruthy();
        expect(screen.getByRole("navigation", { name: "Account sections" })).toBeTruthy();
        expect(screen.getByRole("link", { name: /Open Resume Builder/ }).getAttribute("href")).toBe("/products/resume-builder");
        expect(screen.getByRole("link", { name: /Open Memo/ }).getAttribute("href")).toBe("/products/memo");
        expect(screen.getByRole("link", { name: /Manage billing/ }).getAttribute("href")).toBe("/app/billing");
        expect(screen.getByRole("link", { name: /Review deletion options/ }).getAttribute("href")).toBe("/app/profile#danger-zone");
        expect(document.querySelector("main")?.className).toContain("bg-[#F7FAFC]");
        expect(screen.getByRole("navigation", { name: "Account sections" }).className).toContain("overflow-x-auto");
        expect(document.querySelector(".grid.gap-4.md\\:grid-cols-2")).toBeTruthy();
    });

    it("saves edited profile names through the canonical profile service", async () => {
        const original = {
            id: "user-1",
            name: "Saahil Lia",
            email: "saahil@example.com",
            emailVerified: true,
            createdAt: "2024-01-15T00:00:00.000Z",
        };
        getCurrentUserMock.mockResolvedValue({ data: original });
        updateCurrentUserMock.mockResolvedValue({ data: { ...original, name: "Saahil A Lia" } });

        render(
            <MemoryRouter initialEntries={["/app/profile"]}>
                <Profile />
            </MemoryRouter>,
        );

        const nameInput = await screen.findByLabelText("Full Name");
        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        fireEvent.change(nameInput, { target: { value: "Saahil A Lia" } });
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

        await waitFor(() => expect(updateCurrentUserMock).toHaveBeenCalledWith({ name: "Saahil A Lia" }));
        expect(await screen.findByDisplayValue("Saahil A Lia")).toBeTruthy();
        expect(dispatchMock).toHaveBeenCalled();
    });
});
