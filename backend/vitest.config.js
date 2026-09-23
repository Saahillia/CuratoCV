import { defineConfig } from "vitest/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envTestPath = path.resolve(__dirname, ".env.test");

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

        include: [
            "../tests/unit/backend/**/*.test.js",
            "../tests/integration/backend/**/*.test.js",
            "../tests/integration/api/**/*.test.js",
            "../tests/security/**/*.test.js",
            "./Tests/**/*.test.js",
            "./Tests/**/*.spec.js",
        ],

        setupFiles: ["../tests/setup.js", "./Tests/setup.js"],

        testTimeout: 10000,
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
