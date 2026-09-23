import { Link } from "react-router-dom";

const NotFound = () => (
    <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-[#17375F] mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
            <Link to="/" className="text-[#17375F] underline hover:text-[#0f2a44]">Go Home</Link>
        </div>
    </div>
);

export default NotFound;
