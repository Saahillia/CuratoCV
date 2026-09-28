# CuratoCV Engineering Notes

This root folder contains one learning note per independently teachable concept, feature, or meaningful engineering topic. Do not combine unrelated concepts into one large file. A cohesive family may share a note when each member has its own section (for example, SOLID has one file with separate sections for S, O, L, I, and D); API, authentication, and HTTPS should each have their own notes. Notes are for understanding and explaining the system, including technical interviews; they complement rather than replace `docs/architecture/`, ADRs, API docs, and runbooks.

## Learning Note Catalog

### Architecture and Engineering

- [Monorepo workspaces and dependency boundaries](architecture/monorepo-workspaces-and-dependency-boundaries.md)
- [Application composition and routing](application-composition-and-routing.md)
- [SOLID principles](software-design/solid-principles.md)
- [Shared branding and responsive design system](shared-branding-and-responsive-design-system.md)

### Platform

- [Authentication and account lifecycle](platform-authentication-and-account-lifecycle.md)
- [Billing, payments, subscriptions, and entitlements](billing-payments-and-entitlements.md)

### Resume Builder

- [Editor and persistence](resume-builder-editor-and-persistence.md)
- [Profile image upload and validation](resume-image-upload-and-validation.md)
- [AI assistance](resume-ai-assistance.md)
- [Rendering and PDF export](resume-rendering-and-pdf-export.md)
- [Preview section rendering and section dispatch](resume-preview-section-rendering.md)
- [Scale-independent A4 pagination](scale-independent-a4-pagination.md)
- [Sharing and public preview](resume-sharing-and-public-preview.md)

### Memo

- [MEMO — PAGE BOOKMARKS V1](memo-page-bookmarks-v1.md)
- [Memo Editor V2 Architecture](memo-editor-v2-architecture.md)
- [Memo Notes API](memo-notes-api.md)
- [Memo workspace: document list and creation](memo-workspace-document-list-and-create.md)
- [Memo folder hierarchy and responsive navigation](memo-folder-hierarchy-and-responsive-navigation.md)
- [Memo recursive folder deletion](memo-recursive-folder-deletion.md)
- [Memo hybrid search](memo-search-hybrid.md)

### Shared and Foundational Concepts

- [Shared API client and utilities](shared-api-client-and-utils.md)
- [REST APIs](foundations/rest-apis.md)
- [HTTP and HTTPS](foundations/http-and-https.md)
- [JWT internals](foundations/jwt.md)
- [Node.js and Express request lifecycle](foundations/node-express-request-lifecycle.md)
- [React rendering and state](foundations/react-rendering-and-state.md)
- [MongoDB and Mongoose](foundations/mongodb-and-mongoose.md)
- [AI guardrails and trust boundaries](foundations/ai-guardrails.md)

The catalog covers current major product flows and the core technologies used by those flows. It is not a claim that every individual UI component, helper function, or future feature already has a note. Add a dedicated file when a new independently teachable capability or concept is implemented.

## How to Use These Notes

- Start at the beginning. For each concept, explain **What → Why → Internal working → actual CuratoCV flow → code/layers → failure modes and trade-offs → interview follow-ups**. Teach the general idea and internal mechanics first, then put the CuratoCV-specific implementation directly after it in a clearly separate section. Trace verified imports/calls, data or control flow, errors, tests, and gaps; label hypothetical examples explicitly.
- Treat **General concept** as technology background and **CuratoCV implementation (verified)** as claims checked against source, manifests, tests, or runtime behavior.
- Read the linked source paths when implementation details change. Update the note with the code change that makes it stale.
- Do not claim CuratoCV uses a technology or production control just because the note explains it generally. Mark unverified deployment behavior and planned work clearly.
- Keep one file per independently explainable concept or feature. Use descriptive kebab-case filenames, for example `solid-principles.md`, `memo-note-lifecycle.md`, or `resume-ai-request-flow.md`. Related subprinciples can be sections within their shared concept file; unrelated topics get separate files.

## Note Structure

Use the following sequence, adapting sections when they do not apply. For each major concept or sub-concept, cover **What → Why → Internal working → actual CuratoCV flow → code/layers → failure modes and trade-offs → interview follow-ups**, keeping the order **general understanding first → CuratoCV understanding second** so the reader learns the idea before seeing how this repository uses it.

1. **Plain-language summary** — explain it as if the reader is new to the topic.
2. **What it is** — core concept and terminology.
3. **Why it is needed** — user problem and engineering goals.
4. **Where it lives** — canonical owner and relevant files/packages.
5. **When it runs** — entrypoint, user action, or trigger.
6. **End-to-end flow** — request/data/control flow in both directions where relevant.
7. **Internal layers** — explain each layer's responsibility and handoff.
8. **Security and failure cases** — trust boundaries, abuse, errors, retries, and recovery.
9. **CuratoCV implementation** — verified behavior, contracts, state/data, dependencies, and tests.
10. **Why this design and trade-offs** — alternatives and reasons, separating recorded decisions from inference.
11. **How to verify or operate it** — exact commands, signals, configuration, and known limitations.
12. **Interview-ready explanation and questions** — concise explanation plus likely cross-questions.
13. **Sources and verification date** — repository paths, official technical references when needed, and claims not yet verified.

The explanation should go from basics to implementation detail. Define unfamiliar terms before using them. Diagrams and examples are welcome when they clarify the real flow. Never copy generic example architecture into a CuratoCV note as if the project implemented it.
