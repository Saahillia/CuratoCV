/**
 * Developer context for resumebuilder/frontend/src/components/templates/ClassicTemplate.jsx.
 * Purpose: provide the Classic Template resume layout/template implementation.
 * Why here: visual template decisions belong to Resume Builder, separate from canonical content and Platform shell concerns.
 */
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
import { formatResumeDate } from "../../utils/dateFormatting";
import { createElement } from "react";

const ClassicTemplate = ({ data, colors, accentColor, spacing, header, photo, links, footer, document }) => {
  // Resolve stored design options into safe values used consistently by all sections below.
  const sp = resolveSpacing(spacing);
  const col = resolveColors(colors || { accent: accentColor });
  const hdr = resolveHeader(header);
  const ph = resolvePhoto(photo);
  const lnks = resolveLinks(links);
  const ftr = resolveFooter(footer);
  const sectionOrder = (type, fallback) => {
    const index = (data.sections || []).findIndex((section) => section.type?.toLowerCase() === type);
    const storedOrder = index >= 0 ? data.sections[index].order : fallback;
    return (Number.isFinite(Number(storedOrder)) ? Number(storedOrder) : fallback) + 1;
  };

  // Apply the configured navigation target and protect the current page when opening external links.
  const linkTarget = lnks.target === "same-tab" ? "_self" : "_blank";
  const linkRel = lnks.target === "same-tab" ? undefined : "noopener noreferrer";
  const linkClass = lnks.style === "underline" ? "underline" : "hover:underline";
  const linkColor = lnks.style === "accent" ? col.accent : col.muted;

  // The image can be a persisted URL or an unsaved File object from the current editing session.
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

  // Convert the stored year-month value to a short display string; malformed dates render blank.
  const formatDate = (dateStr) => formatResumeDate(dateStr, document?.dateFormat);
  const renderedSections = (data.sections || [])
    .filter((section) => section.visible !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((section, index) => {
      const type = ({ professional_summary: "summary", experiences: "experience", educations: "education", project: "projects" })[section.type?.toLowerCase()] || section.type?.toLowerCase();
      const renderSection = SECTION_RENDER_MAP[type];
      if (!renderSection) return null;
      return createElement(renderSection, {
        key: section._id || `${type}-${index}`,
        data,
        colors: col,
        typography: data.design?.typography || {},
        spacing,
        section: type === "custom" ? section : undefined,
      });
    });

  return (
    <div
      className={`max-w-4xl mx-auto leading-relaxed ${sp.densityClass}`}
      style={{ backgroundColor: col.background, color: col.text, display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <header
        className={`pb-6 border-b-2 ${sp.sectionSpacingClass}`}
        style={{ borderColor: col.border, order: 0 }}
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

      {renderedSections}

      {/* Footer */}
      {ftr.visibility === "visible" && (
        <footer
          className="mt-8 pt-4 border-t text-xs"
          style={{
            borderColor: col.border,
            color: col.muted,
            textAlign: ftr.alignment,
            order: 1000,
          }}
        >
          Generated with CuratoCV
        </footer>
      )}
    </div>
  );
};

export default ClassicTemplate;
