import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Billing from "@curatocv/platform-frontend/pages/Billing";

const { apiGet, getCurrentSubscription, getEntitlements } = vi.hoisted(() => ({
    apiGet: vi.fn(),
    getCurrentSubscription: vi.fn(),
    getEntitlements: vi.fn(),
}));

vi.mock("@curatocv/api-client", () => ({ default: { get: apiGet } }));
vi.mock("@curatocv/platform-frontend/services/billingService", () => ({
    default: {
        getCurrentSubscription,
        getEntitlements,
        cancelSubscription: vi.fn(),
    },
}));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));

const configureBilling = () => {
    getCurrentSubscription.mockResolvedValue({ data: { status: "active", plan: { name: "Pro" } } });
    getEntitlements.mockResolvedValue({ data: { planName: "Pro", resumeLimit: 5, ai: { creditsUsed: 3, creditsGranted: 10 } } });
};

const renderBilling = () => render(<MemoryRouter><Billing /></MemoryRouter>);

describe("Billing resume usage", () => {
    beforeEach(() => {
        apiGet.mockReset();
        getCurrentSubscription.mockReset();
        getEntitlements.mockReset();
        configureBilling();
    });

    it("shows the server count and refreshes when the Resume Builder reports a change", async () => {
        apiGet.mockResolvedValue({ data: { success: true, data: { resumes: [{}, {}, {}], count: 3 } } });
        renderBilling();

        expect(await screen.findByText("3 / 5 resumes")).toBeTruthy();

        apiGet.mockResolvedValue({ data: { success: true, data: { resumes: [{}, {}, {}, {}], count: 4 } } });
        fireEvent(window, new Event("curatocv:resume-collection-updated"));

        expect(await screen.findByText("4 / 5 resumes")).toBeTruthy();
    });

    it("shows a recoverable usage error instead of reporting zero on API failure", async () => {
        apiGet.mockRejectedValue(new Error("Network unavailable"));
        renderBilling();

        expect(await screen.findByText("Resume usage is temporarily unavailable.")).toBeTruthy();
        expect(screen.queryByText("0 / 5 resumes")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByText("Resume usage is temporarily unavailable.")).toBeTruthy();
    });
});
