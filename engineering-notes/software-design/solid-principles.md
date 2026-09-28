# SOLID Principles

## 1. Start with the Basics

SOLID is a group of five object-oriented design principles that help code remain understandable as requirements change. They are guidelines, not a certification checklist. A codebase can use some principles well and miss others; applying them mechanically can add complexity without improving the design.

These ideas also apply in JavaScript and TypeScript. A “module” can be a function, class, or file. A “contract” can be an interface/type, documented function behavior, or another stable boundary. Dependency injection can use constructor arguments, factory functions, or plain objects. TypeScript interfaces are not mandatory everywhere.

Useful terms:

- **Responsibility:** a reason a piece of code may need to change.
- **Cohesion:** how closely the work inside a module belongs together.
- **Coupling:** how much one module depends on another module's details.
- **Contract:** the expected inputs, outputs, errors, and side effects at a boundary.
- **Abstraction:** a contract that lets a caller use behavior without knowing its concrete implementation.

## 2. Why These Principles Exist

As a system grows, a small change can require edits across unrelated code. That makes regressions more likely and tests harder to target. SOLID gives engineers questions for finding the cause: are unrelated responsibilities mixed, are callers tied to implementation details, or are replacements violating expected behavior?

The goal is not “more layers.” The goal is to make changes safer where the current code shows a real source of coupling or change pressure.

## 3. One Request Through the Memo Backend

The following is a simplified trace of the verified create-note flow. A client sends `POST /api/notes` with a JSON body. Backend route/middleware wiring mounts the Memo routes and applies the route's authentication behavior; the controller receives the resulting Express request. From there, source calls show:

```text
HTTP POST /api/notes
    ↓ route and authentication middleware
noteController.createNote(req, res, next)
    ├─ reads req.userId and req.body
    ├─ calls noteService.createNote(userId, body)
    ↓
noteService.createNote(userId, data)
    ├─ trims/checks title, content, folder, and tags
    ├─ normalizes note flags
    ├─ calls noteRepository.createNote(userId, normalizedData)
    ↓
noteRepository.createNote(userId, noteData)
    ├─ calls Note.create({ userId, ...noteData })
    ↓
Mongoose model → configured MongoDB connection
    ↓ created document/result returns through repository → service → controller
    ↓
HTTP 201 JSON response
```

The database connection and route/middleware registration are composed outside these three modules. This diagram explains the source-level call chain; it does not claim wire-level details about DNS, TLS, or MongoDB internals that this code path does not establish.

## 4. S — Single Responsibility Principle (SRP)

### Concept: How It Works

**Meaning:** Keep each module focused on one coherent responsibility—one main reason for change. This does not mean one function per file. It means unrelated decisions do not need to change together.

**Internal effect:** When a request crosses a boundary, each module handles its own kind of decision and passes the necessary data onward. An HTTP response-format change can stay in the controller; a business validation change can stay in the service; a database query change can stay in the repository. That separation narrows the likely impact of each change and allows tests to target a layer.

**If responsibilities are mixed:** A single handler might parse HTTP input, validate business rules, query MongoDB, and format output. A change to any one concern risks breaking the others; tests may need to construct the entire runtime just to check a validation rule.

**Failure/change example:** If the title limit changes, the service validation is the relevant decision. If the response status or JSON envelope changes, the controller is relevant. If persistence changes, the repository/model path is relevant. These are useful boundaries only while the responsibilities remain cohesive.

### CuratoCV: What the Code Actually Does

- [`noteController.js`](../../memo/backend/src/controllers/noteController.js) reads `req.userId` and `req.body`, calls `noteService.createNote`, and returns a `201` JSON envelope. Errors are passed to Express via `next(error)`.
- [`noteService.js`](../../memo/backend/src/services/noteService.js) trims and validates title/folder/content, normalizes tags and flags, then delegates persistence.
- [`noteRepository.js`](../../memo/backend/src/repositories/noteRepository.js) constructs the `Note.create(...)` call and returns the created document.
- [`Note.js`](../../memo/backend/src/models/Note.js) defines the persistence model used by the repository.

