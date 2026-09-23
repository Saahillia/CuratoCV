// ============================================================
// CuratoCV Test Setup
// ============================================================
//
// Shared setup for backend Vitest tests.
//
// IMPORTANT
// ------------------------------------------------------------
// This file must remain lightweight.
//
// Unit tests should NOT automatically:
// - connect to MongoDB
// - start external services
// - call Razorpay
// - call Resend
// - call Gemini
// - start Express
//
// Database and external-service setup belongs to the relevant
// integration test suites.
//
// This keeps unit tests:
// - fast
// - deterministic
// - isolated
// - inexpensive
// - easy to run locally and in CI
// ============================================================

// ============================================================
// Environment
// ============================================================
//
// Test code should never accidentally use production
// credentials.
//
// Individual integration suites can provide the environment
// variables they specifically require.
//

process.env.NODE_ENV = "test";
