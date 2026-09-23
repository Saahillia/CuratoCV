import { describe, it, expect, beforeEach } from "vitest";
import { createUser, createResume, createSubscription, createResumes } from "./factories.js";
import resumeService from "../Services/resumeService.js";
import billingService from "../Services/billingService.js";
import { PLAN_IDS, BILLING_PERIODS } from "../Constants/plans.js";
// Status constants accessed via model statics: Subscription.statuses
const SUBSCRIPTION_STATUSES = {
    ACTIVE: "active",
    PENDING: "pending",
    PAUSED: "paused",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
    FAILED: "failed",
};

describe("Resume Entitlement Tests", () => {
    let freeUser, proUser, proPlusUser;
    let freeSubscription, proSubscription, proPlusSubscription;

    beforeEach(async () => {
        // Create FREE tier user
        freeUser = await createUser({ email: "free@example.com" });
        freeSubscription = await createSubscription(freeUser._id, {
            planId: PLAN_IDS.FREE,
            status: SUBSCRIPTION_STATUSES.ACTIVE,
        });

        // Create PRO tier user
        proUser = await createUser({ email: "pro@example.com" });
        proSubscription = await createSubscription(proUser._id, {
            planId: PLAN_IDS.PRO,
            billingPeriod: BILLING_PERIODS.MONTHLY,
            status: SUBSCRIPTION_STATUSES.ACTIVE,
            aiCredits: {
                available: 200,
                consumed: 0,
                resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        // Create PRO_PLUS tier user
        proPlusUser = await createUser({ email: "proplus@example.com" });
        proPlusSubscription = await createSubscription(proPlusUser._id, {
            planId: PLAN_IDS.PRO_PLUS,
            billingPeriod: BILLING_PERIODS.MONTHLY,
            status: SUBSCRIPTION_STATUSES.ACTIVE,
            aiCredits: {
                available: 2000,
                consumed: 0,
                resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
    });

    describe("FREE Tier (2 resumes)", () => {
        it("should allow creating up to 2 resumes", async () => {
            const resume1 = await resumeService.createResume(freeUser._id, {
                title: "Resume 1",
            });

            const resume2 = await resumeService.createResume(freeUser._id, {
                title: "Resume 2",
            });

            expect(resume1).toBeTruthy();
            expect(resume2).toBeTruthy();
        });

        it("should reject creating 3rd resume", async () => {
            await createResumes(freeUser._id, 2);

            await expect(
                resumeService.createResume(freeUser._id, {
                    title: "Resume 3",
                })
            ).rejects.toThrow();
        });

        it("should return correct entitlement limit", async () => {
            const limit = await billingService.getResumeLimit(freeUser._id);
            expect(limit).toBe(2);
        });
    });

    describe("PRO Tier (4 resumes)", () => {
        it("should allow creating up to 4 resumes", async () => {
            const resumes = await createResumes(proUser._id, 4);
            expect(resumes).toHaveLength(4);
        });

        it("should reject creating 5th resume", async () => {
            await createResumes(proUser._id, 4);

            await expect(
                resumeService.createResume(proUser._id, {
                    title: "Resume 5",
                })
            ).rejects.toThrow();
        });

        it("should return correct entitlement limit", async () => {
            const limit = await billingService.getResumeLimit(proUser._id);
            expect(limit).toBe(4);
        });
    });

    describe("PRO_PLUS Tier (unlimited resumes)", () => {
        it("should allow creating unlimited resumes", async () => {
            const resumes = await createResumes(proPlusUser._id, 10);
            expect(resumes).toHaveLength(10);

            const moreResume = await resumeService.createResume(proPlusUser._id, {
                title: "Resume 11",
            });

            expect(moreResume).toBeTruthy();
        });

        it("should return null for unlimited entitlement", async () => {
            const limit = await billingService.getResumeLimit(proPlusUser._id);
            expect(limit).toBeNull();
        });
    });

    describe("Subscription Downgrade Scenarios", () => {
        it("should enforce new limit after downgrade from PRO to FREE", async () => {
            // Create 4 resumes on PRO
            await createResumes(proUser._id, 4);

            // Downgrade to FREE
            await billingService.expireSubscription(proSubscription._id);
            await createSubscription(proUser._id, {
                planId: PLAN_IDS.FREE,
                status: SUBSCRIPTION_STATUSES.ACTIVE,
            });

            // Should not allow creating new resume (already at 4, limit is 2)
            await expect(
                resumeService.createResume(proUser._id, {
                    title: "Resume 5",
                })
            ).rejects.toThrow();
        });
    });
});
