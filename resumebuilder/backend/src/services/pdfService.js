/**
 * Developer context for resumebuilder/backend/src/services/pdfService.js.
 * Purpose: render resume HTML to PDF and reuse/close the Puppeteer browser process.
 * Why here: product policy stays in Resume Builder; Platform and repositories supply common capabilities/data access.
 */
import fs from "node:fs";
import puppeteer from "puppeteer";

// ============================================================
// CuratoCV PDF Service
// ============================================================
//
// Responsible for:
// - Generating resume PDFs
// - Rendering resume HTML
// - Applying print/PDF settings
// - Generating safe PDF filenames
//
// IMPORTANT:
// The PDF filename is derived from the actual resume title.
// The resume title is the authoritative source of truth.
//
// Example:
//
// Resume title:
//     "Senior Software Engineer"
//
// Downloaded file:
//     "Senior-Software-Engineer_CuratoCV.pdf"
//
// NOT responsible for:
// - Authentication
// - Authorization
// - HTTP responses
// - MongoDB access
// - Resume ownership checks
// - Resume business validation
//
// Those responsibilities belong to middleware, repositories,
// services, validators, and controllers.
// ============================================================

// ============================================================
// Configuration
// ============================================================

const PDF_CONFIG = Object.freeze({
    format: "A4",

    printBackground: true,

    preferCSSPageSize: true,

    margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
    },
});

// ============================================================
// Chrome Resolution
// ============================================================
//
// Puppeteer pins one exact Chrome build. If that download is
// missing on the host, `puppeteer.launch()` rejects with
// "Could not find Chrome" and every PDF request fails with a
// 500 instead of returning a PDF.
//
// Resolution order:
//   1. PUPPETEER_EXECUTABLE_PATH — explicit operator override
//   2. Puppeteer's own pinned build, when it is installed
//   3. A Chrome/Chromium already installed on the host
//
// Returning `undefined` keeps Puppeteer's default resolution,
// so behavior is unchanged on hosts that have the pinned build.
// ============================================================

const CHROME_FALLBACK_PATHS = Object.freeze([
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/opt/google/chrome/chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]);

const isUsableExecutable = (value) => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        return false;
    }

    try {
        return fs.existsSync(value);
    } catch {
        return false;
    }
};

const resolveChromeExecutable = () => {
    const configured =
        process.env.PUPPETEER_EXECUTABLE_PATH;

    if (
        isUsableExecutable(configured)
    ) {
        return configured;
    }

    try {
        const pinned =
            puppeteer.executablePath();

        if (
            isUsableExecutable(pinned)
        ) {
            /*
             * The pinned build is installed; let Puppeteer
             * resolve it exactly as before.
             */
            return undefined;
        }
    } catch {
        /*
         * The pinned download is missing on this host, so
         * fall through to a locally installed Chrome.
         */
    }

    return CHROME_FALLBACK_PATHS.find(
        isUsableExecutable,
    );
};

// ============================================================
// Browser Instance
// ============================================================
//
// Launching Chromium for every PDF request is expensive.
//
// We reuse one browser instance and create a separate page
// for every PDF generation request.
// ============================================================

let browserPromise = null;

const launchBrowser = async () => {
    if (!browserPromise) {
        const executablePath =
            resolveChromeExecutable();

        browserPromise = Promise.race([
            puppeteer.launch({
                headless: true,

                executablePath,

                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                ],
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Browser launch timed out")), 20000))
        ]);

        /*
         * If browser startup fails, clear the promise so a
         * later request can retry.
         */
        browserPromise.catch(() => {
            browserPromise = null;
        });
    }

    return browserPromise;
};

// ============================================================
// Filename Helpers
// ============================================================

const sanitizeFilenamePart = (
    value,
    fallback
) => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        return fallback;
    }

    return value
        .trim()
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^[-_.]+|[-_.]+$/g,
            ""
        )
        .slice(0, 100) || fallback;
};

// ============================================================
// PDF Filename
// ============================================================
//
// The filename is ALWAYS generated from the resume title.
//
// Required format:
//
// <resume-title>_CuratoCV.pdf
//
// Examples:
//
// "Senior Software Engineer"
//     → Senior-Software-Engineer_CuratoCV.pdf
//
// "Amazon Application"
//     → Amazon-Application_CuratoCV.pdf
//
// "My Resume / 2026"
//     → My-Resume-2026_CuratoCV.pdf
// ============================================================

const createPdfFilename = ({
    resumeTitle,
    websiteName = "CuratoCV",
}) => {
    const safeResumeTitle =
        sanitizeFilenamePart(
            resumeTitle,
            "resume"
        );

    const safeWebsiteName =
        sanitizeFilenamePart(
            websiteName,
            "CuratoCV"
        );

    return `${safeResumeTitle}_${safeWebsiteName}.pdf`;
};

