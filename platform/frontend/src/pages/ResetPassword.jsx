// ============================================================
// CuratoCV Reset Password Page
// ============================================================
//
// 3-step local state machine:
// 1. Enter Email to request OTP
// 2. Enter OTP to verify and obtain resetToken
// 3. Enter New Password to reset
//
// Critical Security:
// - resetToken held in component state ONLY.
// - NEVER in localStorage, Redux, or URL params.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import emailService from '../services/emailService';
import OtpInput from '../components/auth/OtpInput';

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'Uppercase & lowercase letters', test: (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) },
    { label: 'At least one number (0-9)', test: (pwd) => /\d/.test(pwd) },
    { label: 'Special character (!@#$%^&*)', test: (pwd) => /[!@#$%^&*]/.test(pwd) },
];

const ResetPassword = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Reset Password | CuratoCV';
    }, []);

    // 3-step state machine: 'email' | 'otp' | 'password'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return setError('Please enter your email');

        setLoading(true);
        setError('');

        try {
            await emailService.requestPasswordReset(email.trim());
            toast.success('Verification code sent!', { duration: 3000 });
            setStep('otp');
        } catch (error) {
            const errorDetails = error?.response?.data?.error?.details;
            const message = Array.isArray(errorDetails) && errorDetails.length > 0
                ? errorDetails.join('. ')
                : error?.response?.data?.message || error?.response?.data?.error?.message || 'Failed to send code';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async () => {
        if (!otp || otp.length !== 6) return setError('Enter 6-digit OTP');

        setLoading(true);
        setError('');

        try {
            const response = await emailService.verifyPasswordResetOtp({ email: email.trim(), otp });
            setResetToken(response.data.resetToken);
            setStep('password');
            toast.success('OTP verified!', { duration: 3000 });
        } catch (error) {
            const errorDetails = error?.response?.data?.error?.details;
            const message = Array.isArray(errorDetails) && errorDetails.length > 0
                ? errorDetails.join('. ')
                : error?.response?.data?.message || error?.response?.data?.error?.message || 'Invalid OTP';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        const trimmed = password.trim();

        const allRulesMet = PASSWORD_RULES.every(r => r.test(trimmed));
        if (!allRulesMet) {
            return setError('Please make sure your password meets all requirements below.');
        }
        if (trimmed !== confirmPassword.trim()) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        setError('');

        try {
            await emailService.resetPassword({ resetToken, newPassword: trimmed });
            toast.success('Password changed successfully!', { duration: 3000 });
            navigate('/login', { replace: true });
        } catch (error) {
            const errorDetails = error?.response?.data?.error?.details;
            const message = Array.isArray(errorDetails) && errorDetails.length > 0
                ? errorDetails.join('. ')
                : error?.response?.data?.message || error?.response?.data?.error?.message || 'Password reset failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 py-8 px-4">
            <div className="sm:w-[420px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white py-12 shadow-sm">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-600 mb-6 font-medium text-sm">Step {step === 'email' ? '1' : step === 'otp' ? '2' : '3'} of 3</p>

                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-left">{error}</div>}

                {step === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <input className="w-full h-12 px-4 rounded-full border border-gray-300 outline-none text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
                        <button disabled={loading} className="w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 disabled:opacity-50 font-medium">Send verification code</button>
                    </form>
                )}

                {step === 'otp' && (
                    <div className="space-y-4">
                        <OtpInput length={6} onChange={setOtp} onComplete={handleOtpVerify} disabled={loading} />
                        <button onClick={handleOtpVerify} disabled={loading || otp.length !== 6} className="w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 disabled:opacity-50 font-medium">Verify</button>
                    </div>
                )}

                {step === 'password' && (
                    <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                className="w-full h-12 pl-4 pr-10 rounded-full border border-gray-300 outline-none text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 p-1 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1.5">
                            <p className="font-semibold text-gray-700 mb-1">Password Requirements:</p>
                            {PASSWORD_RULES.map((rule, idx) => {
                                const isMet = rule.test(password);
                                return (
                                    <div key={idx} className={`flex items-center gap-1.5 ${isMet ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                        {isMet ? (
                                            <Check size={13} className="text-green-600 shrink-0 stroke-[3]" />
                                        ) : (
                                            <X size={13} className="text-gray-400 shrink-0 stroke-[2]" />
                                        )}
                                        <span>{rule.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="relative flex items-center">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                className="w-full h-12 pl-4 pr-10 rounded-full border border-gray-300 outline-none text-sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 p-1 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button disabled={loading} className="w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 disabled:opacity-50 font-medium mt-2">Reset password</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;