These imports and calls verify a meaningful separation of HTTP, business-rule, and persistence work. They do not prove every module has exactly one possible reason to change, nor that every operation follows identical validation behavior. Memo route behavior and API compatibility are tested in the backend integration tests, including `backend/Tests/notes.test.js`.

## 5. O — Open/Closed Principle (OCP)

### Concept: How It Works

**Meaning:** Keep stable policy from needing repeated edits when a predictable new variation is added; provide an extension point where new behavior can be supplied.

**Internal mechanism (hypothetical):** Suppose an export service is written against an `Exporter` contract with `export(data)`. The application supplies a PDF implementation. Later, it can supply a DOCX implementation that obeys the same contract. The caller still invokes `exporter.export(data)`; composition/configuration selects the implementation. This avoids adding another format-specific branch to the stable high-level flow.

```text
Export request → Export service → Exporter contract
                                  ├─ PdfExporter → PDF library
                                  └─ DocxExporter → DOCX library
```

**Trade-off:** The extension contract and selection mechanism are additional moving parts. With one stable behavior and no demonstrated variation, a direct function or conditional may be simpler.

**Failure/change example:** If every new format requires editing several unrelated callers, a stable extension seam may help. If an abstraction merely relocates one `if` statement without reducing change impact, it has not bought much.

### CuratoCV: What Is Verified

This exporter flow is teaching material only. The inspected Memo controller/service/repository path does not establish this OCP design or a general plugin mechanism. Do not present it as a CuratoCV implementation. For a real change, first identify current variants and trace their consumers; add an extension point only where that variation is real.

## 6. L — Liskov Substitution Principle (LSP)

### Concept: How It Works

**Meaning:** An implementation must be usable anywhere its contract is expected without breaking the caller's assumptions. The contract includes more than method names: accepted inputs, result shape, error semantics, invariants, and meaningful side effects also matter.

**Internal mechanism (hypothetical):** A service calls `repository.findById(id)`. Runtime composition supplies either a Mongo-backed repository or a memory-backed fake. The service should observe the same defined behavior from both. If a missing record means `NotFoundError` in production but `null` in the fake, a test may pass under behavior that production never has—or callers may break when an implementation is swapped.

```text
Note service → repository contract
                 ├─ Mongo repository
                 └─ in-memory test repository
```

**How to verify:** Run the same contract tests against each implementation: create, lookup, update, deletion, missing records, invalid inputs, and expected failures. Check results and side effects, not just that each method exists.

**Trade-off:** If there is only one implementation and no substitution need, adding multiple implementations just to demonstrate LSP is unnecessary.

### CuratoCV: What Is Verified

No interchangeable Memo repository implementations were verified in the inspected flow. The production service imports one concrete repository. The hypothetical memory-store example is not a claim about existing code or tests.

## 7. I — Interface Segregation Principle (ISP)

### Concept: How It Works

**Meaning:** A consumer should depend only on the operations it needs, rather than a large contract full of unrelated capabilities.

**Internal mechanism (hypothetical):** A listing use case needs `listForUser`; it should not need to know about permanent deletion, restore, or update. A broad `NoteRepository` contract makes the listing consumer depend on capabilities outside its job. Smaller role-oriented contracts reduce the set of changes that can affect that consumer.

```text
List notes use case → NoteReader.listForUser(...)
Delete use case     → NoteDeleter.softDelete(...)
```

In structurally typed JavaScript, passing a small object containing only the needed function can provide this narrow dependency without declaring a formal interface. In TypeScript, separate types can make the boundary explicit.

**Trade-off:** A separate interface for every single method can become ceremony. Split a contract when consumers have distinct needs or the broad contract forces irrelevant dependencies.

### CuratoCV: What Is Verified

`noteService.js` imports the full `noteRepository` module, whose default export includes create, read, list, update, soft delete, restore, and permanent delete operations. The inspected source does not demonstrate consumer-specific repository interfaces. The small `NoteReader` above is hypothetical, not current implementation.

## 8. D — Dependency Inversion Principle (DIP)

### Concept: How It Works

**Meaning:** High-level policy should not be tightly coupled to low-level implementation details. Both should rely on a stable abstraction. The dependency direction in source code can point toward the contract, while the concrete implementation is connected at the application's composition boundary.

**Current-style dependency graph (simplified):**

