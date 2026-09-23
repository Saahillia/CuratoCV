import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";

// ============================================================
// Load Test Environment Variables
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envTestPath = path.resolve(__dirname, "..", ".env.test");

if (fs.existsSync(envTestPath)) {
    const envConfig = fs.readFileSync(envTestPath, "utf8");

    for (const line of envConfig.split("\n")) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }

        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").trim();

        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    }
}

// ============================================================
// MongoDB Memory Server
// ============================================================

let mongoServer;

/**
 * Start MongoDB Memory Server before all tests.
 */
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
    });
}, 30000);

/**
 * Stop MongoDB Memory Server after all tests.
 */
afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    if (mongoServer) {
        await mongoServer.stop();
    }
}, 30000);

/**
 * Clear all collections before each test.
 */
beforeEach(async () => {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

/**
 * Clean up after each test.
 */
afterEach(async () => {
    // Additional cleanup if needed
});

// ============================================================
// Export Database Connection for Test Utilities
// ============================================================

export const getDbConnection = () => mongoose.connection;

export const clearDatabase = async () => {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};
