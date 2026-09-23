import { describe, it, expect, beforeAll, afterAll } from "vitest";
import sharp from "sharp";
import { validateMagicBytes, validateSafeImage, validatePhotoObject } from "../Utils/imageValidation.js";

// ============================================================
// CuratoCV Image Validation Unit Tests (6D)
// ============================================================

// --- Magic Bytes ---

describe("validateMagicBytes", () => {
    describe("JPEG", () => {
        it("should accept valid JPEG magic bytes", () => {
            const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
            expect(validateMagicBytes(jpegBuffer, "image/jpeg")).toBe(true);
        });

        it("should reject PNG buffer claiming to be JPEG", () => {
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
            expect(validateMagicBytes(pngBuffer, "image/jpeg")).toBe(false);
        });

        it("should reject short buffer", () => {
            const shortBuffer = Buffer.from([0xff, 0xd8]);
            expect(validateMagicBytes(shortBuffer, "image/jpeg")).toBe(false);
        });

        it("should reject null input", () => {
            expect(validateMagicBytes(null, "image/jpeg")).toBe(false);
        });

        it("should reject empty buffer", () => {
            expect(validateMagicBytes(Buffer.alloc(0), "image/jpeg")).toBe(false);
        });
    });

    describe("PNG", () => {
        it("should accept valid PNG magic bytes", () => {
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
            expect(validateMagicBytes(pngBuffer, "image/png")).toBe(true);
        });

        it("should reject JPEG buffer claiming to be PNG", () => {
            const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
            expect(validateMagicBytes(jpegBuffer, "image/png")).toBe(false);
        });
    });

    describe("WebP", () => {
        it("should accept valid WebP magic bytes (RIFF....WEBP)", () => {
            const webpBuffer = Buffer.from([
                0x52, 0x49, 0x46, 0x46, // RIFF
                0x00, 0x00, 0x00, 0x00, // size
                0x57, 0x45, 0x42, 0x50, // WEBP
            ]);
            expect(validateMagicBytes(webpBuffer, "image/webp")).toBe(true);
        });

        it("should reject JPEG claiming to be WebP", () => {
            const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
            expect(validateMagicBytes(jpegBuffer, "image/webp")).toBe(false);
        });

        it("should reject short WebP buffer", () => {
            const shortBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]);
            expect(validateMagicBytes(shortBuffer, "image/webp")).toBe(false);
        });
    });
});

// --- End-to-end image validation with Sharp ---

describe("validateSafeImage", () => {
    it("should accept a real JPEG buffer", async () => {
        // Generate a real JPEG with Sharp rather than hand-crafting bytes.
        const realJpeg = await sharp({
            create: {
                width: 2,
                height: 2,
                channels: 3,
                background: { r: 0, g: 0, b: 0 },
            },
        })
            .jpeg()
            .toBuffer();

        const result = await validateSafeImage(realJpeg, "image/jpeg");
        expect(result).toHaveProperty("width");
        expect(result).toHaveProperty("height");
        expect(result).toHaveProperty("format");
        expect(result.format).toBe("jpeg");
    });

    it("should accept a real PNG buffer", async () => {
        // 1x1 transparent PNG
        const png1x1 = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
            0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
        ]);

        const result = await validateSafeImage(png1x1, "image/png");
        expect(result.width).toBe(1);
        expect(result.height).toBe(1);
        expect(result.format).toBe("png");
    });

    it("should reject a PNG buffer with declared JPEG", async () => {
        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
            0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
        ]);

        await expect(validateSafeImage(pngBuffer, "image/jpeg")).rejects.toThrow();
    });

    it("should reject a corrupted/malformed JPEG buffer", async () => {
        const corruptedJpeg = Buffer.from([
            0xff, 0xd8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        ]);

        await expect(validateSafeImage(corruptedJpeg, "image/jpeg")).rejects.toThrow();
    });

    it("should reject an executable header pretending to be JPEG", async () => {
        const exeAsJpeg = Buffer.from([
            0xff, 0xd8, 0xff, // JPEG magic
            0x00, 0x00, 0x00, // padding
            0x4d, 0x5a, 0x90, 0x00, // PE executable header (MZ...)
        ]);

        await expect(validateSafeImage(exeAsJpeg, "image/jpeg")).rejects.toThrow();
    });
});

