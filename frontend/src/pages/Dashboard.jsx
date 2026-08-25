import { useCallback, useEffect, useState } from "react";
import {
  PlusIcon,
  UploadCloudIcon,
  FilePenLineIcon,
  Trash2Icon,
  PencilIcon,
  XIcon,
  UploadCloud,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";
import pdfToText from "react-pdftotext";

const Dashboard = () => {
  const { token } = useSelector((state) => state.auth);

  const [allResumes, setAllResumes] = useState([]);

  const [showCreateResume, setShowCreateResume] = useState(false);
  const [showUploadResume, setShowUploadResume] = useState(false);

  const [title, setTitle] = useState("");
  const [resume, setResume] = useState(null);

  const [editResumeId, setEditResumeId] = useState("");
  const [isloading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const loadAllResumes = useCallback(async () => {
    if (!token) return;

    try {
      const { data } = await api.get("/api/users/resumes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAllResumes(Array.isArray(data?.resumes) ? data.resumes : []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error.message,
        {
          duration: 3000,
        }
      );
    }
  }, [token]);

  useEffect(() => {
    loadAllResumes();
  }, [loadAllResumes]);

  // Create resume
  const createResume = async (event) => {
    try {
      event.preventDefault();

      const { data } = await api.post(
        "api/resumes/create",
        { title },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdResumeId =
        data?.resume?._id || data?.resumeId;

      if (!createdResumeId) {
        toast.error(
          "Resume was created, but no resume id was returned."
        );
        return;
      }

      if (data?.resume) {
        setAllResumes((prev) => [...prev, data.resume]);
      }

      setTitle("");
      setShowCreateResume(false);

      navigate(`/app/builder/${createdResumeId}`);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error.message,
        {
          duration: 3000,
        }
      );
    }
  };

  // Upload resume
  const uploadResume = async (event) => {
    event.preventDefault();

    if (!resume) {
      toast.error("Please select a resume file first.");
      return;
    }

    setIsLoading(true);

    try {
      const resumeText = await pdfToText(resume);

      const { data } = await api.post(
        "/api/ai/upload-resume",
        {
          title,
          resumeText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const uploadedResumeId =
        data?.resume?._id || data?.resumeId;

      if (!uploadedResumeId) {
        toast.error(
          "Resume uploaded, but no resume id was returned."
        );
        return;
      }

      setTitle("");
      setResume(null);
      setShowUploadResume(false);

      navigate(`/app/builder/${uploadedResumeId}`);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error.message,
        {
          duration: 3000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update title
  const editTitle = async (event) => {
    try {
      event.preventDefault();
      const {data} = await api.put(`/api/resumes/update`, {resumeId: editResumeId, resumeData :{title}}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAllResumes(allResumes.map(resume =>resume._id === editResumeId ? {...resume, title: data?.updatedResume?.title || title} : resume));
      setTitle("");
      setEditResumeId("");
      toast.success(data?.message || "Resume title updated successfully.", { duration: 3000 });
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message,{duration: 3000,});
    }

  };

  // Delete resume
  const deleteResume = async (resumeId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this resume?"
      );

      if (!confirmed) return;

      const { data } = await api.delete(
        `/api/resumes/delete/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAllResumes((prev) =>
        prev.filter((resume) => resume._id !== resumeId)
      );

      toast.success(
        data?.message || "Resume deleted successfully.",
        {
          duration: 3000,
        }
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error.message,
        {
          duration: 3000,
        }
      );
    }
  };

  // Close create modal
  const closeCreateModal = () => {
    setShowCreateResume(false);
    setTitle("");
  };

  // Close upload modal
  const closeUploadModal = () => {
    setShowUploadResume(false);
    setTitle("");
    setResume(null);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditResumeId("");
    setTitle("");
  };

  const resumeColors = [
    {
      accent: "#17375F",
      background: "#E8F0F7",
    },
    {
      accent: "#24527A",
      background: "#F3F7FA",
    },
    {
      accent: "#2D638F",
      background: "#EEF5FA",
    },
    {
      accent: "#356F98",
      background: "#F1F6FA",
    },
    {
      accent: "#4A6F8F",
      background: "#F4F7F9",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F3F7FA]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Welcome */}
        <div className="mb-8">
          <p className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome back, Saahil Lia
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Create, manage, and improve your resumes.
          </p>
        </div>

        {/* Create / Upload */}
        <div className="flex flex-wrap gap-4">

          {/* Create Resume */}
          <button
            type="button"
            onClick={() => setShowCreateResume(true)}
            className="group flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#B8CADB] bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#17375F] hover:shadow-lg hover:shadow-[#17375F]/10 sm:max-w-48"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-b from-[#24527A] to-[#466080] shadow-md shadow-[#17375F]/20 transition-transform duration-300 group-hover:scale-105">
              <PlusIcon className="size-6 text-white" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#132f51]">
                Create Resume
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Start from scratch
              </p>
            </div>
          </button>

          {/* Upload Resume */}
          <button
            type="button"
            onClick={() => setShowUploadResume(true)}
            className="group flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#B8CADB] bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#17375F] hover:shadow-lg hover:shadow-[#17375F]/10 sm:max-w-48"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#E8F0F7] transition-transform duration-300 group-hover:scale-105">
              <UploadCloudIcon className="size-6 text-[#17375F]" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#17375F]">
                Upload Resume
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Import an existing resume
              </p>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#D7E2EC]" />

          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Your resumes
          </span>

          <div className="h-px flex-1 bg-[#D7E2EC]" />
        </div>

        {/* Resume Cards */}
        {allResumes.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {allResumes.map((resume, index) => {
              const theme =
                resumeColors[index % resumeColors.length];

              return (
                <div
                  key={resume._id || index}
                  className="group relative h-48 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    borderColor: `${theme.accent}30`,
                  }}
                >
                  {/* Background */}
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${theme.background}, #ffffff)`,
                    }}
                  />

                  {/* Accent */}
                  <div
                    className="absolute left-0 right-0 top-0 h-1.5"
                    style={{
                      backgroundColor: theme.accent,
                    }}
                  />

                  {/* Resume content */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/app/builder/${resume._id}`)
                    }
                    className="relative flex h-full w-full flex-col items-center justify-center px-4 text-center"
                  >
                    <div
                      className="flex size-12 items-center justify-center rounded-xl shadow-sm"
                      style={{
                        backgroundColor: theme.background,
                      }}
                    >
                      <FilePenLineIcon
                        className="size-6"
                        style={{
                          color: theme.accent,
                        }}
                      />
                    </div>

                    <p
                      className="mt-4 line-clamp-2 text-sm font-semibold"
                      style={{
                        color: theme.accent,
                      }}
                    >
                      {resume.title}
                    </p>

                    <p className="absolute bottom-3 left-0 right-0 px-3 text-[10px] text-slate-400">
                      Updated{" "}
                      {new Date(
                        resume.updatedAt
                      ).toLocaleDateString()}
                    </p>
                  </button>

                  {/* Actions */}
                  <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">

                    {/* Edit */}
                    <button
                      type="button"
                      aria-label={`Edit ${resume.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditResumeId(resume._id);
                        setTitle(resume.title);
                      }}
                      className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-[#17375F]"
                    >
                      <PencilIcon className="size-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      aria-label={`Delete ${resume.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResume(resume._id);
                      }}
                      className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-[#B8CADB] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#E8F0F7]">
              <FilePenLineIcon className="size-6 text-[#17375F]" />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              No resumes yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Create your first resume and let CuratoCV help you
              turn your experience into a professional application.
            </p>

            <button
              type="button"
              onClick={() => setShowCreateResume(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#17375F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24527A]"
            >
              <PlusIcon className="size-4" />
              Create your first resume
            </button>
          </div>
        )}

        {/* ================= CREATE RESUME MODAL ================= */}

        {showCreateResume && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onClick={closeCreateModal}
          >
            <form
              onSubmit={createResume}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              {/* Close */}
              <button
                type="button"
                onClick={closeCreateModal}
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#E8F0F7] hover:text-[#112641]"
                aria-label="Close"
              >
                <XIcon className="size-5" />
              </button>

              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Create a Resume
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Give your resume a name to get started.
              </p>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Resume title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Software Engineer Resume"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#132943] focus:ring-4 focus:ring-[#17375F]/10"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#17375F] text-sm font-semibold text-white transition hover:bg-[#24527A]"
              >
                <PlusIcon className="size-4" />
                Create Resume
              </button>
            </form>
          </div>
        )}

        {/* ================= UPLOAD RESUME MODAL ================= */}

        {showUploadResume && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onClick={closeUploadModal}
          >
            <form
              onSubmit={uploadResume}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              {/* Close */}
              <button
                type="button"
                onClick={closeUploadModal}
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#E8F0F7] hover:text-[#17375F]"
                aria-label="Close"
              >
                <XIcon className="size-5" />
              </button>

              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Upload Resume
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Import an existing resume into CuratoCV.
              </p>

              {/* Title */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Resume title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Resume"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#17375F] focus:ring-4 focus:ring-[#17375F]/10"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="mt-4">
                <label
                  htmlFor="resume-input"
                  className="block text-sm font-medium text-slate-700"
                >
                  Resume file
                </label>

                <label
                  htmlFor="resume-input"
                  className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#B8CADB] bg-[#F3F7FA] px-4 py-8 text-center text-slate-400 transition hover:border-[#17375F] hover:bg-[#E8F0F7] hover:text-[#17375F]"
                >
                  {resume ? (
                    <>
                      <FilePenLineIcon className="size-8 text-[#17375F]" />

                      <p className="max-w-full truncate text-sm font-medium text-[#17375F]">
                        {resume.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        Click to choose another file
                      </p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-10 stroke-1" />

                      <p className="text-sm font-medium">
                        Choose a resume
                      </p>

                      <p className="text-xs">
                        PDF, DOC or DOCX
                      </p>
                    </>
                  )}
                </label>

                <input
                  type="file"
                  id="resume-input"
                  accept=".pdf,.doc,.docx"
                  hidden
                  onChange={(e) =>
                    setResume(e.target.files?.[0] || null)
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#17375F] text-sm font-semibold text-white transition hover:bg-[#24527A] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!resume || isloading}
              >
                <UploadCloud className="size-4" />

                {isloading
                  ? "Uploading Resume..."
                  : "Upload Resume"}
              </button>
            </form>
          </div>
        )}

        {/* ================= EDIT TITLE MODAL ================= */}

        {editResumeId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onClick={closeEditModal}
          >
            <form
              onSubmit={editTitle}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              {/* Close */}
              <button
                type="button"
                onClick={closeEditModal}
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#E8F0F7] hover:text-[#17375F]"
                aria-label="Close"
              >
                <XIcon className="size-5" />
              </button>

              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Edit Resume Title
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the name of your resume.
              </p>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Resume title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter resume title"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#17375F] focus:ring-4 focus:ring-[#17375F]/10"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#17375F] text-sm font-semibold text-white transition hover:bg-[#24527A]"
              >
                <PencilIcon className="size-4" />
                Update Title
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;