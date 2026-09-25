# CuratoCV Codebase Map

## Architecture Overview
- **Shell**: `frontend/` (React entry, Routing, Global State)
- **Composition Root**: `backend/server.js`
- **Domains**: 
  - `platform/` (Auth, User, Billing, Subscriptions)
  - `resumebuilder/` (Resume Logic, AI, PDF)
  - `memo/` (Notes module)
- **Packages**: `packages/` (api-client, shared-utils)

## Feature Guide
- New routes: Add to `frontend/src/App.jsx`
- New API: Add to `backend/server.js` and route in domain/`backend/src/routes/`
