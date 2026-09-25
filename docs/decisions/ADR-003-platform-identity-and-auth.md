# ADR 003: Platform Identity & Auth Extraction

## Status
Accepted

## Context
User authentication, password management, OTP verification, and JWT token issuance were previously spread across application endpoints. Monorepo architecture requires central identity management for all products.

## Decision
All user registration, login, JWT issuance, OTP lifecycle management, and session authentication are extracted into `@curatocv/platform-backend` (`platform/backend/src/services/userService.js`, `otpService.js`, `authMiddleware.js`).

## Consequences
- Single source of truth for user credentials across all products.
- Product services authenticate requests via shared `authMiddleware`.
- Consistent session security and token validation across products.
