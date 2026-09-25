import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "../platform/backend/src/configs/db.js";
import securityConfig from "../platform/backend/src/configs/security.js";

import userRouter from "../platform/backend/src/routes/userRoutes.js";
import "../resumebuilder/backend/src/services/userLifecycleHooks.js";
import resumeRouter from "../resumebuilder/backend/src/routes/resumeRoutes.js";
import aiRouter from "../resumebuilder/backend/src/routes/aiRoutes.js";
import paymentRouter from "../platform/backend/src/routes/paymentRoutes.js";
import subscriptionRouter from "../platform/backend/src/routes/subscriptionRoutes.js";
import healthRouter from "../platform/backend/src/routes/healthRoutes.js";
import memoRouter from "../.memo/backend0/src/routes/notesRoutes.js";

import errorMiddleware from "../platform/backend/src/middlewares/errorMiddleware.js";
import rateLimitMiddleware from "../platform/backend/src/middlewares/rateLimitMiddleware.js";
import { closePdfBrowser } from "../resumebuilder/backend/src/services/pdfService.js";

// ============================================================
// CuratoCV Backend Server
// ============================================================
//
// Application entry point.
//
// Responsibilities:
// - Load environment configuration
// - Connect to MongoDB
// - Configure global middleware
// - Preserve Razorpay webhook raw payloads
// - Mount API routes
// - Handle 404 responses
// - Handle unexpected application errors
// - Start the HTTP server
//
// Business logic belongs to:
// - Controllers
// - Services
// - Repositories
//
// ============================================================

// ============================================================
// Application
// ============================================================

const app = express();

const PORT =
    Number(process.env.PORT) || 5000;

// ============================================================
// Database
// ============================================================

await connectDB();

// ============================================================
// CORS
// ============================================================
//
// This currently preserves the existing project behavior.
//
// Once the production frontend URL is finalized, this should
// be restricted through the centralized security configuration.
// ============================================================

// ============================================================
// Trust Proxy
// ============================================================
//
// IP-based controls (rate limiting, audit logging) depend on
// the correct client IP. Only enable when running behind a
// trusted reverse proxy.
// ============================================================

if (securityConfig.trustProxy !== false) {
    app.set(
        "trust proxy",
        securityConfig.trustProxy,
    );
}

// ============================================================
// CORS
// ============================================================
//
// Restricted to an explicit origin allowlist from CORS_ORIGINS.
//
// Wildcard origins are rejected by the security configuration,
// so this never falls back to "*".
// ============================================================

app.use(
    cors({
        origin: (
            origin,
            callback,
        ) => {
            /*
             * Same-origin requests (no Origin header) are
             * allowed. This avoids breaking non-browser clients
             * and local tooling.
             */
            const isDevLocalhost =
                !securityConfig.isProduction &&
                /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

            if (
                !origin ||
                isDevLocalhost ||
                securityConfig.allowedOrigins.includes(
                    origin,
                )
            ) {
                return callback(
                    null,
                    true,
                );
            }

            return callback(
                new Error(
                    "Origin not allowed by CORS policy.",
                ),
            );
        },

        credentials: true,
    }),
);

// ============================================================
// Security Headers
// ============================================================
//
// HSTS, CSP, X-Frame-Options, X-Content-Type-Options are
// applied in production only. In development we keep responses
// flexible for local debugging tools.
// ============================================================

