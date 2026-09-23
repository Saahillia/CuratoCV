// ============================================================
// CuratoCV Forgot Password Page
// ============================================================
//
// Forgot password flow with enumeration-safe messaging.
//
// Requirements:
// - No email existence check on frontend
// - Generic success response regardless of account existence
// - Back to login link
// - Loading protection against duplicate requests
// - Error handling for 400, 429, etc.
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import emailService from '../services/emailService';

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        document.title = 'Forgot Password | CuratoCV';
    }, []);

    const handleChange = (e) => {
        setEmail(e.target.value);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await emailService.requestPasswordReset(email.trim());

            // Always show the same generic message - backend handles enumeration safety
            toast.success(
                'If an account exists for this email, we have sent a verification code.',
                { duration: 5000 }
            );

            setSubmitted(true);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error?.message ||
                error.message ||
                'Unable to process your request. Please try again later.';

            setError(message);
            toast.error(message, { duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="sm:w-[400px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white py-12">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Check your email</h1>
                        <p className="text-gray-600">
                            If an account exists for this email, we have sent a verification code.<br />
                            Please check your inbox and spam folder.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/login', { replace: true })}
                        className="w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 transition-opacity font-medium"
                    >
                        Back to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="sm:w-[400px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white py-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Forgot your password?</h1>
                    <p className="text-gray-600">Enter your email to receive a verification code.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-left">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full h-12 px-4 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send verification code'}
                    </button>
                </form>

                <div className="mt-6">
                    <Link
                        to="/login"
                        className="text-sm text-blue-500 hover:underline"
                    >
                        ← Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;