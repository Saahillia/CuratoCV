import { Mail, Phone, MapPin, Globe } from "lucide-react";
import { resolveSpacing } from "../../utils/layoutSpacing";
import { resolveColors } from "../../utils/colorResolver";

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

import { resolveHeader } from "../../utils/headerResolver";
import { resolvePhoto } from "../../utils/photoResolver";
import { resolveLinks } from "../../utils/linksResolver";
import { resolveFooter } from "../../utils/footerResolver";
import { SECTION_RENDER_MAP } from "./TemplateSections";

const ClassicTemplate = ({ data, colors, accentColor, spacing, header, photo, links, footer }) => {
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
  const isImageUrl = typeof image === "string" && image.trim().length > 0;
  const isImageFile = typeof File !== "undefined" && image instanceof File;
  const imageSrc = isImageFile ? URL.createObjectURL(image) : image;
  const showPhoto = ph.visibility === "visible" && imageSrc;

  const photoStyles = {
    width: ph.size === "small" ? "64px" : ph.size === "large" ? "128px" : "96px",
    height: ph.size === "small" ? "64px" : ph.size === "large" ? "128px" : "96px",
    objectFit: ph.fit,
    borderRadius: ph.shape === "circle" ? "9999px" : ph.shape === "rounded" ? "12px" : "0px",
    flexShrink: 0
  };

  const flexReverseClass = ph.position === "right" ? "flex-row-reverse" : "flex-row";

  const alignmentClass = hdr.alignment === "center" ? "text-center" : hdr.alignment === "right" ? "text-right" : "text-left";
  const flexAlignmentClass = hdr.alignment === "center" ? "justify-center" : hdr.alignment === "right" ? "justify-end" : "justify-start";

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    const date = new Date(year, month - 1);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <div
      className={`max-w-4xl mx-auto leading-relaxed ${sp.densityClass}`}
      style={{ backgroundColor: col.background, color: col.text }}
    >
      {/* Header */}
      <header
        className={`pb-6 border-b-2 ${sp.sectionSpacingClass}`}
        style={{ borderColor: col.border }}
      >
        <div className={`flex gap-6 items-center ${hdr.alignment === "center" ? "justify-center" : hdr.alignment === "right" ? "justify-end" : "justify-start"} ${flexReverseClass}`}>
          {showPhoto && (
            <img src={imageSrc} style={photoStyles} alt="Profile" />
          )}
          <div className={`${hdr.alignment === "center" ? "text-center" : hdr.alignment === "right" ? "text-right" : "text-left"}`}>
            <h1 className="text-3xl font-bold mb-2" style={{ color: col.heading }}>
              {data.personal_info?.full_name || "Your Name"}
            </h1>

            <div className={`flex flex-wrap ${flexAlignmentClass} gap-4 text-sm`} style={{ color: col.muted }}>
              {data.personal_info?.email && (
                <a href={`mailto:${data.personal_info.email}`} target={linkTarget} rel={linkRel} className={`flex items-center gap-1 ${linkClass}`} style={{ color: linkColor }}>
                  <Mail className="size-4" style={{ color: col.accent }} />
                  <span>{data.personal_info.email}</span>
                </a>
              )}

              {data.personal_info?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="size-4" style={{ color: col.accent }} />
                  <span>{data.personal_info.phone}</span>
                </div>
              )}

              {data.personal_info?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-4" style={{ color: col.accent }} />
                  <span>{data.personal_info.location}</span>
                </div>
              )}

              {data.personal_info?.linkedin && (
                <a href={data.personal_info.linkedin.startsWith("http") ? data.personal_info.linkedin : `https://${data.personal_info.linkedin}`} target={linkTarget} rel={linkRel} className={`flex items-center gap-1 ${linkClass}`} style={{ color: linkColor }}>
                  <LinkedInIcon className="size-4" />
                  <span className="break-all">{data.personal_info.linkedin}</span>
                </a>
              )}

              {data.personal_info?.website && (
                <a href={data.personal_info.website.startsWith("http") ? data.personal_info.website : `https://${data.personal_info.website}`} target={linkTarget} rel={linkRel} className={`flex items-center gap-1 ${linkClass}`} style={{ color: linkColor }}>
                  <Globe className="size-4" />
                  <span className="break-all">{data.personal_info.website}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Professional Summary */}
      {data.professional_summary && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-xl font-semibold mb-3"
            style={{ color: col.heading }}
          >
            PROFESSIONAL SUMMARY
          </h2>
          <p className="leading-relaxed" style={{ color: col.text }}>
            {data.professional_summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: col.heading }}
          >
            PROFESSIONAL EXPERIENCE
          </h2>

          <div className={sp.entrySpacingClass}>
            {data.experience.map((exp, index) => (
              <div
                key={index}
                className="border-l-3 pl-4"
                style={{ borderColor: col.accent }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold" style={{ color: col.text }}>
                      {exp.position}
                    </h3>
                    <p className="font-medium" style={{ color: col.accent }}>{exp.company}</p>
                  </div>

                  <div className="text-right text-sm" style={{ color: col.muted }}>
                    <p>
                      {formatDate(exp.start_date)} -{" "}
                      {exp.is_current ? "Present" : formatDate(exp.end_date)}
                    </p>
                  </div>
                </div>

                {exp.description && (
                  <div className="leading-relaxed whitespace-pre-line" style={{ color: col.text }}>
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.project && data.project.length > 0 && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: col.heading }}
          >
            PROJECTS
          </h2>

          <div className={sp.entrySpacingClass}>
            {data.project.map((proj, index) => (
              <div
                key={index}
                className="flex justify-between items-start border-l-3 pl-6"
                style={{ borderColor: col.border }}
              >
                <div>
                  <h3 className="font-semibold" style={{ color: col.text }}>{proj.name}</h3>
                  {proj.type && (
                    <p className="text-sm" style={{ color: col.accent }}>
                      {proj.type}
                    </p>
                  )}
                  <p style={{ color: col.muted }}>{proj.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: col.heading }}
          >
            EDUCATION
          </h2>

          <div className={sp.entrySpacingClass}>
            {data.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold" style={{ color: col.text }}>
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </h3>

                  <p style={{ color: col.accent }}>{edu.institution}</p>

                  {edu.gpa && (
                    <p className="text-sm" style={{ color: col.muted }}>GPA: {edu.gpa}</p>
                  )}
                </div>

                <div className="text-sm" style={{ color: col.muted }}>
                  <p>{formatDate(edu.graduation_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: col.heading }}
          >
            CORE SKILLS
          </h2>

          <div className="flex gap-4 flex-wrap">
            {data.skills.map((skill, index) => (
              <div key={index} style={{ color: col.text }}>
                • {skill}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      {ftr.visibility === "visible" && (
        <footer
          className="mt-8 pt-4 border-t text-xs"
          style={{
            borderColor: col.border,
            color: col.muted,
            textAlign: ftr.alignment,
          }}
        >
          Generated with CuratoCV
        </footer>
      )}
    </div>
  );
};

export default ClassicTemplate;
