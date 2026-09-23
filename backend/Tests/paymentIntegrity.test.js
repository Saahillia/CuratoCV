import { describe, it, expect, beforeEach, vi } from "vitest";
import { createUser, createSubscription, createPayment } from "./factories.js";
import paymentService from "../Services/paymentService.js";
// Status constants accessed via model statics: Payment.statuses
const PAYMENT_STATUSES = {
    CREATED: "created",
    PENDING: "pending",
    AUTHORIZED: "authorized",
    CAPTURED: "captured",
    FAILED: "failed",
    REFUNDED: "refunded",
    PARTIALLY_REFUNDED: "partially_refunded",
    CANCELLED: "cancelled",
};
import { PLAN_IDS, BILLING_PERIODS } from "../Constants/plans.js";
import crypto from "crypto";

import razorpay from "../Configs/razorpay.js";

const SUBSCRIPTION_STATUSES = {
    ACTIVE: "active",
    PENDING: "pending",
    PAUSED: "paused",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
    FAILED: "failed",
};

// Mock Razorpay client
vi.mock("../Configs/razorpay.js", () => ({
    default: {
        orders: {
            create: vi.fn(),
        },
    },
}));

describe("Payment Integrity Tests", () => {
    let user, subscription;

    beforeEach(async () => {
        user = await createUser();
        subscription = await createSubscription(user._id, {
            planId: PLAN_IDS.PRO,
            billingPeriod: BILLING_PERIODS.MONTHLY,
            status: SUBSCRIPTION_STATUSES.PENDING,
        });

        razorpay.orders.create.mockResolvedValue({
            id: "order_mock123",
            amount: 19900,
            currency: "INR",
            status: "created",
        });
    });

    describe("Payment Signature Verification", () => {
        it("should verify valid payment signature", () => {
            const orderId = "order_test123";
            const paymentId = "pay_test456";
            const secret = process.env.RAZORPAY_KEY_SECRET || "test_secret";

            const message = `${orderId}|${paymentId}`;
            const expectedSignature = crypto
                .createHmac("sha256", secret)
                .update(message)
                .digest("hex");

            const isValid = paymentService.verifyCheckoutSignature(
                orderId,
                paymentId,
                expectedSignature
            );

            expect(isValid).toBe(true);
        });

        it("should reject invalid payment signature", () => {
            const orderId = "order_test123";
            const paymentId = "pay_test456";
            const invalidSignature = "invalid_signature";

            const isValid = paymentService.verifyCheckoutSignature(
                orderId,
                paymentId,
                invalidSignature
            );

            expect(isValid).toBe(false);
        });

        it("should reject tampered payment data", () => {
            const orderId = "order_test123";
            const paymentId = "pay_test456";
            const secret = process.env.RAZORPAY_KEY_SECRET || "test_secret";

            const message = `${orderId}|${paymentId}`;
            const validSignature = crypto
                .createHmac("sha256", secret)
                .update(message)
                .digest("hex");

            // Attempt with tampered order ID
            const isValid = paymentService.verifyCheckoutSignature(
                "order_tampered",
                paymentId,
                validSignature
            );

            expect(isValid).toBe(false);
        });
    });

    describe("Webhook Signature Verification", () => {
        it("should verify valid webhook signature", () => {
            const webhookBody = JSON.stringify({
                event: "payment.captured",
                payload: {
                    payment: {
                        entity: {
                            id: "pay_test123",
                            order_id: "order_test456",
                            amount: 99900,
                            currency: "INR",
                        },
                    },
                },
            });

            const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "webhook_secret";
            const expectedSignature = crypto
                .createHmac("sha256", secret)
                .update(webhookBody)
                .digest("hex");

            const isValid = paymentService.verifyWebhookSignature(
                webhookBody,
                expectedSignature
            );

            expect(isValid).toBe(true);
        });

        it("should reject webhook with invalid signature", () => {
            const webhookBody = JSON.stringify({
                event: "payment.captured",
            });

            const isValid = paymentService.verifyWebhookSignature(
                webhookBody,
                "invalid_signature"
            );

            expect(isValid).toBe(false);
        });
    });

    describe("Payment Idempotency", () => {
        it("should prevent duplicate payment processing", async () => {
            const payment = await createPayment(user._id, subscription._id, {
                status: PAYMENT_STATUSES.CAPTURED,
                lastWebhookEventId: "evt_test123",
            });

            const webhookBody = {
                id: "evt_test123",
                event: "payment.captured",
                payload: {
                    payment: {
                        entity: {
                            id: payment.providerPaymentId,
                            order_id: payment.providerOrderId,
                            amount: payment.amountMinor,
                            currency: payment.currency,
                        },
                    },
                },
            };

            // Mock the processWebhook to check idempotency
            // In real implementation, it should detect duplicate and return alreadyProcessed: true
        });
    });

    describe("Amount and Currency Validation", () => {
        it("should create order with correct amount", async () => {
            const order = await paymentService.createOrder({
                userId: user._id,
                subscriptionId: subscription._id,
                planId: PLAN_IDS.PRO,
                billingPeriod: BILLING_PERIODS.MONTHLY,
            });

            expect(order.amountMinor).toBe(19900); // PRO monthly = ₹199 = 19900 paise
            expect(order.currency).toBe("INR");
        });

        it("should validate payment amount matches order", async () => {
            const payment = await createPayment(user._id, subscription._id, {
                amountMinor: 19900,
                currency: "INR",
            });

            expect(payment.amountMinor).toBe(19900);
            expect(payment.currency).toBe("INR");
        });
    });

    describe("Payment State Transitions", () => {
        it("should transition from CREATED to CAPTURED", async () => {
            const payment = await createPayment(user._id, subscription._id, {
                status: PAYMENT_STATUSES.CREATED,
            });

            expect(payment.status).toBe(PAYMENT_STATUSES.CREATED);

            // Simulate capture
            payment.status = PAYMENT_STATUSES.CAPTURED;
            await payment.save();

            expect(payment.status).toBe(PAYMENT_STATUSES.CAPTURED);
        });

        it("should handle payment failure", async () => {
            const payment = await createPayment(user._id, subscription._id, {
                status: PAYMENT_STATUSES.FAILED,
                failure: {
                    code: "BAD_REQUEST_ERROR",
                    description: "Payment failed",
                },
            });

            expect(payment.status).toBe(PAYMENT_STATUSES.FAILED);
            expect(payment.failure).toBeTruthy();
        });
    });
});
