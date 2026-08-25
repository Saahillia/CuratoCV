import imageKit from "../Configs/imageKit.js";
import Resume from "../Models/Resume.js";
import fs from "fs";
import path from "path";

// ============================================================
// Configuration
// ============================================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// ============================================================
// Helpers
// ============================================================

const cleanupUploadedFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "Failed to remove temporary upload:",
        error.message
      );
    }
  }
};

const isTrue = (value) => {
  return (
    value === true ||
    value === "true" ||
    value === "1"
  );
};

// ============================================================
// Create Resume
// POST : /api/resumes/create
// ============================================================

export const createResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        message: "Resume title is required",
      });
    }

    const newResume = await Resume.create({
      userId,
      title: title.trim(),
    });

    return res.status(201).json({
      message: "Resume created successfully",
      resume: newResume,
    });
  } catch (error) {
    console.error("Create resume error:", error);

    return res.status(500).json({
      message: "Unable to create resume",
    });
  }
};

// ============================================================
// Delete Resume
// DELETE : /api/resumes/delete/:resumeId
// ============================================================

export const deleteResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!resumeId) {
      return res.status(400).json({
        message: "Resume ID is required",
      });
    }

    const deletedResume =
      await Resume.findOneAndDelete({
        userId,
        _id: resumeId,
      });

    if (!deletedResume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    return res.status(200).json({
      message: "Resume deleted successfully",
      resume: deletedResume,
    });
  } catch (error) {
    console.error("Delete resume error:", error);

    return res.status(500).json({
      message: "Unable to delete resume",
    });
  }
};

// ============================================================
// Get Resume By ID
// GET : /api/resumes/get/:resumeId
// ============================================================

export const getResumeById = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!resumeId) {
      return res.status(400).json({
        message: "Resume ID is required",
      });
    }

    const resume = await Resume.findOne({
      userId,
      _id: resumeId,
    }).lean();

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    return res.status(200).json({
      resume,
    });
  } catch (error) {
    console.error("Get resume error:", error);

    return res.status(500).json({
      message: "Unable to fetch resume",
    });
  }
};

// ============================================================
// Get Public Resume
// GET : /api/resumes/public/:resumeId
// ============================================================

export const getPublicResumeById = async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!resumeId) {
      return res.status(400).json({
        message: "Resume ID is required",
      });
    }

    const resume = await Resume.findOne({
      public: true,
      _id: resumeId,
    }).lean();

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    return res.status(200).json({
      resume,
    });
  } catch (error) {
    console.error(
      "Get public resume error:",
      error
    );

    return res.status(500).json({
      message: "Unable to fetch resume",
    });
  }
};

// ============================================================
// Update Resume
// PUT : /api/resumes/update/:resumeId
// ============================================================

