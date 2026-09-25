import { describe, expect, it } from "vitest";

import plans from "../../../../platform/backend/src/constants/plans.js";

// ============================================================
// CuratoCV Plan Configuration Tests
// ============================================================
//
// These tests verify the immutable business configuration
// defined in:
//
//     platform/backend/src/constants/plans.js
//
// These are unit tests.
//
// They intentionally do NOT:
// - access MongoDB
// - access Razorpay
// - access HTTP endpoints
// - access external services
// - make network requests
//
// The purpose is to protect the application's subscription
// contract from accidental changes.
// ============================================================

// ============================================================
// Plan IDs
// ============================================================

describe("Plan IDs", () => {
    it("defines all supported subscription plans", () => {
        expect(Object.keys(plans.plans)).toEqual(["free", "pro", "pro_plus"]);
    });

    it("accepts valid plan IDs", () => {
        expect(plans.isValidPlanId("free")).toBe(true);

        expect(plans.isValidPlanId("pro")).toBe(true);

        expect(plans.isValidPlanId("pro_plus")).toBe(true);
    });

    it("rejects invalid plan IDs", () => {
        expect(plans.isValidPlanId("enterprise")).toBe(false);

        expect(plans.isValidPlanId("")).toBe(false);

        expect(plans.isValidPlanId(null)).toBe(false);

        expect(plans.isValidPlanId(undefined)).toBe(false);

        expect(plans.isValidPlanId(123)).toBe(false);
    });
});

// ============================================================
// Billing Periods
// ============================================================

describe("Billing periods", () => {
    it("defines the supported billing periods", () => {
        expect(Object.values(plans.billingPeriods)).toEqual([
            "monthly",
            "three_month",
            "six_month",
            "yearly",
        ]);
    });

    it("accepts valid billing periods", () => {
        expect(plans.isValidBillingPeriod("monthly")).toBe(true);

        expect(plans.isValidBillingPeriod("three_month")).toBe(true);

        expect(plans.isValidBillingPeriod("six_month")).toBe(true);

        expect(plans.isValidBillingPeriod("yearly")).toBe(true);
    });

    it("rejects invalid billing periods", () => {
        expect(plans.isValidBillingPeriod("weekly")).toBe(false);

        expect(plans.isValidBillingPeriod("")).toBe(false);

        expect(plans.isValidBillingPeriod(null)).toBe(false);

        expect(plans.isValidBillingPeriod(undefined)).toBe(false);

        expect(plans.isValidBillingPeriod(123)).toBe(false);
    });
});

// ============================================================
// Free Plan
// ============================================================

describe("Free plan", () => {
    const freePlan = plans.getPlan("free");

    it("exists", () => {
        expect(freePlan).not.toBeNull();
    });

    it("has no subscription billing options", () => {
        expect(freePlan.billingOptions).toEqual({});
    });

    it("allows two resumes", () => {
        expect(plans.getResumeLimit("free")).toBe(2);
    });

    it("does not allow AI usage", () => {
        expect(plans.getAIEntitlement("free")).toEqual({
            enabled: false,
            creditsPerPeriod: 0,
        });
    });

    it("provides the core resume features", () => {
        expect(freePlan.features).toMatchObject({
            resumeEditing: true,
            resumePreview: true,
            resumeDownload: true,
            resumeSharing: true,
            templates: true,
            customization: true,
            photoUpload: true,
            publicResume: true,
            ai: false,
        });
    });

    it("provides lifetime core access", () => {
        expect(freePlan.access.lifetimeCoreAccess).toBe(true);
    });
});

// ============================================================
// Pro Plan
// ============================================================

describe("Pro plan", () => {
    const proPlan = plans.getPlan("pro");

    it("exists", () => {
        expect(proPlan).not.toBeNull();
    });

    it("allows four resumes", () => {
        expect(plans.getResumeLimit("pro")).toBe(4);
    });

    it("allows AI usage", () => {
        expect(plans.getAIEntitlement("pro")).toEqual({
            enabled: true,
            creditsPerPeriod: 200,
        });
    });

    it("provides monthly billing at ₹199", () => {
        expect(plans.getBillingOption("pro", "monthly")).toEqual({
            id: "pro_monthly",
            amount: 199,
            amountMinor: 19900,
            currency: "INR",
            durationMonths: 1,
            recurring: true,
        });
    });

    it("provides the three-month option at ₹549", () => {
        expect(plans.getBillingOption("pro", "three_month")).toEqual({
            id: "pro_three_month",
            amount: 549,
            amountMinor: 54900,
            currency: "INR",
            durationMonths: 3,
            recurring: false,
        });
    });

    it("provides the six-month option at ₹999", () => {
        expect(plans.getBillingOption("pro", "six_month")).toEqual({
            id: "pro_six_month",
            amount: 999,
            amountMinor: 99900,
            currency: "INR",
            durationMonths: 6,
            recurring: false,
        });
    });

    it("provides the yearly option at ₹1,799", () => {
        expect(plans.getBillingOption("pro", "yearly")).toEqual({
            id: "pro_yearly",
            amount: 1799,
            amountMinor: 179900,
            currency: "INR",
            durationMonths: 12,
            recurring: false,
        });
    });
});

