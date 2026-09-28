/**
 * Gives account pages a shared responsive frame and the canonical CuratoCV identity.
 * Keeping this frame in Platform makes login, recovery, and verification pages consistent.
 */
import BrandLockup from "../common/BrandLockup";

const AuthPageLayout = ({ children }) => (
    <div className="flex min-h-svh flex-col bg-gray-50 px-4 py-5 sm:px-6 sm:py-7">
        <header className="mx-auto w-full max-w-5xl">
            <BrandLockup />
        </header>
        <main className="cv-auth-content flex flex-1 items-center justify-center py-8 sm:py-10">
            {children}
        </main>
    </div>
);

export default AuthPageLayout;
