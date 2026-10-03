import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RouteLoadingFallback from "../components/performance/RouteLoadingFallback";

describe("route-specific loading skeletons", () => {
    it.each([
        ["/app/profile", "Loading your profile"],
        ["/app/settings", "Loading account settings"],
        ["/app/billing", "Loading billing details"],
        ["/products/memo", "Loading Memo workspace"],
        ["/products/memo/editor", "Loading Memo editor"],
        ["/app/resumes/resume-1/edit", "Loading resume editor"],
        ["/app", "Loading your resumes"],
    ])("shows the %s layout while auth is resolving", (path, label) => {
        render(<MemoryRouter initialEntries={[path]}><RouteLoadingFallback /></MemoryRouter>);
        expect(screen.getByRole("status", { name: label }).getAttribute("aria-busy")).toBe("true");
    });
});