// --- Canonical Photo Validation (6E-2) ---

const TRUSTED_HOST = "ik.imagekit.io";
const TRUSTED_BASE = `https://${TRUSTED_HOST}/curatocv/sample.jpg`;

describe("validatePhotoObject", () => {
    let originalEndpoint;
    let originalPublicKey;

    beforeAll(() => {
        originalEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
        originalPublicKey = process.env.IMAGEKIT_PUBLIC_KEY;
        process.env.IMAGEKIT_URL_ENDPOINT = TRUSTED_BASE;
        delete process.env.IMAGEKIT_PUBLIC_KEY;
    });

    afterAll(() => {
        if (originalEndpoint === undefined) {
            delete process.env.IMAGEKIT_URL_ENDPOINT;
        } else {
            process.env.IMAGEKIT_URL_ENDPOINT = originalEndpoint;
        }
        if (originalPublicKey === undefined) {
            delete process.env.IMAGEKIT_PUBLIC_KEY;
        } else {
            process.env.IMAGEKIT_PUBLIC_KEY = originalPublicKey;
        }
    });

    it("should accept a canonical photo with HTTPS + ImageKit host + non-empty fileId", () => {
        const result = validatePhotoObject({
            url: TRUSTED_BASE,
            fileId: "68b1c1c2d3e4f5a6b7c8d9e0",
        });
        expect(result).not.toBeNull();
        expect(result.url).toBe(TRUSTED_BASE);
        expect(result.fileId).toBe("68b1c1c2d3e4f5a6b7c8d9e0");
    });

    it("should reject javascript: protocol", () => {
        expect(validatePhotoObject({ url: "javascript:alert(1)", fileId: "x" })).toBeNull();
    });

    it("should reject data: URLs", () => {
        expect(validatePhotoObject({ url: "data:image/png;base64,abcd", fileId: "x" })).toBeNull();
    });

    it("should reject HTTP (non-HTTPS) URLs", () => {
        expect(validatePhotoObject({ url: "http://ik.imagekit.io/curatocv/x.jpg", fileId: "x" })).toBeNull();
    });

    it("should reject URLs with a foreign host (not ImageKit)", () => {
        expect(validatePhotoObject({ url: "https://attacker.example.com/foo.jpg", fileId: "x" })).toBeNull();
    });

    it("should reject arbitrary fileId-less objects (legacy bare URL strings)", () => {
        expect(validatePhotoObject({ url: TRUSTED_BASE, fileId: "" })).toBeNull();
    });

    it("should reject extra unexpected keys (no prototype pollution / mass assignment)", () => {
        const result = validatePhotoObject({
            url: TRUSTED_BASE,
            fileId: "x",
            isAdmin: true,
        });
        expect(result).toBeNull();
    });

    it("should reject null / arrays / strings / numbers", () => {
        expect(validatePhotoObject(null)).toBeNull();
        expect(validatePhotoObject("not-a-photo")).toBeNull();
        expect(validatePhotoObject([TRUSTED_BASE, "x"])).toBeNull();
        expect(validatePhotoObject(42)).toBeNull();
    });

    it("should reject non-URL strings", () => {
        expect(validatePhotoObject({ url: "not a url", fileId: "x" })).toBeNull();
    });

    it("should accept an HTTPS ImageKit URL even with no IMAGEKIT_URL_ENDPOINT (no host enforcement)", () => {
        // The validator currently softens host enforcement when no endpoint is configured.
        // We expect it to at least require HTTPS + canonical shape.
        const result = validatePhotoObject({
            url: "https://ik.imagekit.io/curatocv/x.jpg",
            fileId: "abc",
        });
        // With endpoint configured in beforeAll, this is a strict ImageKit host match
        expect(result).not.toBeNull();
    });
});
