/**
 * Developer context for resumebuilder/backend/src/routes/aiRoutes.js.
 * Purpose: declare authenticated HTTP endpoints for Resume Builder AI operations.
 * Why here: route ownership follows the product; backend/server.js mounts this router but does not implement its domain logic.
 */
import express from "express";
import protect from "@curatocv/platform-backend/middlewares/authMiddleware";
import {
    enhanceJobDescription,
    enhanceProfessionalSummary,
    analyzeResumeForJob,
    scoreResumeDraft,
    getEntryTips,
    uploadResume,
} from "../controllers/aiControllers.js";

const aiRouter = express.Router();

aiRouter.post("/enhance-pro-sum", protect, enhanceProfessionalSummary);
aiRouter.post("/enhance-job-desc", protect, enhanceJobDescription);
aiRouter.post("/upload-resume", protect, uploadResume);
aiRouter.post("/entry-tips", protect, getEntryTips);
aiRouter.post("/tailor-resume", protect, analyzeResumeForJob);
aiRouter.post("/tailor-resume/score", protect, scoreResumeDraft);

export default aiRouter;
