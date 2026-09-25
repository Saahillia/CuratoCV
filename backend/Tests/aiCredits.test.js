import { describe, it, expect, beforeEach, vi } from "vitest";
import { createUser, createSubscription } from "./factories.js";
import billingService from "../../platform/backend/src/services/billingService.js";
import aiService from "../../resumebuilder/backend/src/services/aiService.js";
import { PLAN_IDS, BILLING_PERIODS } from "../../platform/backend/src/constants/plans.js";
import ai from "../../resumebuilder/backend/src/configs/ai.js";

// Status constants accessed via model statics: Subscription.statuses
const SUBSCRIPTION_STATUSES = {
    ACTIVE: "active",
    PENDING: "pending",
    PAUSED: "paused",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
    FAILED: "failed",
};

// Mock the AI client
vi.mock("../../resumebuilder/backend/src/configs/ai.js", () => ({
    default: {
        chat: {
            completions: {
                create: vi.fn(),
            },
        },
    },
}));

describe("AI Credits Tests", () => {
    let freeUser, proUser, proPlusUser;
    let freeSubscription, proSubscription, proPlusSubscription;

    beforeEach(async () => {
        ai.chat.completions.create.mockResolvedValue({
            choices: [
                {
                    message: {
                        content: "Generated content",
                    },
                },
            ],
        });

        // FREE user (0 AI credits)
        freeUser = await createUser({ email: "free@example.com" });
        freeSubscription = await createSubscription(freeUser._id, {
            planId: PLAN_IDS.FREE,
            status: SUBSCRIPTION_STATUSES.ACTIVE,
        });

        // PRO user (200 AI credits)
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

        // PRO_PLUS user (2000 AI credits)
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

    describe("AI Credit Enforcement", () => {
        it("should reject AI request for FREE tier user", async () => {
            await expect(
                aiService.generateContent(freeUser._id, "Generate experience", "System prompt")
            ).rejects.toThrow();
        });

        it("should allow AI request for PRO user with credits", async () => {
            const result = await aiService.generateContent(proUser._id, "Generate experience", "System prompt");

            expect(result).toBeTruthy();
            expect(result.generated).toBe("Generated content");

            // Check credits were consumed (generateContent costs 2)
            const entitlement = await billingService.getUserAIEntitlement(proUser._id);
            expect(entitlement.available).toBe(198);
        });

        it("should reject AI request when credits exhausted", async () => {
            // Consume all credits
            await billingService.consumeUserAICredits(proUser._id, 200);

            await expect(
                aiService.generateContent(proUser._id, "Generate experience", "System prompt")
            ).rejects.toThrow();
        });
    });

    describe("Atomic Credit Consumption", () => {
        it("should atomically consume credits", async () => {
            const initialCredits = proSubscription.aiCredits.available;

            const result = await billingService.consumeUserAICredits(proUser._id, 10);

            expect(result.creditsRemaining).toBe(initialCredits - 10);

            // Verify in database
            const entitlement = await billingService.getUserAIEntitlement(proUser._id);
            expect(entitlement.available).toBe(initialCredits - 10);
            expect(entitlement.consumed).toBe(10);
        });

        it("should reject consumption exceeding available credits", async () => {
            await expect(
                billingService.consumeUserAICredits(proUser._id, 300)
            ).rejects.toThrow();
        });

        it("should handle concurrent credit consumption safely", async () => {
            // Simulate concurrent requests
            const promises = Array(5)
                .fill()
                .map(() => billingService.consumeUserAICredits(proUser._id, 10));

            await Promise.all(promises);

            const entitlement = await billingService.getUserAIEntitlement(proUser._id);
            expect(entitlement.available).toBe(150); // 200 - 50
            expect(entitlement.consumed).toBe(50);
        });
    });

    describe("Credit Cost by Operation", () => {
        it("should consume 2 credits for generateContent", async () => {
            await aiService.generateContent(proUser._id, "Generate", "system prompt");

            const entitlement = await billingService.getUserAIEntitlement(proUser._id);
            expect(entitlement.consumed).toBe(2);
        });

        it("should consume 1 credit for improveContent", async () => {
            await aiService.improveContent(proUser._id, "Original content", "Improve this", "System prompt");

            const entitlement = await billingService.getUserAIEntitlement(proUser._id);
            expect(entitlement.consumed).toBe(1);
        });
    });
});
