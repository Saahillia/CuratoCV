// ============================================================
// CuratoCV Health Controller
// ============================================================
//
// Provides health check endpoints for monitoring and orchestration.
//
// Responsibilities:
// - Liveness probe (is the process running?)
// - Readiness probe (is the app ready to serve traffic?)
// - Database connectivity check
//
// NOT responsible for:
// - Business logic
// - Authentication
// - Database operations beyond ping
//
// ============================================================

import mongoose from "mongoose";

import ApiError from "../utils/apiError.js";

// ============================================================
// Health Checks
// ============================================================

const checkDatabase = async () => {
    const state = mongoose.connection.readyState;

    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (state !== 1) {
        throw new ApiError(
            503,
            "Database not connected.",
            { code: "DATABASE_UNAVAILABLE" }
        );
    }

    // Quick ping
    await mongoose.connection.db.admin().ping();

    return { status: "healthy" };
};

// ============================================================
// Liveness Probe
// ============================================================
//
// GET /api/health/live
//
// Indicates if the process is running.
// Does NOT check dependencies.
// Should never fail unless process is dead.
//
// Kubernetes: livenessProbe
// ============================================================

const getLiveness = (req, res) => {
    return res.status(200).json({
        success: true,
        status: "alive",
        timestamp: new Date().toISOString(),
    });
};

// ============================================================
// Readiness Probe
// ============================================================
//
// GET /api/health/ready
//
// Indicates if the app can serve traffic.
// Checks critical dependencies (database).
//
// Kubernetes: readinessProbe
// ============================================================

const getReadiness = async (req, res, next) => {
    try {
        const dbHealth = await checkDatabase();

        return res.status(200).json({
            success: true,
            status: "ready",
            timestamp: new Date().toISOString(),
            checks: {
                database: dbHealth,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// ============================================================
// Detailed Health
// ============================================================
//
// GET /api/health
//
// Provides comprehensive health information for monitoring.
// ============================================================

const getHealth = async (req, res, next) => {
    try {
        const dbHealth = await checkDatabase();

        const uptime = process.uptime();
        const memory = process.memoryUsage();

        return res.status(200).json({
            success: true,
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
            memory: {
                rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
            },
            checks: {
                database: dbHealth,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// ============================================================
// Export
// ============================================================

const healthController = Object.freeze({
    getLiveness,
    getReadiness,
    getHealth,
});

export default healthController;