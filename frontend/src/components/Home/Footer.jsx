import React from "react";

const Footer = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

        * {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      <footer className="relative mt-40 overflow-hidden border-t border-[#17375F]/10 bg-[#F7F9FC] px-6 py-16 text-[13px] text-slate-500 md:px-16 lg:px-24 xl:px-32">

        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          {/* Top Navy Glow */}
          <div
            className="absolute left-1/2 top-[-220px] h-[420px] w-[700px] -translate-x-1/2 rounded-full blur-[120px]"
            style={{
              background:
                "radial-gradient(circle, rgba(23,55,95,0.10) 0%, rgba(23,55,95,0.04) 45%, transparent 72%)",
            }}
          />

          {/* Left Glow */}
          <div
            className="absolute bottom-[-180px] left-[-150px] h-[380px] w-[380px] rounded-full blur-[110px]"
            style={{
              background:
                "radial-gradient(circle, rgba(23,55,95,0.08) 0%, transparent 70%)",
            }}
          />

          {/* Right Teal Glow */}
          <div
            className="absolute right-[-150px] bottom-[-150px] h-[350px] w-[350px] rounded-full blur-[110px]"
            style={{
              background:
                "radial-gradient(circle, rgba(18,181,176,0.07) 0%, transparent 70%)",
            }}
          />

          {/* Subtle Grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(#17375F 1px, transparent 1px), linear-gradient(90deg, #17375F 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
        </div>

        {/* Footer Content */}
        <div className="relative z-10 flex flex-wrap justify-center gap-10 md:gap-20 lg:justify-between">

          <div className="flex flex-wrap items-start gap-10 md:gap-[60px] xl:gap-[140px]">

            {/* Brand */}
            <a
              href="#"
              className="group"
              aria-label="CuratoCV Home"
            >
              <div className="flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="CuratoCV logo"
                  className="h-12 w-auto"
                />

                <img
                  src="/brand.svg"
                  alt="CuratoCV wordmark"
                  className="h-10 w-auto"
                />
              </div>

              <p className="mt-4 max-w-[220px] leading-6 text-slate-500">
                Build a professional resume with confidence.
              </p>
            </a>

            {/* Product */}
            <div>
              <p className="font-semibold text-[#17375F]">
                Product
              </p>

              <ul className="mt-3 space-y-2.5">
                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Home
                  </a>
                </li>

                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Support
                  </a>
                </li>

                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Pricing
                  </a>
                </li>

                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Affiliate
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="font-semibold text-[#17375F]">
                Resources
              </p>

              <ul className="mt-3 space-y-2.5">
                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Company
                  </a>
                </li>

                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Blogs
                  </a>
                </li>

                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Community
                  </a>
                </li>

                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Careers

                    <span className="ml-2 rounded-md bg-[#17375F] px-2 py-1 text-xs text-white shadow-sm shadow-[#17375F]/20">
                      We're hiring!
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    About
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="font-semibold text-[#17375F]">
                Legal
              </p>

              <ul className="mt-3 space-y-2.5">
                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Privacy
                  </a>
                </li>

                <li>
                  <a
                    href="/"
                    className="transition hover:text-[#17375F]"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-end gap-2 max-md:items-center max-md:text-center">

            <p className="max-w-60 leading-6">
              Making every customer feel valued—no matter the size of your
              audience.
            </p>

            {/* Social Icons */}
            <div className="mt-3 flex items-center gap-4">

              {/* Dribbble */}
              <a
                href="https://dribbble.com/Saahillia"
                target="_blank"
                rel="noreferrer"
                aria-label="Dribbble"
                className="text-[#17375F] transition hover:text-[#102B4A] hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
                  <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
                  <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/saahil-lia-4b2ab0248/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="text-[#17375F] transition hover:text-[#102B4A] hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>

              {/* X */}
              <a
                href="https://x.com/saahillia"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="text-[#17375F] transition hover:text-[#102B4A] hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://www.youtube.com/@UparSeEngineer"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="text-[#17375F] transition hover:text-[#102B4A] hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6"
                >
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3z" />
                </svg>
              </a>
            </div>

            <p className="mt-3 text-center text-slate-400">
              © 2026 CuratoCV
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;