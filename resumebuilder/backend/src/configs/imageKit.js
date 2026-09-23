import ImageKit from "@imagekit/nodejs";

// ============================================================
// ImageKit Server Configuration
// ============================================================
//
// This module creates the server-side ImageKit client.
//
// SECURITY:
// - IMAGEKIT_PRIVATE_KEY must exist only on the backend.
// - Never expose it through Vite/frontend environment variables.
// - Never hard-code it in source code.
// - Never log it.
// - Never return it through an API response.
// - Never accept it from a client request.
//
// Uploads, validation, transformations, and deletion belong
// to imageService.js, not this configuration module.
// ============================================================

// ============================================================
// Environment configuration
// ============================================================

const imageKitPrivateKey =
    process.env.IMAGEKIT_PRIVATE_KEY?.trim();

// ============================================================
// Configuration validation
// ============================================================

if (!imageKitPrivateKey) {
    throw new Error(
        "IMAGEKIT_PRIVATE_KEY is not configured."
    );
}

// ============================================================
// ImageKit client
// ============================================================

const imageKit = new ImageKit({
    privateKey: imageKitPrivateKey,
});

// ============================================================
// Export
// ============================================================

export default imageKit;