// ============================================================
// CuratoCV App Routes
// ============================================================
//
// Main routing setup. Uses the centralized API client (services/api)
// with the correct token storage key and global 401 handling.
// ============================================================

import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import Home from "@curatocv/platform-frontend/pages/Home";
import Layout from "@curatocv/platform-frontend/pages/Layout";
import Products from "@curatocv/platform-frontend/pages/Products";
import MemoPlaceholder from "@curatocv/memo-frontend/pages/MemoPlaceholder";
import Dashboard from "@curatocv/resumebuilder-frontend/pages/Dashboard";
import ResumeBuilder from "@curatocv/resumebuilder-frontend/pages/ResumeBuilder";
import Preview from "@curatocv/resumebuilder-frontend/pages/Preview";
import Login from "@curatocv/platform-frontend/pages/Login";
import VerifyEmail from "@curatocv/platform-frontend/pages/VerifyEmail";
import ForgotPassword from "@curatocv/platform-frontend/pages/ForgotPassword";
import ResetPassword from "@curatocv/platform-frontend/pages/ResetPassword";
import Pricing from "@curatocv/platform-frontend/pages/Pricing";
import Checkout from "@curatocv/platform-frontend/pages/Checkout";
import Billing from "@curatocv/platform-frontend/pages/Billing";
import Profile from "@curatocv/platform-frontend/pages/Profile";
import NotFound from "@curatocv/platform-frontend/pages/NotFound";
import { useDispatch, useSelector } from "react-redux";
import api, { TOKEN_STORAGE_KEY } from "@curatocv/api-client";
import { login, logout, setLoading } from "@curatocv/platform-frontend/features/authSlice";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

// ============================================================
// ProtectedRoute
// ============================================================
//
// Guards routes that require authentication. Redirects unauthenticated
// users to /login. The actual authorization rules are enforced by
// the backend — this is UX-only routing protection.
// ============================================================

const ProtectedRoute = ({ children }) => {
    const { token, loading } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const App = () => {
    const dispatch = useDispatch();

    const getUserData = async () => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        try {
            if (token) {
                const { data } = await api.get("/users/me");
                if (data.success && data.data) {
                    dispatch(
                        login({
                            token,
                            user: {
                                id: data.data.id,
                                name: data.data.name,
                                email: data.data.email,
                                emailVerified: data.data.emailVerified,
                                createdAt: data.data.createdAt,
                                updatedAt: data.data.updatedAt,
                            },
                        })
                    );
                }
            }
        } catch (error) {
            if (error.response?.status === 401) {
                dispatch(logout());
            }
            console.error("Error fetching user data:", error);
        } finally {
            dispatch(setLoading(false));
        }
    };

    useEffect(() => {
        getUserData();
    }, []);

    return (
        <>
            <Toaster />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />

                {/* Auth email & password reset flows — public, no auth required */}
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/pricing" element={<Pricing />} />

                {/* Public resume share page — no auth required */}
                <Route path="/resume/:shareId" element={<Preview />} />

                {/* Platform Landing - entry point post-login */}
                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <Navigate to="/products/resume-builder" replace />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/resume-builder"
                    element={
                        <ProtectedRoute>
                            <Products />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/memo"
                    element={
                        <ProtectedRoute>
                            <MemoPlaceholder />
                        </ProtectedRoute>
                    }
                />

                {/* Compatibility redirects for legacy notes routes */}
                <Route
                    path="/products/notes"
                    element={
                        <ProtectedRoute>
                            <Navigate to="/products/memo" replace />
                        </ProtectedRoute>
                    }
                />

                {/* Memo Workspace Entry Point (Alias / Redirect) */}
                <Route
                    path="/memo"
                    element={
                        <ProtectedRoute>
                            <Navigate to="/products/memo" replace />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/notes"
                    element={
                        <ProtectedRoute>
                            <Navigate to="/products/memo" replace />
                        </ProtectedRoute>
                    }
                />

                {/* Authenticated routes with global Navbar (Resume Builder Module) */}
                <Route
                    path="/app"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="resumes" element={<Dashboard />} />
                    <Route path="resumes/:resumeId/preview" element={<Preview />} />
                    <Route path="billing" element={<Billing />} />
                    <Route path="profile" element={<Profile />} />
                </Route>

                {/* Standalone Authenticated Resume Builder (no global Navbar) */}
                <Route
                    path="/app/resumes/:resumeId/edit"
                    element={
                        <ProtectedRoute>
                            <ResumeBuilder />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/builder/:resumeId"
                    element={
                        <ProtectedRoute>
                            <ResumeBuilder />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute>
                            <Checkout />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/billing"
                    element={
                        <ProtectedRoute>
                            <Billing />
                        </ProtectedRoute>
                    }
                />

                <Route path="/view/:resumeId" element={<Preview />} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
};

export default App;
