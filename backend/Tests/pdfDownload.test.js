/**
 * Test suite for resume PDF download functionality.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createUser, createResume } from "./factories.js";
import { downloadResumePdf } from "../../resumebuilder/backend/src/controllers/resumeController.js";
import { closePdfBrowser } from "../../resumebuilder/backend/src/services/pdfService.js";

describe("Resume PDF Download Tests", () => {
    let user;
    let resume;

    beforeEach(async () => {
        user = await createUser({ email: `pdf_user_${Date.now()}@example.com` });
        resume = await createResume(user._id, {
            title: "Software Engineer",
            personalInformation: {
                fullName: "Jane Doe",
                email: "jane@example.com",
            },
        });
    });

    afterAll(async () => {
        await closePdfBrowser();
    });

    it("should successfully generate and return a PDF buffer within 5 seconds", async () => {
        const createMockRes = () => {
            let sentStatus = 200;
            let sentHeaders = {};
            let sentBody = null;

            const res = {
                status: (code) => {
                    sentStatus = code;
                    return res;
                },
                setHeader: (name, value) => {
                    sentHeaders[name] = value;
                    return res;
                },
                json: (data) => {
                    sentBody = data;
                    return res;
                },
                send: (body) => {
                    sentBody = body;
                    return res;
                },
                getStatus: () => sentStatus,
                getHeaders: () => sentHeaders,
                getBody: () => sentBody,
            };
            return res;
        };

        const req = {
            params: { resumeId: resume._id.toString() },
            userId: user._id.toString(),
            user: { _id: user._id },
        };

        // First request (cold browser launch)
        const res1 = createMockRes();
        const t0 = Date.now();
        await downloadResumePdf(req, res1);
        const duration1 = Date.now() - t0;

        console.log(`[TEST] First PDF download completed in ${duration1}ms`);
        expect(res1.getStatus()).toBe(200);
        expect(res1.getHeaders()["Content-Type"]).toBe("application/pdf");
        expect(res1.getHeaders()["Content-Disposition"]).toContain("Software-Engineer_CuratoCV.pdf");
        expect(res1.getBody()).toBeInstanceOf(Buffer);
        expect(res1.getBody().length).toBeGreaterThan(100);
        expect(duration1).toBeLessThan(5000);

        // Second request (warm browser reuse)
        const res2 = createMockRes();
        const t1 = Date.now();
        await downloadResumePdf(req, res2);
        const duration2 = Date.now() - t1;

        console.log(`[TEST] Second PDF download (warm) completed in ${duration2}ms`);
        expect(res2.getStatus()).toBe(200);
        expect(res2.getHeaders()["Content-Type"]).toBe("application/pdf");
        expect(res2.getHeaders()["Content-Disposition"]).toContain("Software-Engineer_CuratoCV.pdf");
        expect(res2.getBody()).toBeInstanceOf(Buffer);
        expect(res2.getBody().length).toBeGreaterThan(100);
        expect(duration2).toBeLessThan(1000); // warm reuse should be < 1s
    });
});
