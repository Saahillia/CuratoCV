import { describe, it, expect, beforeEach } from "vitest";
import { createUser, createSubscription, createPayment } from "./factories.js";
import billingService from "../Services/billingService.js";
import { PLAN_IDS, BILLING_PERIODS } from "../Constants/plans.js";
// Status constants accessed via model statics: Subscription.statuses, Payment.statuses
const SUBSCRIPTION_STATUSES = {
    ACTIVE: "active",
    PENDING: "pending",
    PAUSED: "paused",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
    FAILED: "failed",
};
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

describe("Subscription Lifecycle Tests", () => {
    let user, subscription, payment;

    beforeEach(async () => {
        user = await createUser();
    });

    describe("Subscription Activation", () => {
        it("should activate subscription after payment", async () => {
            subscription = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                billingPeriod: BILLING_PERIODS.MONTHLY,
                status: SUBSCRIPTION_STATUSES.PENDING,
            });

            payment = await createPayment(user._id, subscription._id, {
                status: PAYMENT_STATUSES.CAPTURED,
            });

            const activated = await billingService.activateFromVerifiedPayment({
                subscriptionId: subscription._id,
                paymentId: payment._id,
            });

            expect(activated.status).toBe(SUBSCRIPTION_STATUSES.ACTIVE);
            expect(activated.aiCredits.available).toBe(200);
            expect(activated.startDate).toBeTruthy();
        });

        it("should not activate subscription without payment", async () => {
            subscription = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                status: SUBSCRIPTION_STATUSES.PENDING,
            });

            payment = await createPayment(user._id, subscription._id, {
                status: PAYMENT_STATUSES.CREATED,
            });

            await expect(
                billingService.activateFromVerifiedPayment({
                    subscriptionId: subscription._id,
                    paymentId: payment._id,
                })
            ).rejects.toThrow();
        });
    });

    describe("Subscription Renewal", () => {
        beforeEach(async () => {
            subscription = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                billingPeriod: BILLING_PERIODS.MONTHLY,
                status: SUBSCRIPTION_STATUSES.ACTIVE,
                aiCredits: {
                    available: 50,
                    consumed: 150,
                    resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
        });

        it("should renew subscription and reset AI credits", async () => {
            payment = await createPayment(user._id, subscription._id, {
                status: PAYMENT_STATUSES.CAPTURED,
            });

            const renewed = await billingService.renewSubscription({
                subscriptionId: subscription._id,
                paymentId: payment._id,
            });

            expect(renewed.status).toBe(SUBSCRIPTION_STATUSES.ACTIVE);
            expect(renewed.aiCredits.available).toBe(200);
            expect(renewed.aiCredits.consumed).toBe(0);
        });

        it("should extend subscription period on renewal", async () => {
            const originalEnd = subscription.currentPeriodEnd;

            payment = await createPayment(user._id, subscription._id, {
                status: PAYMENT_STATUSES.CAPTURED,
            });

            const renewed = await billingService.renewSubscription({
                subscriptionId: subscription._id,
                paymentId: payment._id,
            });

            expect(renewed.currentPeriodEnd.getTime()).toBeGreaterThan(
                originalEnd.getTime()
            );
        });
    });

    describe("Subscription Cancellation", () => {
        beforeEach(async () => {
            subscription = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                status: SUBSCRIPTION_STATUSES.ACTIVE,
                currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            });
        });

        it("should cancel subscription at period end", async () => {
            const cancelled = await billingService.cancelAtPeriodEnd(subscription._id);

            expect(cancelled.cancelAtPeriodEnd).toBe(true);
            expect(cancelled.cancelledAt).toBeTruthy();
            expect(cancelled.status).toBe(SUBSCRIPTION_STATUSES.ACTIVE);
        });

        it("should maintain access until period end", async () => {
            await billingService.cancelAtPeriodEnd(subscription._id);

            const entitlement = await billingService.getUserEntitlements(user._id);
            expect(entitlement.hasActiveSubscription).toBe(true);
        });
    });

    describe("Subscription Expiration", () => {
        it("should expire subscription immediately", async () => {
            subscription = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                status: SUBSCRIPTION_STATUSES.ACTIVE,
            });

            const expired = await billingService.expireSubscription(subscription._id);

            expect(expired.status).toBe(SUBSCRIPTION_STATUSES.EXPIRED);
            expect(expired.endDate).toBeTruthy();
        });

        it("should lose entitlements after expiration", async () => {
            subscription = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                status: SUBSCRIPTION_STATUSES.ACTIVE,
            });

            await billingService.expireSubscription(subscription._id);

            const entitlement = await billingService.getUserEntitlements(user._id);
            expect(entitlement.hasActiveSubscription).toBe(false);
            expect(entitlement.resumeLimit).toBe(2); // Falls back to FREE
        });
    });

    describe("Unique Active Subscription Enforcement", () => {
        it("should allow only one active subscription per user", async () => {
            const sub1 = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                status: SUBSCRIPTION_STATUSES.ACTIVE,
            });

            await expect(
                createSubscription(user._id, {
                    planId: PLAN_IDS.PRO_PLUS,
                    status: SUBSCRIPTION_STATUSES.ACTIVE,
                })
            ).rejects.toThrow();
        });

        it("should allow multiple non-active subscriptions", async () => {
            const sub1 = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                status: SUBSCRIPTION_STATUSES.EXPIRED,
            });

            const sub2 = await createSubscription(user._id, {
                planId: PLAN_IDS.PRO,
                status: SUBSCRIPTION_STATUSES.CANCELLED,
            });

            expect(sub1).toBeTruthy();
            expect(sub2).toBeTruthy();
        });
    });
});
