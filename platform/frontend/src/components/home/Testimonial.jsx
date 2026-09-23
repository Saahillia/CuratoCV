import React from "react";
import Title from "./Title";
import {
  BookUserIcon,
  CheckCircle2,
  Sparkles,
  Target,
  FileText,
  BriefcaseBusiness,
} from "lucide-react";

const Testimonial = () => {
  const cardsData = [
    {
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
      name: "Arjun Mehta",
      role: "Software Engineer",
      quote:
        "CuratoCV helped me turn my project work into clear, impact-focused resume points. The AI suggestions made the process much easier.",
      feature: "AI Resume Writing",
      icon: Sparkles,
    },
    {
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
      name: "Maya Sharma",
      role: "UI/UX Designer",
      quote:
        "I wanted something clean and professional without spending hours formatting everything. CuratoCV made the whole process feel effortless.",
      feature: "Professional Templates",
      icon: FileText,
    },
    {
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
      name: "Rohan Kapoor",
      role: "Computer Science Graduate",
      quote:
        "As a fresher, I wasn't sure how to present my project and skills. CuratoCV helped me turn them into a resume that actually feels professional.",
      feature: "Resume Builder",
      icon: BriefcaseBusiness,
    },
    {
      image:
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop",
      name: "Ananya Rao",
      role: "Data Analyst",
      quote:
        "The AI helped me rewrite my experience with stronger action words and measurable impact. My resume feels much more focused now.",
      feature: "AI Optimization",
      icon: Sparkles,
    },
    {
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop",
      name: "Vikram Shah",
      role: "Product Manager",
      quote:
        "I had years of experience but struggled to keep my resume concise. CuratoCV helped me highlight the work that actually matters.",
      feature: "Resume Optimization",
      icon: Target,
    },
    {
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop",
      name: "Priya Nair",
      role: "Marketing Specialist",
      quote:
        "The biggest difference was how quickly I could customize my resume for different opportunities without starting from scratch.",
      feature: "Job-Focused Editing",
      icon: CheckCircle2,
    },
  ];

  const CreateCard = ({ card }) => {
    const Icon = card.icon;

    return (
      <article className="group mx-3 w-[320px] shrink-0 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_30px_rgba(29,53,87,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B8CADB] hover:shadow-[0_15px_40px_rgba(29,53,87,0.12)]">
        {/* User */}
        <div className="flex items-center gap-3">
          <img
            className="size-11 rounded-full object-cover ring-2 ring-white"
            src={card.image}
            alt={card.name}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-[#0F172A]">
                {card.name}
              </p>

              <svg
                width="13"
                height="13"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z"
                  fill="#1D3557"
                />
              </svg>
            </div>

            <p className="text-xs text-[#334155]">{card.role}</p>
          </div>
        </div>

        {/* Testimonial */}
        <p className="mt-5 min-h-[96px] text-sm leading-6 text-[#334155]">
          “{card.quote}”
        </p>

        {/* Feature */}
        <div className="mt-5 flex items-center gap-2 border-t border-[#E2E8F0] pt-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#E6F8F5] text-[#00BFA6]">
            <Icon className="size-4" />
          </div>

          <span className="text-xs font-medium text-[#334155]">
            {card.feature}
          </span>
        </div>
      </article>
    );
  };

  return (
    <>
      <section
        id="testimonials"
        className="my-16 flex scroll-mt-12 flex-col items-center"
      >
        {/* Badge */}
        <div className="flex w-fit items-center gap-2 rounded-full border border-[#B8CADB] bg-[#F3F7FA] px-6 py-1.5 text-sm font-medium text-[#1D3557] shadow-[0_0_20px_rgba(29,53,87,0.08)]">
          <BookUserIcon className="size-4 stroke-[#00BFA6]" />
          <span>What job seekers say</span>
        </div>

        {/* Title */}
        <Title
          title="Built for every career stage"
          description="From your first resume to your next big opportunity, CuratoCV helps you present your experience with clarity and confidence."
        />
      </section>

      {/* First Row */}
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#F8FAFC] to-transparent md:w-32" />

        <div className="marquee-inner flex min-w-max pt-6 pb-5">
          {[...cardsData, ...cardsData].map((card, index) => (
            <CreateCard key={`row-one-${index}`} card={card} />
          ))}
        </div>

        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#F8FAFC] to-transparent md:w-32" />
      </div>

      {/* Second Row */}
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#F8FAFC] to-transparent md:w-32" />

        <div className="marquee-inner marquee-reverse flex min-w-max pt-6 pb-5">
          {[...cardsData].reverse().map((card, index) => (
            <CreateCard key={`row-two-${index}`} card={card} />
          ))}
        </div>

        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#F8FAFC] to-transparent md:w-32" />
      </div>

      <style>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        .marquee-inner {
          animation: marqueeScroll 32s linear infinite;
          will-change: transform;
        }

        .marquee-reverse {
          animation-direction: reverse;
        }

        .marquee-inner:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-inner {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

export default Testimonial;