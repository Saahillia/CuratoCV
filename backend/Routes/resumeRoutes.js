import express from "express";
import protect from "../Middlewares/authMiddleware.js";
import {
  createResume,
  deleteResume,
  getPublicResumeById,
  getResumeById,
  updateResume,
} from "../Controllers/resumeContoller.js";
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

export default resumeRouter;
