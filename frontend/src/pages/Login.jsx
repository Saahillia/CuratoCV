import { Lock, Mail, User2Icon, Check, X, Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../app/features/authSlice';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'Uppercase & lowercase letters', test: (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) },
    { label: 'At least one number (0-9)', test: (pwd) => /\d/.test(pwd) },
    { label: 'Special character (!@#$%^&*)', test: (pwd) => /[!@#$%^&*]/.test(pwd) },
];

const Login = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const query = new URLSearchParams(window.location.search);
    const urlState = query.get('state');
    const [state, setState] = React.useState(urlState || "login")

    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: ''
    })

    const [loading, setLoadingState] = React.useState(false);
    const [passwordFocused, setPasswordFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingState(true);
        try {
            const { data } = await api.post(`/users/${state}`, formData);

            // The API returns { success, data: { userId, name, email, token } }.
            // login() expects { token, user }.
            const payload = data?.data ?? data;

            dispatch(login({
                token: payload.token,
                user: {
                    id: payload.userId,
                    name: payload.name,
                    email: payload.email,
                    emailVerified: payload.emailVerified,
                    createdAt: payload.createdAt,
                    updatedAt: payload.updatedAt,
                },
            }));

            toast.success(`${state === "login" ? "Logged in" : "Registered"} successfully!`, { duration: 3000 });
            navigate("/app", { replace: true });
        } catch (error) {
            const errorDetails = error?.response?.data?.error?.details;
            const errorMessage = Array.isArray(errorDetails) && errorDetails.length > 0
                ? errorDetails.join('\n')
                : error?.response?.data?.message || error?.response?.data?.error?.message || error.message;
            toast.error(errorMessage, { duration: 5000 });
        } finally {
            setLoadingState(false);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 py-8 px-4">
            <form onSubmit={handleSubmit} className="sm:w-[400px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white shadow-sm">
                <h1 className="text-gray-900 text-3xl mt-10 font-medium">{state === "login" ? "Login" : "Sign up"}</h1>
                <p className="text-gray-500 text-sm mt-2">Please {state === "login" ? "log in" : "sign up"} to continue</p>
                {state !== "login" && (
                    <div className="flex items-center mt-6 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                        <User2Icon size={16} color="#6B7280" />
                        <input type="text" name="name" placeholder="Full Name" className="border-none outline-none ring-0 w-full pr-4 text-sm" value={formData.name} onChange={handleChange} required />
                    </div>
                )}
                <div className="flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                    <Mail size={13} color="#6B7280" />
                    <input type="email" name="email" placeholder="Email id" className="border-none outline-none ring-0 w-full pr-4 text-sm" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                    <Lock size={13} color="#6B7280" />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        className="border-none outline-none ring-0 w-full pr-4 text-sm"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setPasswordFocused(true)}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 hover:text-gray-600"
                    >
                        {showPassword ? (
                            <EyeOff size={16} color="#6B7280" />
                        ) : (
                            <Eye size={16} color="#6B7280" />
                        )}
                    </button>
                </div>

                {state !== "login" && (passwordFocused || formData.password.length > 0) && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-left text-xs space-y-1.5 transition-all">
                        <p className="font-semibold text-gray-700 mb-1">Password Requirements:</p>
                        {PASSWORD_RULES.map((rule, idx) => {
                            const isMet = rule.test(formData.password);
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
                )}

                {state === "login" && (
                    <div className="mt-4 text-left text-blue-500">
                        <button
                            className="text-sm hover:underline cursor-pointer"
                            type="button"
                            onClick={() => navigate("/reset-password")}
                        >
                            Forgot password?
                        </button>
                    </div>
                )}
                <button type="submit" disabled={loading} className="mt-5 w-full h-11 rounded-full text-white bg-blue-500 hover:opacity-90 transition-opacity disabled:opacity-50 font-medium">
                    {loading ? "Please wait..." : state === "login" ? "Login" : "Sign up"}
                </button>
                <p onClick={() => setState(prev => prev === "login" ? "register" : "login")} className="text-gray-500 text-sm mt-3 mb-10 cursor-pointer">
                    {state === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                    <span className="text-blue-500 hover:underline font-medium">click here</span>
                </p>
            </form>

        </div>
    )
}

export default Login