```text
noteService.js → noteRepository.js → Note model → MongoDB
```

Here the business service statically imports a concrete persistence module. Replacing or isolating that dependency can require module mocking or a database-backed test setup.

**DIP-oriented hypothetical graph:**

```text
Note service → NoteRepository contract ← MongoNoteRepository → Mongoose/MongoDB
                                            ↑
Application composition supplies the concrete implementation
```

At runtime, composition creates the Mongo repository and passes it to a service factory/constructor. A unit test can pass a fake object. Both expose the contract the service calls. This can isolate business-rule tests from database setup and let the high-level service remain unaware of Mongoose.

**Trade-off:** Injection and contracts add setup and indirection. If there is one implementation and integration tests already provide the desired confidence, direct imports may be a reasonable simpler choice. DIP is a design option, not a mandatory refactor.

### CuratoCV: What the Code Actually Does

[`noteService.js`](../../memo/backend/src/services/noteService.js) directly imports `noteRepository.js`. That repository imports `Note.js` and uses Mongoose model operations. Thus this inspected path has concrete service-to-repository and repository-to-model dependencies. Strict DIP at the service/repository boundary is **not verified**. No injected fake repository was established by this source inspection. Do not claim otherwise in an interview.

## 9. Project-Wide Application and Boundaries

SOLID does not override domain ownership. In CuratoCV, Memo behavior belongs to Memo, resume behavior to Resume Builder, and common platform capabilities to Platform. A design that makes code more abstract but moves product behavior into the wrong workspace still violates the repository's architecture.

When considering a design change, ask in order:

1. What behavior or change is difficult today?
2. Which workspace owns it, and what are its real consumers?
3. Which module currently makes the decision?
4. What inputs, outputs, errors, and side effects form its contract?
5. Would a smaller responsibility, extension seam, or abstraction measurably help?
6. Can tests verify the behavior before and after the boundary change?

## 10. Interview-Ready Explanation

“SOLID is five object-oriented design guidelines for managing change. SRP keeps a module focused; OCP uses deliberate extension points for likely variation; LSP says implementations must preserve caller expectations; ISP keeps consumer contracts narrow; and DIP keeps high-level policy from depending directly on low-level details. They apply in JavaScript through modules, functions, object contracts, and composition as well as through classes and TypeScript interfaces. In CuratoCV Memo, the create-note path visibly separates HTTP handling in the controller, validation/business rules in the service, and Mongoose persistence in the repository/model. But the service currently imports the concrete repository, so I would not claim strict DIP. OCP, LSP, and ISP examples in this note are conceptual, not verified CuratoCV implementations.”

## 11. Deep Follow-Up Questions

- Trace `POST /api/notes` from route entry to the `201` response. Which layer reads, validates, persists, and formats data?
- If the title length rule changes, which file owns that decision? What tests demonstrate it?
- How would two exporter implementations be selected without changing the export service? Where would composition happen?
- What is part of a repository contract beyond method signatures? How would shared contract tests detect an LSP violation?
- What does a listing use case depend on in an ISP-oriented design, and what unrelated operations should it not need?
- What exactly is the dependency chain in the current Memo service? What would have to change for injection, and what test benefit would justify it?
- How can a design follow a SOLID principle yet still violate CuratoCV workspace ownership?

## 12. Sources and Verification

- Source paths inspected: `memo/backend/src/controllers/noteController.js`, `memo/backend/src/services/noteService.js`, `memo/backend/src/repositories/noteRepository.js`, `memo/backend/src/models/Note.js`, and `backend/Tests/notes.test.js`.
- Verified source-flow descriptions are limited to those modules and the repository's test references. OCP, LSP, ISP and DIP alternative graphs are explicitly hypothetical teaching examples.
- This note does not certify the whole repository as SOLID-compliant. General design explanations were written for learning; the CuratoCV mapping is based on repository source inspected on 2026-09-25.

See also: [REST APIs](../foundations/rest-apis.md), [HTTP and HTTPS](../foundations/http-and-https.md), [Node.js and Express request lifecycle](../foundations/node-express-request-lifecycle.md), and [Memo Notes API](../memo-notes-api.md) for deeper explanations of the technologies and runtime flow used in the example.
