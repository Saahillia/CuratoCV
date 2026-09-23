import { Mail, Phone, MapPin, Globe } from "lucide-react";

const LinkedInIcon = ({ className = "size-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM3.54 20.45H7.1V8.99H3.54v11.46Z" />
  </svg>
);
import { resolveSpacing } from "../../utils/layoutSpacing";
import { resolveColors } from "../../utils/colorResolver";
import { resolveHeader } from "../../utils/headerResolver";
import { resolvePhoto } from "../../utils/photoResolver";
import { resolveLinks } from "../../utils/linksResolver";
import { resolveFooter } from "../../utils/footerResolver";

const MinimalImageTemplate = ({ data, colors, accentColor, spacing, header, photo, links, footer }) => {
    const sp = resolveSpacing(spacing);
    const col = resolveColors(colors || { accent: accentColor });
    const hdr = resolveHeader(header);
    const ph = resolvePhoto(photo);
    const lnks = resolveLinks(links);
    const ftr = resolveFooter(footer);

    const linkTarget = lnks.target === "same-tab" ? "_self" : "_blank";
    const linkRel = lnks.target === "same-tab" ? undefined : "noopener noreferrer";
    const linkClass = lnks.style === "underline" ? "underline" : "hover:underline";
    const linkColor = lnks.style === "accent" ? col.accent : col.muted;

    const image = data?.personal_info?.image;
    const isImageFile = typeof File !== "undefined" && image instanceof File;
    const imageSrc = isImageFile ? URL.createObjectURL(image) : image;
    const showPhoto = ph.visibility === "visible" && imageSrc;

    const photoStyles = {
        width: ph.size === "small" ? "56px" : ph.size === "large" ? "110px" : "80px",
        height: ph.size === "small" ? "56px" : ph.size === "large" ? "110px" : "80px",
        objectFit: ph.fit,
        borderRadius: ph.shape === "circle" ? "9999px" : ph.shape === "rounded" ? "10px" : "0px",
        flexShrink: 0
    };

    const alignmentClass = hdr.alignment === "center" ? "text-center items-center" : hdr.alignment === "right" ? "text-right items-end" : "text-left items-start";

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month] = dateStr.split("-");
        const date = new Date(year, month - 1);
        return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
        });
    };

    return (
        <div
            className={`max-w-4xl mx-auto ${sp.densityClass} text-sm leading-normal`}
            style={{ backgroundColor: col.background, color: col.text }}
        >
            {/* Header / Top Section */}
            <header className={`flex gap-6 pb-6 mb-6 border-b items-center ${hdr.alignment === "center" ? "justify-center text-center" : hdr.alignment === "right" ? "justify-end text-right flex-row-reverse" : "justify-start text-left"}`} style={{ borderColor: col.border }}>
                {showPhoto && (
                    <img
                        src={imageSrc}
                        style={photoStyles}
                        alt={data?.personal_info?.full_name ? `${data.personal_info.full_name} profile` : "Profile"}
                    />
                )}
                <div className={`flex flex-col ${alignmentClass}`}>
                    <h1 className="text-3xl font-bold tracking-wider" style={{ color: col.heading }}>
                        {data?.personal_info?.full_name || "Your Name"}
                    </h1>
                    <p className="uppercase font-medium text-xs tracking-widest mt-1" style={{ color: col.accent }}>
                        {data?.personal_info?.profession || "Profession"}
                    </p>
                </div>
            </header>

            {/* Main Grid: Sidebar (Col 1) + Content (Col 2) */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left Sidebar */}
                <aside className="col-span-1 border-r pr-4 space-y-6" style={{ borderColor: col.border }}>
                    {/* Contact */}
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: col.heading }}>
                            Contact
                        </h2>
                        <div className="space-y-2 text-xs" style={{ color: col.muted }}>
                            {data?.personal_info?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={13} style={{ color: col.accent }} />
                                    <span>{data.personal_info.phone}</span>
                                </div>
                            )}
                            {data?.personal_info?.email && (
                                <a
                                    href={`mailto:${data.personal_info.email}`}
                                    target={linkTarget}
                                    rel={linkRel}
                                    className={`flex items-center gap-2 ${linkClass} break-all`}
                                    style={{ color: linkColor }}
                                >
                                    <Mail size={13} style={{ color: col.accent }} />
                                    <span>{data.personal_info.email}</span>
                                </a>
                            )}
                            {data?.personal_info?.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={13} style={{ color: col.accent }} />
                                    <span>{data.personal_info.location}</span>
                                </div>
                            )}
                            {data?.personal_info?.linkedin && (
                                <a
                                    href={data.personal_info.linkedin.startsWith("http") ? data.personal_info.linkedin : `https://${data.personal_info.linkedin}`}
                                    target={linkTarget}
                                    rel={linkRel}
                                    className={`flex items-center gap-2 ${linkClass} break-all`}
                                    style={{ color: linkColor }}
                                >
                                    <LinkedInIcon className="size-3.5" style={{ color: col.accent }} />
                                    <span>{data.personal_info.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                                </a>
                            )}
                            {data?.personal_info?.website && (
                                <a
                                    href={data.personal_info.website.startsWith("http") ? data.personal_info.website : `https://${data.personal_info.website}`}
                                    target={linkTarget}
                                    rel={linkRel}
                                    className={`flex items-center gap-2 ${linkClass} break-all`}
                                    style={{ color: linkColor }}
                                >
                                    <Globe size={13} style={{ color: col.accent }} />
                                    <span>{data.personal_info.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                                </a>
                            )}
                        </div>
                    </section>

                    {/* Education */}
                    {Array.isArray(data?.education) && data.education.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: col.heading }}>
                                Education
                            </h2>
                            <div className="space-y-3">
                                {data.education.map((edu, index) => (
                                    <div key={index}>
                                        <p className="font-semibold text-xs uppercase" style={{ color: col.text }}>
                                            {edu.degree} {edu.field && `in ${edu.field}`}
                                        </p>
                                        <p className="text-xs" style={{ color: col.accent }}>
                                            {edu.institution}
                                        </p>
                                        <p className="text-[11px]" style={{ color: col.muted }}>
                                            {formatDate(edu.graduation_date)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Skills */}
                    {Array.isArray(data?.skills) && data.skills.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: col.heading }}>
                                Skills
                            </h2>
                            <ul className="space-y-1 text-xs" style={{ color: col.text }}>
                                {data.skills.map((skill, index) => (
                                    <li key={index} className="flex items-center gap-1.5">
                                        <span className="size-1 rounded-full" style={{ backgroundColor: col.accent }}></span>
                                        <span>{skill}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>

                {/* Right Content */}
                <main className="col-span-2 space-y-6">
                    {/* Summary */}
                    {data?.professional_summary && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: col.heading }}>
                                Summary
                            </h2>
                            <p className="text-xs leading-relaxed" style={{ color: col.text }}>
                                {data.professional_summary}
                            </p>
                        </section>
                    )}

                    {/* Experience */}
                    {Array.isArray(data?.experience) && data.experience.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: col.heading }}>
                                Experience
                            </h2>
                            <div className="space-y-4">
                                {data.experience.map((exp, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-semibold text-xs" style={{ color: col.text }}>
                                                {exp.position}
                                            </h3>
                                            <span className="text-[11px]" style={{ color: col.muted }}>
                                                {formatDate(exp.start_date)} - {exp.is_current ? "Present" : formatDate(exp.end_date)}
                                            </span>
                                        </div>
                                        <p className="text-xs mb-1 font-medium" style={{ color: col.accent }}>
                                            {exp.company}
                                        </p>
                                        {exp.description && (
                                            <ul className="list-disc list-inside text-xs leading-relaxed space-y-0.5" style={{ color: col.text }}>
                                                {exp.description.split("\n").map((line, i) => (
                                                    <li key={i}>{line}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Projects */}
                    {Array.isArray(data?.project) && data.project.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: col.heading }}>
                                Projects
                            </h2>
                            <div className="space-y-4">
                                {data.project.map((project, index) => (
                                    <div key={index}>
                                        <h3 className="text-xs font-semibold" style={{ color: col.text }}>
                                            {project.name}
                                        </h3>
                                        {project.type && (
                                            <p className="text-[11px] mb-1 font-medium" style={{ color: col.accent }}>
                                                {project.type}
                                            </p>
                                        )}
                                        {project.description && (
                                            <ul className="list-disc list-inside text-xs space-y-0.5" style={{ color: col.text }}>
                                                {project.description.split("\n").map((line, i) => (
                                                    <li key={i}>{line}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Footer */}
                    {ftr.visibility === "visible" && (
                        <footer className="pt-4 border-t text-[10px] text-center" style={{ borderColor: col.border, color: col.muted, textAlign: ftr.alignment }}>
                            Generated with CuratoCV
                        </footer>
                    )}
                </main>
            </div>
        </div>
    );
};

export default MinimalImageTemplate;
