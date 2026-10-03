import { useLocation } from "react-router-dom";
import PlatformSkeleton from "@curatocv/platform-frontend/components/common/PlatformSkeleton";
import ResumeSkeleton from "@curatocv/resumebuilder-frontend/components/ResumeSkeleton";
import MemoSkeleton from "@curatocv/memo-frontend/components/MemoSkeleton";

const RouteLoadingFallback = () => {
    const { pathname } = useLocation();

    if (pathname === "/app/settings") return <PlatformSkeleton type="settings" />;
    if (pathname === "/app/profile") return <PlatformSkeleton type="profile" />;
    if (pathname === "/app/billing") return <PlatformSkeleton type="billing" />;
    if (pathname === "/pricing") return <PlatformSkeleton type="pricing" />;
    if (pathname === "/checkout") return <PlatformSkeleton type="checkout" />;
    if (pathname === "/products/memo/editor") return <MemoSkeleton type="editor" />;
    if (pathname === "/products/memo") return <MemoSkeleton type="workspace" />;
    if (/^\/app\/resumes\/[^/]+\/edit$/.test(pathname) || pathname.startsWith("/app/builder/")) {
        return <ResumeSkeleton type="editor" />;
    }
    if (/^\/(resume|view)\//.test(pathname) || pathname.endsWith("/preview")) {
        return <ResumeSkeleton type="preview" />;
    }
    return <ResumeSkeleton type="dashboard" />;
};

export default RouteLoadingFallback;
