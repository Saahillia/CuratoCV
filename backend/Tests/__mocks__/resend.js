/**
 * Developer context for backend/Tests/__mocks__/resend.js.
 * Purpose: documents the test scenarios for resend.
 * Why separate: keep expected behavior and regression checks close to the tested contract; production behavior stays in its owning module.
 */
import { vi } from "vitest";

/**
 * Mock Resend email client for testing.
 */
const mockResend = {
    emails: {
        send: vi.fn().mockResolvedValue({
            id: "email_mock123",
            from: "noreply@curatocv.com",
            to: "test@example.com",
            subject: "Test Email",
        }),
    },
};

export const Resend = vi.fn(() => mockResend);

export default mockResend;
