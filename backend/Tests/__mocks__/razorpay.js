import { vi } from "vitest";

/**
 * Mock Razorpay SDK for testing.
 */
const mockRazorpay = {
    orders: {
        create: vi.fn().mockResolvedValue({
            id: "order_mock123",
            amount: 99900,
            currency: "INR",
            status: "created",
        }),
        fetch: vi.fn().mockResolvedValue({
            id: "order_mock123",
            amount: 99900,
            currency: "INR",
            status: "created",
        }),
    },
    payments: {
        fetch: vi.fn().mockResolvedValue({
            id: "pay_mock123",
            order_id: "order_mock123",
            amount: 99900,
            currency: "INR",
            status: "captured",
        }),
    },
    subscriptions: {
        create: vi.fn().mockResolvedValue({
            id: "sub_mock123",
            plan_id: "plan_mock",
            customer_id: "cust_mock123",
            status: "active",
        }),
        cancel: vi.fn().mockResolvedValue({
            id: "sub_mock123",
            status: "cancelled",
        }),
    },
};

export default vi.fn(() => mockRazorpay);
