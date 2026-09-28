# Resume Profile Image Upload and Validation

## 1. What Secure Upload Processing Means

An upload is untrusted bytes, even if the browser calls it a JPEG or gives it a friendly filename. A safe flow bounds resource use, checks the actual content, decodes it with a real parser, generates/normalizes storage names, stores it through a controlled service, and records only server-approved metadata.

## 2. Why Multiple Validation Layers Exist

The request's MIME type and filename are supplied by the client and can be forged. A parser limit protects memory before application code runs; signatures catch obvious mismatches; decoding catches malformed content; dimension limits mitigate huge pixel allocations. The remote storage provider should receive data only after local checks.

## 3. CuratoCV Upload Flow (Verified)

```text
Authenticated PUT /api/resumes/update/:id
 → Multer memory storage (one file, bounded size/fields)
 → controller checks ID, body size/shape, ownership lookup
 → MIME/size/buffer checks
 → magic-byte checks + Sharp decode/dimension validation
 → ImageKit service upload with normalized filename/unique name
 → canonical { url, fileId } added to sanitized resume data
 → ownership-aware/version-aware Mongo update
 → old asset cleanup after DB success
```

Platform's `configs/multer.js` parses multipart data into memory and applies limits. Resume Builder's `utils/imageValidation.js` validates JPEG/PNG/WebP signatures, decodes through Sharp, enforces format/dimensions, and validates persisted photo objects against a canonical HTTPS URL/file ID shape and configured ImageKit origin. The controller then delegates to `imageService`, which calls ImageKit, uses a normalized filename and unique provider name, and returns provider metadata.

The controller persists the new `personalInfo.photo` object only after upload succeeds. If database persistence fails, it tries to delete the newly uploaded asset. When replacing/removing an image, it deletes the previous asset only after the database update succeeds; cleanup failures are logged without invalidating the already-successful resume update.

## 4. Failure and Trade-offs

- Memory storage can use RAM up to the configured request limits; limits must match traffic and process memory.
- MIME/signature/parser disagreement rejects the upload. Sharp decode also costs CPU and memory and needs bounded dimensions.
- ImageKit outages fail the operation with a controlled error; a successful provider upload followed by DB failure triggers compensating deletion.
- Compensating cleanup is not a distributed transaction. If cleanup fails, an orphaned provider asset may remain and needs operational cleanup.
- ImageKit URLs are public HTTPS asset URLs in the current canonical model; do not upload confidential content under this profile-photo flow without revisiting access policy.
- Background removal is requested through ImageKit transformation URL parameters; source does not prove a separate CuratoCV-owned image model or pipeline.

## 5. How to Verify

Tests include `backend/Tests/imageValidation.test.js`, `imageReplacement.test.js`, `imageReplacementIntegration.test.js`, `photoRemoval.test.js`, and `resumeDeletionCleanup.test.js`. Source paths: `platform/backend/src/configs/multer.js`, `resumebuilder/backend/src/controllers/resumeController.js`, `utils/imageValidation.js`, `services/imageService.js`, and `configs/imageKit.js`.

## 6. Interview Explanation

“The client upload is treated as hostile. Multer limits a single in-memory file and multipart fields. Resume Builder then checks the declared type and size, verifies magic bytes, decodes the image with Sharp, and enforces dimensions before ImageKit upload. Only a server-generated canonical URL/file ID is persisted. On replacement, the new object is saved before old-asset deletion; if the database write fails, the service tries to roll back the newly uploaded asset.”

Follow-ups: Why isn't MIME validation enough? What does magic-byte validation prove? Why use memory storage and what is its risk? Why delete the old asset after database commit? What if compensating deletion fails? How are external image URLs prevented?

## 7. Sources and Limits

Verified files: `platform/backend/src/configs/multer.js`, `resumebuilder/backend/src/routes/resumeRoutes.js`, `controllers/resumeController.js`, `utils/imageValidation.js`, `services/imageService.js`, `configs/imageKit.js`, and upload/replacement tests. Malware scanning, provider-side privacy settings, and production orphan cleanup are not claimed unless separately configured and verified.
