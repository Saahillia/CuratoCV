import { NavLink } from "react-router-dom";
import { CreditCard, Settings, UserRound } from "lucide-react";

const items = [
    { to: "/app/profile", label: "Profile", icon: UserRound, end: true },
    { to: "/app/settings", label: "Settings", icon: Settings },
    { to: "/app/billing", label: "Billing", icon: CreditCard },
];

const AccountCenterNav = () => (
    <nav aria-label="Account sections" className="mb-6 -mx-1 overflow-x-auto px-1">
        <div className="flex min-w-max gap-2 border-b border-slate-200">
            {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                        `inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0353A4] sm:px-4 ${
                            isActive
                                ? "border-[#0353A4] text-[#17375F]"
                                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                        }`
                    }
                >
                    <Icon aria-hidden="true" size={16} />
                    {label}
                </NavLink>
            ))}
        </div>
    </nav>
);

export default AccountCenterNav;
