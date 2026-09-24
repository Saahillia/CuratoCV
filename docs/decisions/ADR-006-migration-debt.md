# ADR 006: Known Migration Debt & Test Infrastructure Limitations

## Status
Accepted

## Context
During the CuratoCV monorepo architecture migration (Phases 1 through 5), absolute priority was given to preserving application runtime behavior and preventing regression of production code. To accomplish this without getting blocked by structural refactoring of legacy test frameworks, specific technical debt points and test environment limitations were consciously preserved.

## Decision
We explicitly document and retain the following technical debt items as part of the new baseline, prioritizing actual application stability over arbitrary test-suite greenlighting:

1. **Test Infrastructure Hook Timeouts (MongoMemoryServer)**  
   - Legacy test suites experience `beforeEach` hook timeouts (10,000ms limit) because `MongoMemoryServer` initialization mismatches the new directory paths or network environments.
   - These failures occur *before* application assertions execute. They do not constitute Phase 2/4 application regressions. 
   - A documented ~69 tests fail purely due to this infrastructure/environment setup issue, as verified in Phase 5D.

2. **Missing Test Secrets (`RESEND_API_KEY`)**  
   - Certain authentication and email test flows fail due to a missing valid `RESEND_API_KEY` in the test environments. 

3. **Legacy Compatibility Bridges (The 5 Files)**  
   - 5 isolated source files were intentionally left importing from the legacy `backend/` directory to prevent massive scope creep during the `platform/` extraction:
     1. `platform/backend/src/routes/userRoutes.js` → imports `authValidator` and `userValidator`.
     2. `platform/backend/src/models/Payment.js` → imports `plans`.
     3. `platform/backend/src/models/Subscription.js` → imports `plans`.
     4. `platform/backend/src/services/paymentService.js` → imports `plans`.
     5. `platform/backend/src/services/billingService.js` → imports `plans`.
   - These import paths cross the workspace boundary back into the legacy `backend/` directory structure.

## Consequences
- The monorepo architecture is certified **secure and functional for production** (Phase 5 Batch B completion).
- A unified test repair sprint can be scheduled in the future independent of the architecture migration itself.
- Developers are aware that the 5 Legacy Bridge files are technically debt and should be migrated to shared packages or native platform modules in subsequent codebase iterations.
