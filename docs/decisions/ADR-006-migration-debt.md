# ADR 006: Known Migration Debt & Test Infrastructure Limitations

## Status
Accepted

## Context
During the CuratoCV monorepo architecture migration and Batch IV repository canonicalization, absolute priority was given to preserving application runtime behavior and preventing regression of production code.

## Decision
We document the current baseline state:
1. **Test Infrastructure Hook Timeouts (MongoMemoryServer)**  
   - Legacy test suites experience `beforeEach` hook timeouts due to memory server startup in specific host network environments.
2. **Missing Test Secrets (`RESEND_API_KEY`)**  
   - Email tests require explicit API credentials.
3. **Legacy Compatibility Bridges Resolved**  
   - The 5 legacy file import boundaries have been fully internalized into `platform/backend/`.

## Consequences
- The monorepo architecture is certified secure and functional for production.
- Repository canonicalization (Batch IV) removed ~118 dead legacy frontend files and root backend duplicate subdirectories.
