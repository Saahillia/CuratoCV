import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    BriefcaseBusiness,
    CreditCard,
    FileText,
    KeyRound,
    Mail,
    ShieldCheck,
    ShieldAlert,
    Trash2,
} from "lucide-react";
import AccountCenterNav from "../components/common/AccountCenterNav";

const ActionCard = ({ icon: Icon, title, description, to, action, tone = "blue" }) => (
    <section className="flex min-w-0 flex-col justify-between gap-5 rounded-2xl border border-[#D9E7F2] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone === "red" ? "bg-red-50 text-red-600" : "bg-[#E8F0F7] text-[#17375F]"}`}>
                <Icon aria-hidden="true" size={20} />
            </span>
            <div className="min-w-0">
                <h2 className="font-bold text-[#102A43]">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#486581]">{description}</p>
            </div>
        </div>
        <Link
            to={to}
            className={`inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0353A4] ${tone === "red" ? "border border-red-200 text-red-700 hover:bg-red-50" : "bg-[#E8F0F7] text-[#17375F] hover:bg-[#D9E7F2]"}`}
        >
            {action} <ArrowRight aria-hidden="true" size={16} />
        </Link>
    </section>
);

const Settings = () => {
    const user = useSelector((state) => state.auth.user);
    const emailVerified = Boolean(user?.emailVerified);

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-[#F7FAFC] py-6 sm:py-8">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <AccountCenterNav />
                <header className="mb-7">
                    <p className="text-sm font-semibold text-[#0353A4]">Account center</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#102A43] sm:text-3xl">Settings</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#486581] sm:text-base">
                        Manage account security, product access, billing, and data controls for CuratoCV.
                    </p>
                </header>

                <div className="space-y-8">
                    <section aria-labelledby="security-heading">
                        <div className="mb-3 flex items-center gap-2">
                            <ShieldCheck aria-hidden="true" className="text-[#17375F]" size={18} />
                            <h2 id="security-heading" className="text-lg font-bold text-[#102A43]">Security &amp; sign-in</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <ActionCard
                                icon={emailVerified ? Mail : ShieldAlert}
                                title="Email verification"
                                description={emailVerified ? `Your sign-in email${user?.email ? ` (${user.email})` : ""} is verified.` : "Verify your email to protect account recovery and important account notices."}
                                to={emailVerified ? "/app/profile" : "/verify-email"}
                                action={emailVerified ? "View profile" : "Verify email"}
                            />
                            <ActionCard
                                icon={KeyRound}
                                title="Password"
                                description="Use the secure password recovery flow to set a new password for your account."
                                to="/forgot-password"
                                action="Reset password"
                            />
                        </div>
                    </section>

                    <section aria-labelledby="products-heading">
                        <div className="mb-3 flex items-center gap-2">
                            <BriefcaseBusiness aria-hidden="true" className="text-[#17375F]" size={18} />
                            <h2 id="products-heading" className="text-lg font-bold text-[#102A43]">Your products</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <ActionCard icon={FileText} title="Resume Builder" description="Create and manage your resumes and professional documents." to="/products/resume-builder" action="Open Resume Builder" />
                            <ActionCard icon={BriefcaseBusiness} title="Memo" description="Open your Memo workspace to organize notes and documents." to="/products/memo" action="Open Memo" />
                        </div>
                    </section>

                    <section aria-labelledby="billing-heading">
                        <div className="mb-3 flex items-center gap-2">
                            <CreditCard aria-hidden="true" className="text-[#17375F]" size={18} />
                            <h2 id="billing-heading" className="text-lg font-bold text-[#102A43]">Plan &amp; billing</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <ActionCard icon={CreditCard} title="Subscription and usage" description="Review your current plan, product usage, payment status, and subscription actions." to="/app/billing" action="Manage billing" />
                            <ActionCard icon={Mail} title="Account details" description="Review your account name, email, verification status, and membership details." to="/app/profile#personal-information" action="View account details" />
                        </div>
                    </section>

                    <section aria-labelledby="privacy-heading">
                        <div className="mb-3 flex items-center gap-2">
                            <ShieldCheck aria-hidden="true" className="text-[#17375F]" size={18} />
                            <h2 id="privacy-heading" className="text-lg font-bold text-[#102A43]">Privacy &amp; data</h2>
                        </div>
                        <ActionCard
                            icon={Trash2}
                            title="Account and data deletion"
                            description="Review the impact and confirmation steps before permanently deleting your account and associated data."
                            to="/app/profile#danger-zone"
                            action="Review deletion options"
                            tone="red"
                        />
                    </section>
                </div>
            </div>
        </main>
    );
};

export default Settings;
