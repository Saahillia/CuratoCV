import express from "express";
import protect from "../Middlewares/authMiddleware.js";
import {
  createResume,
  deleteResume,
  downloadResumePdf,
  getPublicResumeById,
  getResumeById,
  updateResume,
} from "../Controllers/resumeController.js";
import upload from "../Configs/multer.js";

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
