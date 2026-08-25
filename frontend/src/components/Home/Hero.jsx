import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Hero = () => {
  const { user } = useSelector((state) => state.auth);

  const [menuOpen, setMenuOpen] = React.useState(false);

  const benefits = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-5"
        >
          <path d="M12 3v18" />
          <path d="M17 8a5 5 0 0 0-5-2.5A5 5 0 0 0 7 8c0 4 5 4 5 4s5 0 5 4a5 5 0 0 1-5 2.5A5 5 0 0 1 7 16" />
        </svg>
      ),
      title: "AI-Powered",
      description:
        "Create stronger resume content with intelligent AI assistance.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-5"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      title: "ATS-Friendly",
      description:
        "Build resumes designed to work well with modern ATS systems.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-5"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      title: "Professional Templates",
      description:
        "Choose clean, modern layouts built for professional applications.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-5"
        >
          <path d="M12 3v12" />
          <path d="M8 11l4 4 4-4" />
          <path d="M5 21h14" />
        </svg>
      ),
      title: "Instant Export",
      description:
        "Download your polished resume whenever you're ready to apply.",
    },
  ];

  return (
    <>
      <div className="relative min-h-screen overflow-hidden text-[#0F172A]">

        {/* Navbar */}
        <header className="relative z-50">
          <nav className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 md:px-10 lg:px-16 xl:px-20">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center"
              aria-label="CuratoCV Home"
            >
              <div className="flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="CuratoCV"
                  className="h-12 w-auto object-contain"
                />

                <img
                  src="/brand.svg"
                  alt="CuratoCV wordmark"
                  className="h-10 w-auto object-contain"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-9 md:flex">
              <a
                href="#home"
                className="text-sm font-medium text-[#334155] transition hover:text-[#1D3557]"
              >
                Home
              </a>

              <a
                href="#features"
                className="text-sm font-medium text-[#334155] transition hover:text-[#1D3557]"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="text-sm font-medium text-[#334155] transition hover:text-[#1D3557]"
              >
                Testimonials
              </a>

              <a
                href="#cta"
                className="text-sm font-medium text-[#334155] transition hover:text-[#1D3557]"
              >
                Contact
              </a>
            </div>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/app?state=login"
                className="rounded-full px-5 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-white/70 hover:text-[#1D3557]"
                hidden={user}
              >
                Log in
              </Link>

              <Link
                to="/app?state=register"
                className="rounded-full bg-[#1D3557] px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-[#1D3557]/25 transition hover:bg-[#162E4E] active:scale-[0.98]"
                hidden={user}
              >
                Get started
              </Link>

              <Link
                to="/app"
                className="hidden rounded-full bg-[#1D3557] px-8 py-2 text-white transition hover:bg-[#162E4E] active:scale-95 md:block"
                hidden={!user}
              >
                Dashboard
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white/80 text-[#1D3557] shadow-sm transition hover:bg-white md:hidden"
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
          </nav>
        </header>

        {/* Mobile Menu */}
        <div
          className={`fixed inset-0 z-[100] md:hidden ${
            menuOpen ? "visible" : "invisible"
          }`}
        >
          {/* Overlay */}
          <div
            onClick={() => setMenuOpen(false)}
            className={`absolute inset-0 bg-[#1D3557]/30 backdrop-blur-sm transition-opacity duration-300 ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Drawer */}
          <div
            className={`absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white px-7 py-6 shadow-2xl transition-transform duration-300 ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center"
              >
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.svg"
                    alt="CuratoCV"
                    className="h-10 w-auto"
                  />

                  <img
                    src="/brand.svg"
                    alt="CuratoCV wordmark"
                    className="h-8 w-auto"
                  />
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#1D3557] hover:bg-[#F8FAFC]"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-14 flex flex-col gap-2">
              <a
                href="#home"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base font-medium text-[#334155] hover:bg-[#F8FAFC] hover:text-[#1D3557]"
              >
                Home
              </a>

              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base font-medium text-[#334155] hover:bg-[#F8FAFC] hover:text-[#1D3557]"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base font-medium text-[#334155] hover:bg-[#F8FAFC] hover:text-[#1D3557]"
              >
                How it works
              </a>

              <a
                href="#cta"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base font-medium text-[#334155] hover:bg-[#F8FAFC] hover:text-[#1D3557]"
              >
                Get started
              </a>
            </div>

            <div className="mt-auto space-y-3 border-t border-[#E2E8F0] pt-6">
              <Link
                to="/app?state=login"
                onClick={() => setMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-full border border-[#E2E8F0] font-medium text-[#334155] transition hover:border-[#1D3557]/30 hover:bg-[#F8FAFC]"
              >
                Log in
              </Link>

              <Link
                to="/app?state=register"
                onClick={() => setMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-full bg-[#1D3557] font-medium text-white transition hover:bg-[#162E4E]"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>

        {/* Hero */}
        <main id="home">
          <section className="relative mx-auto flex max-w-[1440px] flex-col items-center px-6 pb-20 pt-20 text-center md:px-10 md:pt-28 lg:px-16 lg:pt-32 xl:px-20">

            {/* Announcement */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1D3557]/15 bg-white/60 px-4 py-2 text-xs font-medium text-[#1D3557] shadow-sm shadow-[#1D3557]/10 backdrop-blur-sm">
              <span className="flex size-1.5 rounded-full bg-[#00BFA6]" />

              AI-powered resume creation

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>

            {/* Headline */}
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-[#0F172A] sm:text-6xl md:text-7xl lg:text-[76px]">
              Create a resume that{" "}
              <span className="bg-gradient-to-r from-[#1D3557] via-[#4A90E2] to-[#00BFA6] bg-clip-text text-transparent">
                gets noticed.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#334155] sm:text-lg">
              Create, improve, and customize a professional resume with
              AI-powered assistance — all in one simple workspace.
            </p>

            {/* CTA */}
            <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                to="/app?state=register"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1D3557] px-8 text-sm font-semibold text-white shadow-lg shadow-[#1D3557]/25 transition hover:bg-[#162E4E] hover:shadow-xl hover:shadow-[#1D3557]/30 active:scale-[0.98] sm:w-auto"
              >
                Create your resume

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>

              <a
                href="#features"
                className="flex h-12 w-full items-center justify-center rounded-full border border-[#E2E8F0] bg-white/70 px-8 text-sm font-semibold text-[#334155] shadow-sm backdrop-blur-sm transition hover:border-[#1D3557]/25 hover:bg-white sm:w-auto"
              >
                Explore features
              </a>
            </div>

            {/* Trust / Product Value */}
            <div className="mt-16 w-full max-w-5xl">
              <div className="mb-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Everything you need to build a better resume
                </p>
              </div>

              <div
                id="features"
                className="grid overflow-hidden rounded-3xl border border-[#1D3557]/10 bg-white/75 shadow-[0_20px_60px_-30px_rgba(29,53,87,0.25)] backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4"
              >
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit.title}
                    className={`group p-6 text-left transition hover:bg-white/80 ${
                      index !== benefits.length - 1
                        ? "border-b border-[#E2E8F0] lg:border-b-0 lg:border-r"
                        : ""
                    } ${index === 1 ? "sm:border-b lg:border-b-0" : ""}`}
                  >
                    <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#1D3557] transition group-hover:bg-[#1D3557] group-hover:text-white">
                      {benefit.icon}
                    </div>

                    <h3 className="text-sm font-semibold text-[#0F172A]">
                      {benefit.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-[#334155]">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Preview */}
            <div
              id="how-it-works"
              className="relative mt-20 w-full max-w-5xl"
            >
              <div className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-r from-[#F8FAFC] via-white to-[#E6F8F5] blur-2xl" />

              <div className="overflow-hidden rounded-3xl border border-[#1D3557]/10 bg-white text-left shadow-[0_30px_80px_-35px_rgba(29,53,87,0.35)]">

                {/* Browser Header */}
                <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]/80 px-5 py-3">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-500" />
                    <span className="size-2.5 rounded-full bg-yellow-400" />
                    <span className="size-2.5 rounded-full bg-green-500" />
                  </div>

                  <div className="w-10" />
                </div>

                {/* Preview */}
                <div className="grid min-h-[320px] bg-[#F8FAFC] md:grid-cols-[0.75fr_1.25fr]">

                  {/* Editor */}
                  <div className="border-b border-[#E2E8F0] bg-white/90 p-6 md:border-b-0 md:border-r">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Resume editor
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                          Your professional profile
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#E6F8F5] px-2.5 py-1 text-[10px] font-semibold text-[#00BFA6]">
                        AI Ready
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 h-2 w-20 rounded-full bg-[#E2E8F0]" />
                        <div className="h-9 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]" />
                      </div>

                      <div>
                        <div className="mb-2 h-2 w-24 rounded-full bg-[#E2E8F0]" />
                        <div className="h-9 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]" />
                      </div>

                      <div>
                        <div className="mb-2 h-2 w-16 rounded-full bg-[#E2E8F0]" />
                        <div className="h-20 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]" />
                      </div>
                    </div>
                  </div>

                  {/* Resume */}
                  <div className="flex items-center justify-center p-6">
                    <div className="w-full max-w-[340px] rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-lg shadow-[#1D3557]/10">
                      <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                        <div>
                          <div className="h-3 w-28 rounded bg-[#1D3557]" />
                          <div className="mt-2 h-2 w-36 rounded bg-[#E2E8F0]" />
                        </div>

                        <div className="size-8 rounded-full bg-[#E6F8F5]" />
                      </div>

                      <div className="mt-5 space-y-4">
                        <div>
                          <div className="mb-2 h-2 w-16 rounded bg-[#1D3557]" />
                          <div className="h-2 w-full rounded bg-[#E2E8F0]" />
                          <div className="mt-1.5 h-2 w-5/6 rounded bg-[#E2E8F0]" />
                        </div>

                        <div>
                          <div className="mb-2 h-2 w-20 rounded bg-[#1D3557]" />
                          <div className="h-2 w-full rounded bg-[#E2E8F0]" />
                          <div className="mt-1.5 h-2 w-4/5 rounded bg-[#E2E8F0]" />
                          <div className="mt-1.5 h-2 w-11/12 rounded bg-[#E2E8F0]" />
                        </div>

                        <div>
                          <div className="mb-2 h-2 w-14 rounded bg-[#00BFA6]" />

                          <div className="flex flex-wrap gap-1.5">
                            <span className="h-5 w-12 rounded bg-[#E6F8F5]" />
                            <span className="h-5 w-16 rounded bg-[#E6F8F5]" />
                            <span className="h-5 w-14 rounded bg-[#E6F8F5]" />
                            <span className="h-5 w-10 rounded bg-[#E6F8F5]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </section>
        </main>
      </div>

      {/* Font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            font-family: 'Inter', sans-serif;
          }

          html {
            scroll-behavior: smooth;
          }

          body {
            margin: 0;
          }
        `}
      </style>
    </>
  );
};

export default Hero;