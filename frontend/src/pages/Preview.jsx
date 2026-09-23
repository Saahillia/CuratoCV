import { useParams, Link, useLocation } from "react-router-dom";
import ResumePreview from "../components/ResumePreview";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import { ArrowLeftIcon, Download, Globe, Loader2 } from "lucide-react";
import api from "../services/api";
import { toast } from "react-hot-toast";

const Preview = () => {
    const { shareId, resumeId } = useParams();
    const { pathname } = useLocation();
    const id = shareId || resumeId;

    // Check if we're on an authenticated route (/app/resumes/:resumeId/preview)
    const isAuthRoute = pathname.startsWith("/app/resumes/");
    // Check for auth token to decide which endpoint to use
    const hasToken = typeof window !== "undefined" && localStorage.getItem("curatocv_token");

    const [isLoading, setIsLoading] = useState(true);
    const [resumeData, setResumeData] = useState(null);
    const [error, setError] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const loadResume = async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);

        // Use authenticated endpoint when on auth route and have token
        // Use public endpoint for public share links
        const endpoint = (isAuthRoute && hasToken) ? `/resumes/get/${id}` : `/resumes/public/${id}`;

        try {
            const { data } = await api.get(endpoint);
            const res = data?.data?.resume || data?.resume;
            if (res) {
                setResumeData(res);
                document.title = `${res.title || "Resume"} - CuratoCV Preview`;
            } else {
                setError("Resume not found or made private by its author.");
            }
        } catch (err) {
            console.error("Error loading resume:", err);
            setError(err?.response?.data?.error?.message || "Resume not found or is currently private.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadResume();
    }, [id, isAuthRoute, hasToken]);

    const handleDownloadPdf = async () => {
        if (!id || id === "undefined") {
            toast.error("Resume ID is missing.");
            return;
        }
        setIsGeneratingPdf(true);
        try {
            const response = await api.get(`/resumes/pdf/${id}`, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = response.headers["content-disposition"]?.split("filename=")?.[1]?.replace(/"/g, '') || `${resumeData.title || "resume"}_CuratoCV.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("PDF downloaded!");
        } catch (err) {
            toast.error("Unable to generate your PDF. Please try again.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader />
            </div>
        );
    }

    if (error || !resumeData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-center">
                <div className="size-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#17375F] mb-4">
                    <Globe className="size-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Resume Unavailable</h1>
                <p className="max-w-md text-sm text-slate-500 mb-6">
                    {error || "This resume is either private or does not exist."}
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17375F] text-white text-sm font-semibold rounded-xl hover:bg-[#24527A] transition"
                >
                    <ArrowLeftIcon className="size-4" />
                    Back to Home
                </Link>
            </div>
        );
    }

    const template = resumeData.design?.template || resumeData.template || "classic";

    return (
        <div className="bg-slate-100 min-h-screen py-6 px-4">
            {/* Top Toolbar */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition"
                >
                    <ArrowLeftIcon className="size-4" />
                    CuratoCV Home
                </Link>

                <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        (isAuthRoute && hasToken)
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                        {(isAuthRoute && hasToken) ? "Authenticated Preview" : "Public View"}
                    </span>
                    {(isAuthRoute && hasToken) ? (
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isGeneratingPdf}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17375F] text-white text-xs font-semibold rounded-lg hover:bg-[#24527A] transition shadow-xs disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isGeneratingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                            {isGeneratingPdf ? "Generating..." : "Download PDF"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17375F] text-white text-xs font-semibold rounded-lg hover:bg-[#24527A] transition shadow-xs"
                        >
                            <Download className="size-3.5" />
                            Print / Download PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Document Canvas */}
            <div className="mx-auto max-w-4xl shadow-xl rounded-xl overflow-hidden bg-white print:shadow-none print:m-0 print:p-0">
                <ResumePreview
                    data={resumeData}
                    template={template}
                />
            </div>
        </div>
    );
};

export default Preview;