// ============================================================
// Pro Plus Plan
// ============================================================

describe("Pro Plus plan", () => {
    const proPlusPlan = plans.getPlan("pro_plus");

    it("exists", () => {
        expect(proPlusPlan).not.toBeNull();
    });

    it("has no plan-level resume limit", () => {
        expect(plans.getResumeLimit("pro_plus")).toBeNull();
    });

    it("allows AI usage", () => {
        expect(plans.getAIEntitlement("pro_plus")).toEqual({
            enabled: true,
            creditsPerPeriod: 2000,
        });
    });

    it("provides monthly billing at ₹499", () => {
        expect(plans.getBillingOption("pro_plus", "monthly")).toEqual({
            id: "pro_plus_monthly",
            amount: 499,
            amountMinor: 49900,
            currency: "INR",
            durationMonths: 1,
            recurring: true,
        });
    });

    it("provides the three-month option at ₹1,299", () => {
        expect(plans.getBillingOption("pro_plus", "three_month")).toEqual({
            id: "pro_plus_three_month",
            amount: 1299,
            amountMinor: 129900,
            currency: "INR",
            durationMonths: 3,
            recurring: false,
        });
    });

    it("provides the six-month option at ₹2,399", () => {
        expect(plans.getBillingOption("pro_plus", "six_month")).toEqual({
            id: "pro_plus_six_month",
            amount: 2399,
            amountMinor: 239900,
            currency: "INR",
            durationMonths: 6,
            recurring: false,
        });
    });

    it("provides the yearly option at ₹4,499", () => {
        expect(plans.getBillingOption("pro_plus", "yearly")).toEqual({
            id: "pro_plus_yearly",
            amount: 4499,
            amountMinor: 449900,
            currency: "INR",
            durationMonths: 12,
            recurring: false,
        });
    });
});

// ============================================================
// Invalid Billing Lookups
// ============================================================

describe("Billing option lookup", () => {
    it("returns null for an invalid plan", () => {
        expect(plans.getBillingOption("invalid_plan", "monthly")).toBeNull();
    });

    it("returns null for an invalid billing period", () => {
        expect(plans.getBillingOption("pro", "weekly")).toBeNull();
    });

    it("returns null when both inputs are invalid", () => {
        expect(plans.getBillingOption("invalid_plan", "weekly")).toBeNull();
    });

    it("returns null when the free plan is queried with a paid billing period", () => {
        expect(plans.getBillingOption("free", "monthly")).toBeNull();
    });
});

// ============================================================
// Currency
// ============================================================

describe("Currency", () => {
    it("uses INR", () => {
        expect(plans.currency).toBe("INR");
    });
});

// ============================================================
// Monetary Integrity
// ============================================================
//
// Provider amounts must remain exactly 100x the displayed INR
// amount for INR/paise.
// ============================================================

describe("Monetary integrity", () => {
    it("stores the Pro monthly amount correctly in paise", () => {
        const option = plans.getBillingOption("pro", "monthly");

        expect(option.amountMinor).toBe(option.amount * 100);
    });

    it("stores the Pro yearly amount correctly in paise", () => {
        const option = plans.getBillingOption("pro", "yearly");

        expect(option.amountMinor).toBe(option.amount * 100);
    });

    it("stores the Pro Plus monthly amount correctly in paise", () => {
        const option = plans.getBillingOption("pro_plus", "monthly");

        expect(option.amountMinor).toBe(option.amount * 100);
    });

    it("stores the Pro Plus yearly amount correctly in paise", () => {
        const option = plans.getBillingOption("pro_plus", "yearly");

        expect(option.amountMinor).toBe(option.amount * 100);
    });
});
