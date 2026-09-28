/**
 * Shared action button with CuratoCV theme colors, focus treatment, and touch sizing.
 * Use variants to express intent; destructive actions remain visibly distinct from primary actions.
 */
const variants = {
    primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
    secondary: "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 active:bg-brand-100",
    accent: "bg-accent-500 text-white shadow-sm hover:bg-accent-600 active:bg-accent-700",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
    quiet: "bg-transparent text-brand-700 hover:bg-brand-50 active:bg-brand-100",
};

const sizes = {
    sm: "min-h-9 px-3 text-sm",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-6 text-base",
    icon: "size-11 p-2",
};

const Button = ({
    type = "button",
    variant = "primary",
    size = "md",
    className = "",
    children,
    ...props
}) => (
    <button
        type={type}
        className={`cv-button ${size === "icon" ? "cv-button--icon" : ""} inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
        {...props}
    >
        {children}
    </button>
);

export default Button;