// ============================================================
// HTML Validation
// ============================================================

const validateHtml = (
    html
) => {
    if (
        typeof html !== "string"
    ) {
        throw new Error(
            "Resume HTML must be a string."
        );
    }

    const normalizedHtml =
        html.trim();

    if (!normalizedHtml) {
        throw new Error(
            "Resume HTML cannot be empty."
        );
    }

    /*
     * The HTML should be generated by CuratoCV's own resume
     * rendering layer.
     *
     * This service is NOT intended to become a general-purpose
     * arbitrary HTML-to-PDF endpoint.
     */
    if (
        normalizedHtml.length >
        2_000_000
    ) {
        throw new Error(
            "Resume HTML is too large to generate a PDF."
        );
    }

    return normalizedHtml;
};

// ============================================================
// Resume Title Validation
// ============================================================

const validateResumeTitle = (
    resumeTitle
) => {
    if (
        typeof resumeTitle !==
            "string" ||
        !resumeTitle.trim()
    ) {
        throw new Error(
            "Resume title is required to generate the PDF."
        );
    }

    return resumeTitle.trim();
};

// ============================================================
// Generate Resume PDF
// ============================================================
//
// Input:
//
// {
//     html: "<html>...</html>",
//     resumeTitle: "Senior Software Engineer"
// }
//
// Returns:
//
// {
//     buffer: Buffer,
//     filename: "Senior-Software-Engineer_CuratoCV.pdf"
// }
// ============================================================

const generateResumePdf = async ({
    html,
    resumeTitle,
}) => {
    const validatedHtml =
        validateHtml(
            html
        );

    const validatedResumeTitle =
        validateResumeTitle(
            resumeTitle
        );

    const filename =
        createPdfFilename({
            resumeTitle:
                validatedResumeTitle,
        });

    const browser =
        await launchBrowser();

    let page = null;

    try {
        page =
            await browser.newPage();

        /*
         * Keep the page isolated from other PDF requests.
         */
        await page.setCacheEnabled(
            false
        );

        /*
         * We inject controlled HTML directly into the page.
         * Set a timeout to prevent hanging if content injection fails.
         */
        await Promise.race([
            page.setContent(validatedHtml, { waitUntil: "load" }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Content injection timed out")), 60000))
        ]);

        /*
         * Wait for fonts so the generated PDF matches the
         * resume preview as closely as possible, but with a timeout
         * so it doesn't hang indefinitely if CDN fonts fail.
         */
        await page.evaluate(
            async () => {
                if (
                    document.fonts &&
                    document.fonts.ready
                ) {
                    await Promise.race([
                        document.fonts.ready,
                        new Promise((resolve) => setTimeout(resolve, 5000))
                    ]);
                }
            }
        );

        /*
         * Wait for all images to finish loading/decoding.
         * Add a timeout here as well.
         */
        await Promise.race([
            page.evaluate(
                async () => {
                    const images =
                        Array.from(
                            document.images
                        );

                    await Promise.all(
                        images.map(
                            (image) => {
                                if (
                                    image.complete
                                ) {
                                    return Promise.resolve();
                                }

                                return new Promise(
                                    (
                                        resolve
                                    ) => {
                                        image.addEventListener(
                                            "load",
                                            resolve,
                                            {
                                                once: true,
                                            }
                                        );

                                        image.addEventListener(
                                            "error",
                                            resolve,
                                            {
                                                once: true,
                                            }
                                        );
                                    }
                                );
                            }
                        )
                    );
                }
            ),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Image loading timed out")), 15000))
        ]);

        const pdfBuffer =
            await Promise.race([
                page.pdf({
                    ...PDF_CONFIG,
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("PDF generation timed out")), 30000))
            ]);

        return {
            buffer:
                Buffer.from(
                    pdfBuffer
                ),

            filename,
        };
    } catch (error) {
        console.error(
            "Resume PDF generation failed:",
            {
                name:
                    error?.name,

                message:
                    error?.message,
                stack: error?.stack,
            }
        );

        throw new Error(
            `Failed to generate resume PDF: ${error.message}`
        );
    } finally {
        if (page) {
            try {
                await page.close();
            } catch {
                /*
                 * Ignore page cleanup errors.
                 */
            }
        }
    }
};

// ============================================================
// Browser Shutdown
// ============================================================
//
// server.js can call this during graceful shutdown.
// ============================================================

const closePdfBrowser =
    async () => {
        if (!browserPromise) {
            return;
        }

        try {
            const browser =
                await browserPromise;

            await browser.close();
        } finally {
            browserPromise = null;
        }
    };

// ============================================================
// Exports
// ============================================================

export {
    PDF_CONFIG,
    createPdfFilename,
    generateResumePdf,
    closePdfBrowser,
};

export default {
    generateResumePdf,
    createPdfFilename,
    closePdfBrowser,
};