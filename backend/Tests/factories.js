import User from "../../platform/backend/src/models/User.js";
import Resume from "../../resumebuilder/backend/src/models/Resume.js";
import Subscription from "../../platform/backend/src/models/Subscription.js";
import Payment from "../../platform/backend/src/models/Payment.js";
import { PLAN_IDS, BILLING_PERIODS } from "../../platform/backend/src/constants/plans.js";
import authUtils from "../../platform/backend/src/utils/authUtils.js";

// ============================================================
// User Factory
// ============================================================

/**
 * Create a test user.
 *
 * @param {Object} overrides
 * @returns {Promise<Object>}
 */
export const createUser = async (overrides = {}) => {
    const defaults = {
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: "TestPassword123!", // Plain password - model will hash it
    };

    const userData = { ...defaults, ...overrides };

    const user = new User(userData);
    await user.save();

    return user;
};

// ============================================================
// Resume Factory
// ============================================================

/**
 * Create a test resume.
 *
 * @param {string|ObjectId} userId
 * @param {Object} overrides
 * @returns {Promise<Object>}
 */
export const createResume = async (userId, overrides = {}) => {
    const defaults = {
        userId,
        title: `Test Resume ${Date.now()}`,
        personalInfo: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
        },
        sections: [
            {
                type: "experience",
                title: "Experience",
                order: 0,
                data: [],
            },
            {
                type: "education",
                title: "Education",
                order: 1,
                data: [],
            },
            {
                type: "skills",
                title: "Skills",
                order: 2,
                data: [],
            },
            {
                type: "projects",
                title: "Projects",
                order: 3,
                data: [],
            },
            {
                type: "certificates",
                title: "Certificates",
                order: 4,
                data: [],
            },
        ],
        design: {
            template: "modern",
            colorScheme: "blue",
            fontSize: "medium",
        },
    };

    const resumeData = { ...defaults, ...overrides };

    const resume = new Resume(resumeData);
    await resume.save();

    return resume;
};

// ============================================================
// Subscription Factory
// ============================================================

/**
 * Create a test subscription.
 *
 * @param {string|ObjectId} userId
 * @param {Object} overrides
 * @returns {Promise<Object>}
 */
export const createSubscription = async (userId, overrides = {}) => {
    const planId = overrides.planId || PLAN_IDS.FREE;
    const isFree = planId === PLAN_IDS.FREE;

    const granted = isFree
        ? 0
        : overrides.aiCreditsGranted ??
          (overrides.aiCredits
              ? (overrides.aiCredits.available ?? 0) + (overrides.aiCredits.consumed ?? 0)
              : (planId === PLAN_IDS.PRO ? 200 : 2000));
    const used = overrides.aiCreditsUsed ?? overrides.aiCredits?.consumed ?? 0;

    const defaults = {
        userId,
        planId,
        status: "active",
        startedAt: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        aiCreditsGranted: granted,
        aiCreditsUsed: used,
        aiCreditsPeriodStart: isFree ? null : new Date(),
        aiCreditsPeriodEnd: isFree
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    if (isFree) {
        defaults.billingOptionId = null;
        defaults.billingPeriod = null;
        defaults.provider = null;
        defaults.providerSubscriptionId = null;
        defaults.providerCustomerId = null;
    } else {
        defaults.billingPeriod = overrides.billingPeriod || BILLING_PERIODS.MONTHLY;
        defaults.billingOptionId = `${planId.toLowerCase()}_${defaults.billingPeriod.toLowerCase()}`;
        defaults.provider = "razorpay";
        defaults.providerSubscriptionId = `sub_test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        defaults.providerCustomerId = `cust_test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    const subscriptionData = {
        ...defaults,
        ...overrides,
    };

    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    return subscription;
};

// ============================================================
// Payment Factory
// ============================================================

/**
 * Create a test payment.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} subscriptionId
 * @param {Object} overrides
 * @returns {Promise<Object>}
 */
export const createPayment = async (userId, subscriptionId, overrides = {}) => {
    const defaults = {
        userId,
        subscriptionId,
        planId: PLAN_IDS.PRO,
        billingOptionId: "pro_monthly",
        billingPeriod: BILLING_PERIODS.MONTHLY,
        provider: "razorpay",
        status: "created",
        amountMinor: 99900,
        currency: "INR",
        description: "Test payment",
        providerOrderId: `order_test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };

    const paymentData = { ...defaults, ...overrides };

    const payment = new Payment(paymentData);
    await payment.save();

    return payment;
};

// ============================================================
// Auth Token Factory
// ============================================================

/**
 * Create an authentication token for a user.
 *
 * @param {Object} user
 * @returns {string}
 */
export const createAuthToken = (user) => {
    return authUtils.generateToken({
        userId: user._id.toString(),
        email: user.email,
        tokenVersion: user.tokenVersion ?? 0,
    });
};

// ============================================================
// Test Client Factory (Express Supertest)
// ============================================================

/**
 * Create a test client for API testing.
 *
 * @param {Express} app
 * @param {Object} user
 * @returns {Object}
 */
export const createTestClient = (app, user = null) => {
    const request = require("supertest")(app);

    if (user) {
        const token = createAuthToken(user);
        return {
            get: (url) => request.get(url).set("Authorization", `Bearer ${token}`),
            post: (url) => request.post(url).set("Authorization", `Bearer ${token}`),
            put: (url) => request.put(url).set("Authorization", `Bearer ${token}`),
            patch: (url) => request.patch(url).set("Authorization", `Bearer ${token}`),
            delete: (url) => request.delete(url).set("Authorization", `Bearer ${token}`),
        };
    }

    return request;
};

// ============================================================
// Batch Factories
// ============================================================

/**
 * Create multiple test users.
 *
 * @param {number} count
 * @returns {Promise<Array>}
 */
export const createUsers = async (count) => {
    const users = [];
    for (let i = 0; i < count; i++) {
        const user = await createUser({
            email: `test${Date.now()}_${i}@example.com`,
        });
        users.push(user);
    }
    return users;
};

/**
 * Create multiple test resumes for a user.
 *
 * @param {string|ObjectId} userId
 * @param {number} count
 * @returns {Promise<Array>}
 */
export const createResumes = async (userId, count) => {
    const resumes = [];
    for (let i = 0; i < count; i++) {
        const resume = await createResume(userId, {
            title: `Test Resume ${i + 1}`,
        });
        resumes.push(resume);
    }
    return resumes;
};
