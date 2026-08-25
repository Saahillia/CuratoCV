import { useParams } from "react-router-dom";
import { dummyResumeData } from "../assets/assets";
import ResumePreview from "../components/ResumePreview";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import { ArrowLeftIcon } from "lucide-react";
import api from "../configs/api";

const Preview = () => {
    const { resumeId } = useParams();
    const searchParams = new URLSearchParams(window.location.search);
    const template = searchParams.get("template");
    const accentColor = searchParams.get("accent_color");

    const [isloading, setIsLoading] = useState(true);
    const [resumeData, setResumeData] = useState(null);

    const loadResume = async () => {
        try {
            const{data} = await api.get(`api/resumes/public/${resumeId}`);
            setResumeData(data.resume);
        } catch (error) {
            console.log("Error loading resume:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadResume();
    }, [resumeId]);

    if (isloading) {
        return <Loader />;
    }

    if (!resumeData) {
        return (
        <div className="flex flex-col items-center justify-center h-screen">
            <p className="text-center text-6xl text-slate-400 font-medium">
            Resume not found.
            </p>

            <a
            href="/"
            className="mt-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 h-9 m-1 ring-offset-1 ring-1 ring-blue-400 flex items-center transition-colors"
            >
            <ArrowLeftIcon className="mr-2 size-4" />
            Go to home page
            </a>
        </div>
        );
    }

return (
        <div className="bg-gray-100 min-h-screen py-6">
        <div className="mx-auto max-w-4xl py-10">
            <ResumePreview
            data={resumeData}
            template={template || resumeData.template}
            accentColor={accentColor || resumeData.accent_color}
            classes="py-4 bg-white"
            />
        </div>
        </div>
    );
};

export default Preview;
