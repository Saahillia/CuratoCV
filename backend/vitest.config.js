/**
 * Developer context for backend/vitest.config.js.
 * Purpose: configure or support the root backend vitest.config runtime/test behavior.
 * Why here: process composition and test orchestration are root responsibilities; domain behavior remains in its owning workspace.
 */
import { defineConfig } from "vitest/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envTestPath = path.resolve(__dirname, ".env.test");

// Load optional test-only values before Vitest imports application modules, without replacing values already set by CI.
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

export default defineConfig({
    test: {
        environment: "node",

        globals: false,

        // Keep test suites from the root test tree and legacy backend test folder discoverable under one config.
        include: [
            "../tests/unit/backend/**/*.test.js",
            "../tests/integration/backend/**/*.test.js",
            "../tests/integration/api/**/*.test.js",
            "../tests/security/**/*.test.js",
            "./Tests/**/*.test.js",
            "./Tests/**/*.spec.js",
        ],

        // Both setup files establish shared test infrastructure before their corresponding suites run.
        setupFiles: ["../tests/setup.js", "./Tests/setup.js"],

        testTimeout: 30000,
        hookTimeout: 60000,
        fileParallelism: false,

        clearMocks: true,

        restoreMocks: true,

        mockReset: true,

        passWithNoTests: false,

        reporters: ["default"],

        coverage: {
            enabled: false,
            provider: "v8",
            reporter: ["text", "json", "html", "lcov"],
            include: [
                "Controllers/**/*.js",
                "Services/**/*.js",
                "Middlewares/**/*.js",
                "Models/**/*.js",
                "Repositories/**/*.js",
                "Utils/**/*.js",
                "../platform/backend/src/**/*.js",
            ],
            exclude: [
                "Tests/**",
                "**/*.test.js",
                "**/*.spec.js",
                "node_modules/**",
                "server.js",
                "Configs/**",
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 75,
                statements: 80,
            },
        },
    },
});