export const updateResume = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    const {
      resumeData,
      removeBackground,
    } = req.body;

    const image = req.file;

    uploadedFilePath = image?.path || null;

    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // --------------------------------------------------------
    // Resume ID
    // --------------------------------------------------------

    if (!resumeId) {
      return res.status(400).json({
        message: "Resume ID is required",
      });
    }

    // --------------------------------------------------------
    // Resume Data
    // --------------------------------------------------------

    if (!resumeData) {
      return res.status(400).json({
        message: "Resume data is required",
      });
    }

    let resumeDataCopy;

    try {
      resumeDataCopy =
        typeof resumeData === "string"
          ? JSON.parse(resumeData)
          : structuredClone(resumeData);
    } catch {
      await cleanupUploadedFile(
        uploadedFilePath
      );

      return res.status(400).json({
        message: "Invalid resume data",
      });
    }

    if (
      !resumeDataCopy ||
      typeof resumeDataCopy !== "object" ||
      Array.isArray(resumeDataCopy)
    ) {
      await cleanupUploadedFile(
        uploadedFilePath
      );

      return res.status(400).json({
        message: "Invalid resume data",
      });
    }

    // --------------------------------------------------------
    // Image Processing
    // --------------------------------------------------------

    let imageProcessingStatus = null;

    if (image) {
      // ------------------------------------------------------
      // Validate MIME type
      // ------------------------------------------------------

      if (
        !ALLOWED_IMAGE_TYPES.has(
          image.mimetype
        )
      ) {
        await cleanupUploadedFile(
          uploadedFilePath
        );

        return res.status(400).json({
          message:
            "Invalid image type. Only JPG, PNG, and WebP images are allowed.",
        });
      }

      // ------------------------------------------------------
      // Validate file size
      // ------------------------------------------------------

      if (image.size > MAX_IMAGE_SIZE) {
        await cleanupUploadedFile(
          uploadedFilePath
        );

        return res.status(400).json({
          message:
            "Image is too large. Maximum allowed size is 5 MB.",
        });
      }

      if (!image.path) {
        return res.status(400).json({
          message:
            "Uploaded image could not be processed",
        });
      }

      try {
        const imageStream =
          fs.createReadStream(
            image.path
          );

        // ----------------------------------------------------
        // Your working face-centering transformation
        // ----------------------------------------------------

        const transformation = [
          "w-300",
          "h-300",
          "fo-face",
          "z-0.8",
          "q-85",
        ].join(",");

        const safeFileName = path
          .basename(
            image.originalname ||
              "resume-profile"
          )
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          );

        const uploadOptions = {
          file: imageStream,

          fileName: safeFileName,

          folder: "user-resumes",

          transformation: {
            pre: transformation,
          },

          // Ask ImageKit to return extension status.
          responseFields: [
            "metadata",
          ],
        };

        // ----------------------------------------------------
        // Remove Background
        // ----------------------------------------------------

        const shouldRemoveBackground =
          isTrue(removeBackground);

        if (shouldRemoveBackground) {
          uploadOptions.extensions = [
            {
              name: "remove-bg",
              options: {
                add_shadow: false,
                semitransparency: true,
              },
            },
          ];
        }

        console.log(
          "Image upload request:",
          {
            fileName: safeFileName,
            removeBackground:
              shouldRemoveBackground,
          }
        );

        // ----------------------------------------------------
        // Upload
        // ----------------------------------------------------

        const response =
          await imageKit.files.upload(
            uploadOptions
          );

        // ----------------------------------------------------
        // Log ImageKit result
        // ----------------------------------------------------

        console.log(
          "ImageKit upload response:",
          {
            fileId: response?.fileId,
            url: response?.url,
            extensionStatus:
              response?.extensionStatus,
          }
        );

        if (!response?.url) {
          throw new Error(
            "ImageKit did not return an image URL"
          );
        }

        // ----------------------------------------------------
        // Check background removal status
        // ----------------------------------------------------

        if (shouldRemoveBackground) {
          imageProcessingStatus =
            response?.extensionStatus?.[
              "remove-bg"
            ] || "unknown";

          console.log(
            "Remove background status:",
            imageProcessingStatus
          );

          if (
            imageProcessingStatus ===
            "failed"
          ) {
            throw new Error(
              "ImageKit background removal failed"
            );
          }
        }

        // ----------------------------------------------------
        // Save Image URL
        // ----------------------------------------------------

        resumeDataCopy.personal_info =
          resumeDataCopy.personal_info ||
          {};

        resumeDataCopy.personal_info.image =
          response.url;

      } catch (imageError) {
        console.error(
          "ImageKit image processing error:",
          imageError
        );

        await cleanupUploadedFile(
          uploadedFilePath
        );

        return res.status(502).json({
          message:
            imageError?.message ||
            "Unable to process profile image. Please try again.",
        });
      }
    }

    // --------------------------------------------------------
    // Update Resume
    // --------------------------------------------------------

    const resume =
      await Resume.findOneAndUpdate(
        {
          userId,
          _id: resumeId,
        },
        resumeDataCopy,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!resume) {
      await cleanupUploadedFile(
        uploadedFilePath
      );

      return res.status(404).json({
        message: "Resume not found",
      });
    }

    // --------------------------------------------------------
    // Cleanup temporary file
    // --------------------------------------------------------

    await cleanupUploadedFile(
      uploadedFilePath
    );

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    const backgroundRemovalRequested =
      image &&
      isTrue(removeBackground);

    let message =
      "Resume updated successfully";

    if (
      image &&
      backgroundRemovalRequested
    ) {
      if (
        imageProcessingStatus ===
        "success"
      ) {
        message =
          "Resume and profile image updated with background removed";
      } else if (
        imageProcessingStatus ===
        "pending"
      ) {
        message =
          "Resume updated. Background removal is still processing";
      } else {
        message =
          "Resume and profile image updated";
      }
    } else if (image) {
      message =
        "Resume and profile image updated successfully";
    }

    return res.status(200).json({
      message,
      resume,

      imageProcessing: {
        requested:
          Boolean(
            backgroundRemovalRequested
          ),

        status:
          imageProcessingStatus,
      },
    });

  } catch (error) {
    console.error(
      "Update resume error:",
      error
    );

    await cleanupUploadedFile(
      uploadedFilePath
    );

    return res.status(500).json({
      message:
        "Unable to update resume. Please try again.",
    });
  }
};