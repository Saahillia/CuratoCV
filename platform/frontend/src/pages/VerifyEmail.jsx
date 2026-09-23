// ============================================================
// CuratoCV Verify Email Page
// ============================================================
//
// Email verification flow using OTP.
//
// Requirements:
// - Uses authenticated user's email (no re-entry)
// - Shows masked email (s***@example.com)
// - OTP input component
// - Verify button
// - Success state with Continue to CuratoCV action
// - Resend functionality with cooldown timer
// - Handles 429, expired/invalid OTP errors safely
// - Component-local state only (no localStorage/Redux for OTP)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { login } from '../app/features/authSlice';
import emailService from '../services/emailService';
import OtpInput from '../components/Email/OtpInput';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    // Already verified — redirect away
    useEffect(() => {
        if (user?.emailVerified) {
            navigate('/app', { replace: true });
        }
    }, [user?.emailVerified, navigate]);

    const [step, setStep] = useState('input'); // 'input' | 'success' | 'already-verified'
    const [email, setEmail] = useState(user?.email || '');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);
    const [resendAvailable, setResendAvailable] = useState(false);

    useEffect(() => {
        document.title = 'Verify Email | CuratoCV';
    }, []);

    useEffect(() => {
        if (user?.email && !email) {
            setEmail(user.email);
        }
    }, [user?.email]);

    // Masked email display
    const getMaskedEmail = (rawEmail) => {
        if (!rawEmail) return '';
        const [local, domain] = rawEmail.split('@');
        if (!domain) return rawEmail;
        if (local.length <= 2) {
            return rawEmail;
        }
        const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local.slice(-1);
        return `${maskedLocal}@${domain}`;
    };

    const startCountdown = () => {
        setResendAvailable(false);
        setResendCountdown(42);
    };

    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setResendAvailable(true);
        }
    }, [resendCountdown]);

    const handleOtpChange = (otpValue) => {
        setOtp(otpValue);
        setError('');
    };

    const handleOtpComplete = (otpValue) => {
        setOtp(otpValue);
        setError('');
    };

    const handleVerify = async () => {
        const targetEmail = email.trim() || user?.email;
        if (!targetEmail) {
            setError('Please enter your email address');
            return;
        }

        if (!otp || otp.length !== 6) {
            setError('Please enter a complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await emailService.verifyEmail({
                email: targetEmail,
                otp,
            });

            toast.success('Email verified successfully!', { duration: 3000 });

            // Sync Redux so the dashboard banner disappears immediately
            if (user) {
                dispatch(login({
                    token: user.token,
                    user: { ...user, emailVerified: true },
                }));
            }

            setStep('success');
        } catch (error) {
            // Check if already verified
            const isAlreadyVerified =
                error?.response?.data?.message?.includes('already verified') ||
                error?.response?.data?.error?.message?.includes('already verified');

            if (isAlreadyVerified) {
                toast.success('Email is already verified!', { duration: 3000 });

                // Sync Redux
                if (user) {
                    dispatch(login({
                        token: user.token,
                        user: { ...user, emailVerified: true },
                    }));
                }

                setStep('already-verified');
            } else {
                const message =
                    error?.response?.data?.message ||
                    error?.response?.data?.error?.message ||
                    error.message ||
                    'Invalid or expired OTP';

                setError(message);
                toast.error(message, { duration: 3000 });
                setOtp('');
                startCountdown();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!resendAvailable || resendLoading) return;

        setResendLoading(true);
        setError('');

        try {
            await emailService.resendVerificationEmail();
            toast.success('Verification code sent!', { duration: 3000 });
            setOtp('');
            startCountdown();
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error?.message ||
                error.message ||
                'Unable to resend code';

            setError(message);
            toast.error(message, { duration: 3000 });
        } finally {
            setResendLoading(false);
        }
    };

    const handleContinue = () => {
        navigate('/app', { replace: true });
    };

    const displayEmail = email || user?.email || '';

    if (step === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="sm:w-[400px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white py-12">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Email Verified Successfully!</h1>
                        <p className="text-gray-600">Your email has been verified. You can now continue to CuratoCV.</p>
                    </div>

                    <button
                        onClick={handleContinue}
                        className="w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 transition-opacity font-medium"
                    >
                        Continue to CuratoCV
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'already-verified') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="sm:w-[400px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white py-12">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Email Already Verified</h1>
                        <p className="text-gray-600">Your email address has already been verified. You can continue to CuratoCV.</p>
                    </div>

                    <button
                        onClick={handleContinue}
                        className="w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 transition-opacity font-medium"
                    >
                        Continue to CuratoCV
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="sm:w-[400px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white py-12">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verify your email</h1>
                <p className="text-gray-600 mb-6">
                    {displayEmail ? (
                        <>
                            We've sent a 6-digit verification code to<br />
                            <span className="font-medium text-gray-900">{getMaskedEmail(displayEmail)}</span>
                        </>
                    ) : (
                        'Enter your 6-digit verification code'
                    )}
                </p>

                {!user?.email && (
                    <div className="mb-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full h-12 px-4 rounded-full border border-gray-300 outline-none text-center"
                        />
                    </div>
                )}

                <div className="mb-6">
                    <OtpInput
                        length={6}
                        onChange={handleOtpChange}
                        onComplete={handleOtpComplete}
                        error={!!error}
                        disabled={loading || resendLoading}
                        autoFocus={true}
                        placeholder="-"
                    />
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleVerify}
                    disabled={!otp || otp.length !== 6 || loading || resendLoading}
                    className="w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 transition-opacity font-medium mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Verifying...' : 'Verify'}
                </button>

                <div className="text-center">
                    {resendAvailable ? (
                        <button
                            onClick={handleResend}
                            disabled={resendLoading}
                            className="text-blue-500 hover:underline disabled:opacity-50"
                        >
                            {resendLoading ? 'Sending...' : 'Resend code'}
                        </button>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            Resend code in {resendCountdown}s
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;