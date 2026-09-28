import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BrandLockup from "@curatocv/platform-frontend/components/common/BrandLockup";
import Button from "@curatocv/platform-frontend/components/common/Button";
import AuthPageLayout from "@curatocv/platform-frontend/components/auth/AuthPageLayout";

describe("CuratoCV shared visual system", () => {
    it("uses the same logo and wordmark assets with fixed, undistorted proportions", () => {
        render(<MemoryRouter><BrandLockup /></MemoryRouter>);

        const home = screen.getByRole("link", { name: "CuratoCV home" });
        const images = home.querySelectorAll("img");

        expect(home.getAttribute("href")).toBe("/");
        expect(images).toHaveLength(2);
        expect(images[0].getAttribute("src")).toBe("/logo.svg");
        expect(images[0].getAttribute("width")).toBe("48");
        expect(images[0].getAttribute("height")).toBe("48");
        expect(images[1].getAttribute("src")).toBe("/brand.svg");
        expect(images[1].getAttribute("width")).toBe("900");
        expect(images[1].getAttribute("height")).toBe("220");
        expect(images[1].className).toContain("w-auto");
    });

    it("applies the requested action intent while keeping controls touch sized", () => {
        render(<Button variant="danger">Delete document</Button>);

        const button = screen.getByRole("button", { name: "Delete document" });
        expect(button.className).toContain("bg-red-600");
        expect(button.className).toContain("cv-button");
        expect(button.className).toContain("min-h-11");
    });

    it("gives account pages a viewport-aware brand frame", () => {
        render(
            <MemoryRouter>
                <AuthPageLayout><h1>Login</h1></AuthPageLayout>
            </MemoryRouter>,
        );

        expect(screen.getByRole("link", { name: "CuratoCV home" })).toBeTruthy();
        expect(screen.getByRole("main").className).toContain("cv-auth-content");
        expect(screen.getByRole("heading", { name: "Login" })).toBeTruthy();
    });
});
