import { resolveSpacing } from "../../utils/layoutSpacing";
import { resolveColors } from "../../utils/colorResolver";
import { resolveHeader } from "../../utils/headerResolver";
import { resolvePhoto } from "../../utils/photoResolver";
import { resolveLinks } from "../../utils/linksResolver";
import { resolveFooter } from "../../utils/footerResolver";
import { resolveSectionCustomization, resolveEntryCustomization } from "../../utils/sectionCustomization";

const MinimalTemplate = ({ data, colors, accentColor, spacing, header, photo, links, footer }) => {
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
    return new Date(year, month - 1).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <div
      className={`max-w-4xl mx-auto font-light ${sp.densityClass}`}
      style={{ backgroundColor: col.background, color: col.text }}
    >
      {/* Header */}
      <header className={`mb-10`} style={{ borderColor: col.border }}>
        <div className={`flex gap-6 items-center ${hdr.alignment === "center" ? "justify-center" : hdr.alignment === "right" ? "justify-end" : "justify-start"} ${flexReverseClass}`}>
          {showPhoto && (
            <img src={imageSrc} style={photoStyles} alt="Profile" />
          )}
          <div className={`${hdr.alignment === "center" ? "text-center" : hdr.alignment === "right" ? "text-right" : "text-left"}`}>
            <h1 className="text-4xl font-thin mb-4 tracking-wide" style={{ color: col.heading }}>
              {data.personal_info?.full_name || "Your Name"}
            </h1>

            <div className={`flex flex-wrap ${flexAlignmentClass} gap-6 text-sm`} style={{ color: col.muted }}>
              {data.personal_info?.email && (
                <a href={`mailto:${data.personal_info.email}`} target={linkTarget} rel={linkRel} className={linkClass} style={{ color: linkColor }}>
                  {data.personal_info.email}
                </a>
              )}
              {data.personal_info?.phone && <span>{data.personal_info.phone}</span>}
              {data.personal_info?.location && (
                <span>{data.personal_info.location}</span>
              )}
              {data.personal_info?.linkedin && (
                <a href={data.personal_info.linkedin.startsWith("http") ? data.personal_info.linkedin : `https://${data.personal_info.linkedin}`} target={linkTarget} rel={linkRel} className={`break-all ${linkClass}`} style={{ color: linkColor }}>
                  {data.personal_info.linkedin}
                </a>
              )}
              {data.personal_info?.website && (
                <a href={data.personal_info.website.startsWith("http") ? data.personal_info.website : `https://${data.personal_info.website}`} target={linkTarget} rel={linkRel} className={`break-all ${linkClass}`} style={{ color: linkColor }}>
                  {data.personal_info.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Professional Summary */}
      {data.professional_summary && (
        <section className={sp.sectionSpacingClass}>
          <p style={{ color: col.text }}>{data.professional_summary}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-sm uppercase tracking-widest mb-6 font-medium"
            style={{ color: col.heading }}
          >
            Experience
          </h2>

          <div className={sp.entrySpacingClass}>
            {data.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-lg font-medium" style={{ color: col.heading }}>{exp.position}</h3>

                  <span className="text-sm" style={{ color: col.muted }}>
                    {formatDate(exp.start_date)} -{" "}
                    {exp.is_current ? "Present" : formatDate(exp.end_date)}
                  </span>
                </div>

                <p className="mb-2" style={{ color: col.accent }}>{exp.company}</p>

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

      {/* project */}
      {data.project && data.project.length > 0 && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-sm uppercase tracking-widest mb-6 font-medium"
            style={{ color: col.heading }}
          >
            project
          </h2>

          <div className={sp.entrySpacingClass}>
            {data.project.map((proj, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 justify-between items-baseline"
              >
                <h3 className="text-lg font-medium" style={{ color: col.heading }}>{proj.name}</h3>

                {proj.type && (
                  <p className="text-sm" style={{ color: col.accent }}>
                    {proj.type}
                  </p>
                )}

                <p style={{ color: col.muted }}>{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-sm uppercase tracking-widest mb-6 font-medium"
            style={{ color: col.heading }}
          >
            Education
          </h2>

          <div className={sp.entrySpacingClass}>
            {data.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-medium" style={{ color: col.heading }}>
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </h3>

                  <p style={{ color: col.accent }}>{edu.institution}</p>

                  {edu.gpa && (
                    <p className="text-sm" style={{ color: col.muted }}>GPA: {edu.gpa}</p>
                  )}
                </div>

                <span className="text-sm" style={{ color: col.muted }}>
                  {formatDate(edu.graduation_date)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className={sp.sectionSpacingClass}>
          <h2
            className="text-sm uppercase tracking-widest mb-6 font-medium"
            style={{ color: col.heading }}
          >
            Skills
          </h2>

          <div style={{ color: col.text }}>{data.skills.join(" • ")}</div>
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

export default MinimalTemplate;