if (securityConfig.isProduction) {
    app.use(
        (
            req,
            res,
            next,
        ) => {
            const headers =
                securityConfig.securityHeaders;

            if (headers.strictTransportSecurity) {
                res.setHeader(
                    "Strict-Transport-Security",
                    "max-age=31536000; includeSubDomains",
                );
            }

            if (headers.xFrameOptions) {
                res.setHeader(
                    "X-Frame-Options",
                    headers.xFrameOptions,
                );
            }

            if (headers.xContentTypeOptions) {
                res.setHeader(
                    "X-Content-Type-Options",
                    headers.xContentTypeOptions,
                );
            }

            if (
                headers.crossOriginOpenerPolicy
            ) {
                res.setHeader(
                    "Cross-Origin-Opener-Policy",
                    headers.crossOriginOpenerPolicy,
                );
            }

            if (
                headers.crossOriginResourcePolicy
            ) {
                res.setHeader(
                    "Cross-Origin-Resource-Policy",
                    headers.crossOriginResourcePolicy,
                );
            }

            if (
                headers.referrerPolicy
            ) {
                res.setHeader(
                    "Referrer-Policy",
                    headers.referrerPolicy,
                );
            }

            if (
                headers.contentSecurityPolicy
            ) {
                res.setHeader(
                    "Content-Security-Policy",
                    [
                        "default-src 'self'",
                        "script-src 'self'",
                        "style-src 'self' 'unsafe-inline'",
                        "img-src 'self' data: https:",
                        "connect-src 'self'",
                        "font-src 'self'",
                        "object-src 'none'",
                        "frame-ancestors 'none'",
                        "base-uri 'self'",
                        "form-action 'self'",
                    ].join("; "),
                );
            }

            next();
        },
    );
}

// ============================================================
// Hide Express Signature
// ============================================================

app.disable(
    "x-powered-by",
);

// ============================================================
// JSON Body Parser
// ============================================================
//
// Normal API requests are parsed as JSON.
//
// Razorpay webhook requests require the ORIGINAL raw payload
// for HMAC signature verification.
//
// The `verify` callback preserves those exact bytes in:
//
//     req.rawBody
//
// We do NOT expose this raw body to the frontend.
//
// ============================================================

app.use(
    express.json({
        limit: "1mb",

        verify: (
            req,
            res,
            buffer,
        ) => {
            if (
                req.originalUrl ===
                "/api/payments/webhook"
            ) {
                req.rawBody =
                    Buffer.from(
                        buffer,
                    );
            }
        },
    }),
);

// ============================================================
// Root / Health
// ============================================================

app.get(
    "/",
    (req, res) => {
        return res.status(
            200,
        ).json({
            success: true,

            message:
                "CuratoCV API is running.",
        });
    },
);

// ============================================================
// Rate Limiting
// ============================================================
//
// Global rate limit applies to all /api/* routes. Auth endpoints
// use a stricter limit (10 per 15 min) via authRateLimitMiddleware
// in their route definitions.
// ============================================================

app.use(
    "/api/",
    rateLimitMiddleware,
);

// ============================================================
// API Routes
// ============================================================

app.use(
    "/api/users",
    userRouter,
);

app.use(
    "/api/resumes",
    resumeRouter,
);

app.use(
    "/api/ai",
    aiRouter,
);

app.use(
    "/api/payments",
    paymentRouter,
);

app.use(
    "/api/subscriptions",
    subscriptionRouter,
);

app.use(
    "/api/notes",
    memoRouter,
);

app.use(
    "/api/health",
    healthRouter,
);

// ============================================================
// 404 Handler
// ============================================================

app.use(
    (req, res) => {
        return res.status(
            404,
        ).json({
            success: false,

            error: {
                code:
                    "ROUTE_NOT_FOUND",

                message:
                    "The requested API route was not found.",
            },
        });
    },
);

// ============================================================
// Global Error Handler
// ============================================================
//
// Expected application errors should be handled by the
// controller/service layer.
//
// This middleware handles unexpected errors and converts
// them to proper HTTP responses.
//
// Production responses intentionally avoid exposing internal
// implementation details.
//
// IMPORTANT: Must be registered AFTER all routes.
// ============================================================

app.use(errorMiddleware);

// ============================================================
// Start Server & Shutdown Handlers
// ============================================================

const server = app.listen(
    PORT,
    () => {
        console.log(
            `CuratoCV server is running on port ${PORT}`,
        );
    },
);

const gracefulShutdown = async () => {
    await closePdfBrowser();
    server.close(() => {
        process.exit(0);
    });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// ============================================================
// Export
// ============================================================
//
// Exporting the application allows integration tests to import
// the Express instance.
//
// Later, we should move app creation into `app.js` and keep
// `server.js` responsible only for startup. That will make
// testing cleaner and prevent tests from opening a real port.
// ============================================================

export default app;