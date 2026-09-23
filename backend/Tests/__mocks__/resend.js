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
