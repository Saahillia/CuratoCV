// ============================================================
// CuratoCV Health Routes
// ============================================================
//
// Health check endpoints for monitoring and orchestration.
//
// Endpoints:
// - GET /api/health/live      - Liveness probe (process alive)
// - GET /api/health/ready     - Readiness probe (can serve traffic)
// - GET /api/health           - Detailed health info
//
// No authentication required.
// These endpoints should be accessible to load balancers
// and monitoring systems.
//
// ============================================================

import express from "express";

import healthController from "../Controllers/healthController.js";

// ============================================================
// Router
// ============================================================

const router = express.Router();

// ============================================================
// Liveness Probe
// ============================================================
// Lightweight check - no dependencies
router.get("/live", healthController.getLiveness);

// ============================================================
// Readiness Probe
// ============================================================
// Checks critical dependencies (database)
router.get("/ready", healthController.getReadiness);

// ============================================================
// Detailed Health
// ============================================================
// Comprehensive health information
router.get("/", healthController.getHealth);

// ============================================================
// Export
// ============================================================

export default router;