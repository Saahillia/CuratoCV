import express from "express";
import protect from "@curatocv/platform-backend/middlewares/authMiddleware";
import {
  createResume,
  deleteResume,
  downloadResumePdf,
  getPublicResumeById,
  getResumeById,
  updateResume,
} from "../controllers/resumeController.js";
import upload from "@curatocv/platform-backend/configs/multer";

const resumeRouter = express.Router();
resumeRouter.post("/create", protect, createResume);
resumeRouter.put(
  "/update/:resumeId",
  protect,
  upload.single("image"),
  updateResume,
);
resumeRouter.delete("/delete/:resumeId", protect, deleteResume);
resumeRouter.get("/get/:resumeId", protect, getResumeById);
resumeRouter.get("/public/:resumeId", getPublicResumeById);
resumeRouter.get("/pdf/:resumeId", protect, downloadResumePdf);

export default resumeRouter;
