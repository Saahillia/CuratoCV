# MongoDB and Mongoose

## What They Are

MongoDB is a document database: records are stored as BSON documents in collections rather than rows in relational tables. Mongoose is a Node.js object-document mapper (ODM) that provides schemas, models, casting, validation hooks, and query helpers over MongoDB. Mongoose does not remove the need to understand query behavior, indexes, consistency, or authorization.

## Why CuratoCV Uses This Layer

CuratoCV backend domain modules persist users, resumes, subscriptions/payments, and notes as Mongoose models. The root backend initializes one configured Mongoose connection; domain repositories/services issue operations through models. This keeps connection configuration centralized while domain data remains owned by its domain.

## General Data Flow

```text
Request → service rules/ownership → repository/model query
 → Mongoose casts/validates and sends operation through connection
 → MongoDB reads/writes document/indexes
 → result/error returns to application → HTTP response
```

The model describes shape and hooks; a repository or service decides which query to issue. Indexes affect query performance and uniqueness but need careful migration/production consideration. A multi-step workflow is not automatically transactional merely because each operation uses MongoDB.

## CuratoCV Connection and Example

`backend/server.js` awaits `connectDB()` from `platform/backend/src/configs/db.js` before listening. The connector validates `MONGODB_URI` protocol and database-name configuration, sets connection timeouts, and registers connection events. Mongoose major version is aligned at 8 across direct backend model packages in the current workspace.

For Memo, `noteService.js` validates note rules and calls `noteRepository.js`; the repository imports the `Note` model and issues queries that include `userId`. For Resume Builder, its service/repository/model path owns resume data and ownership. Platform user and billing models remain Platform-owned.

## Failure and Trade-offs

- Startup fails clearly if URI config is absent or invalid; runtime DB outages can fail reads/writes and affect readiness.
- ODM validation helps enforce shape but must not substitute for service authorization or request-level limits.
- Query filters must include ownership where data is user-owned; looking up by `_id` alone can create IDOR risk.
- Connection reuse is important; opening one connection per request is expensive.
- Mongoose abstractions are productive but can obscure generated queries and indexes; inspect query plans for performance-sensitive paths.
- Schema/index changes require backward-compatible migration planning and are outside a routine feature note.

## Interview Explanation

“MongoDB stores documents; Mongoose is the Node ODM that maps application models to Mongo collections and adds schema validation/hooks. CuratoCV connects once during backend startup. Domain services apply rules, repositories issue Mongoose model operations, and user-owned queries include the authenticated user ID. Mongoose does not itself decide authorization or make multi-step billing operations transactional.”

Follow-ups: What does Mongoose provide beyond the Mongo driver? Why connect before listen? How do indexes affect queries? Why is `_id` lookup alone unsafe? When would a transaction be needed?

## Sources and Limits

Verified: `platform/backend/src/configs/db.js`, domain models/repositories under Platform, Resume Builder, Memo, and package manifests. The production cluster topology, indexes in the live database, backup policy, and operational recovery were not inspected or certified.
