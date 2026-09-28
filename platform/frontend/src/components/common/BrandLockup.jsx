/**
 * Canonical CuratoCV brand mark and wordmark lockup.
 * All platform and product pages should reuse these exact assets, proportions, and spacing.
 */
import { Link } from "react-router-dom";

const BrandLockup = ({ className = "", onClick }) => (
    <Link
        to="/"
        onClick={onClick}
        className={`inline-flex shrink-0 items-center gap-2 ${className}`}
        aria-label="CuratoCV home"
    >
        <img
            src="/logo.svg"
            alt=""
            width="48"
            height="48"
            draggable="false"
            className="size-12 shrink-0 object-contain"
        />
        <img
            src="/brand.svg"
            alt=""
            width="900"
            height="220"
            draggable="false"
            className="h-10 w-auto shrink-0 object-contain"
        />
    </Link>
);

export default BrandLockup;
