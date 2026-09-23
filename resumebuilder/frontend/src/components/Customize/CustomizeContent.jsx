import React, { useEffect, useRef } from "react";
import DocumentSettings from "./DocumentSettings";
import LayoutSettings from "./LayoutSettings";
import TypographySettings from "./TypographySettings";
import SpacingSettings from "./SpacingSettings";
import ColorSettings from "./ColorSettings";
import HeaderSettings from "./HeaderSettings";
import PhotoSettings from "./PhotoSettings";
import LinkSettings from "./LinkSettings";
import FooterSettings from "./FooterSettings";
import SectionCustomizationPanel from "./SectionCustomizationPanel";
import TemplateGallery from "./TemplateGallery";

const SECTION_KEY_MAP = {
    document: "document",
    templates: "templates",
    layout: "layout",
    fontsize: "typography",
    font: "typography",
    headings: "typography",
    spacing: "spacing",
    colors: "colors",
    header: "header",
    photo: "photo",
    links: "links",
    footer: "footer",
    sections: "sections",
    entries: "sections",
};

const CustomizeContent = ({ activePanel, resumeData, onChange, onSelectPanel }) => {
    const design = resumeData?.design || {};
    const containerRef = useRef(null);
    const sectionRefs = useRef({});
    const isProgrammaticScroll = useRef(false);
    const prevPanelRef = useRef(activePanel);

    const updateDesign = (updatedDesign) => {
        onChange({
            ...resumeData,
            design: updatedDesign,
        });
    };

    // Smoothly scroll to target section when activePanel changes from sidebar click
    useEffect(() => {
        if (!activePanel || activePanel === prevPanelRef.current) return;
        prevPanelRef.current = activePanel;

        const targetId = SECTION_KEY_MAP[activePanel] || activePanel;
        const targetEl = sectionRefs.current[targetId];

        if (targetEl) {
            isProgrammaticScroll.current = true;
            const prefersReducedMotion =
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            targetEl.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "start",
            });

            const timer = setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 700);

            return () => clearTimeout(timer);
        }
    }, [activePanel]);

    // Active section detection using IntersectionObserver (no scroll event listeners)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (isProgrammaticScroll.current) return;

                const intersecting = entries.filter((e) => e.isIntersecting);
                if (intersecting.length === 0) return;

                // Pick the entry closest to the top of the scroll container
                const topMost = intersecting.reduce((prev, current) =>
                    prev.boundingClientRect.top < current.boundingClientRect.top ? prev : current
                );

                const sectionKeys = Object.keys(sectionRefs.current);
                const closestSection = sectionKeys.find(
                    (key) => sectionRefs.current[key] === topMost.target
                );

                if (closestSection && onSelectPanel && closestSection !== prevPanelRef.current) {
                    prevPanelRef.current = closestSection;
                    onSelectPanel(closestSection);
                }
            },
            {
                root: container,
                rootMargin: "-10% 0px -40% 0px",
                threshold: [0, 0.25, 0.5, 0.75, 1],
            }
        );

        Object.values(sectionRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [onSelectPanel]);

    return (
        <div
            ref={containerRef}
            className="flex-1 min-h-0 bg-slate-50/60 flex flex-col overflow-y-auto custom-scrollbar p-5 lg:p-8 scroll-smooth"
        >
            <div className="max-w-4xl w-full mx-auto space-y-8 pb-20">
                {/* 1. Document Settings */}
                <div
                    ref={(el) => (sectionRefs.current["document"] = el)}
                    id="section-document"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <DocumentSettings resumeData={resumeData} onChange={onChange} />
                </div>

                {/* 2. Template Selection */}
                <div
                    ref={(el) => (sectionRefs.current["templates"] = el)}
                    id="section-templates"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <TemplateGallery
                        selectedTemplate={design.template || "classic"}
                        onSelectTemplate={(templateId) =>
                            updateDesign({ ...design, template: templateId })
                        }
                        resumeData={resumeData}
                    />
                </div>

                {/* 3. Document Layout */}
                <div
                    ref={(el) => (sectionRefs.current["layout"] = el)}
                    id="section-layout"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <LayoutSettings resumeData={resumeData} onChange={onChange} />
                </div>

                {/* 4. Typography (Font, Size, Headings) */}
                <div
                    ref={(el) => (sectionRefs.current["typography"] = el)}
                    id="section-typography"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <TypographySettings customization={design} onChange={updateDesign} />
                </div>

                {/* 5. Spacing */}
                <div
                    ref={(el) => (sectionRefs.current["spacing"] = el)}
                    id="section-spacing"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <SpacingSettings customization={design} onChange={updateDesign} />
                </div>

                {/* 6. Color Palette */}
                <div
                    ref={(el) => (sectionRefs.current["colors"] = el)}
                    id="section-colors"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <ColorSettings customization={design} onChange={updateDesign} />
                </div>

                {/* 7. Header Settings */}
                <div
                    ref={(el) => (sectionRefs.current["header"] = el)}
                    id="section-header"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <HeaderSettings customization={design} onChange={updateDesign} />
                </div>

                {/* 8. Photo Settings */}
                <div
                    ref={(el) => (sectionRefs.current["photo"] = el)}
                    id="section-photo"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <PhotoSettings customization={design} onChange={updateDesign} />
                </div>

                {/* 9. Link Formatting */}
                <div
                    ref={(el) => (sectionRefs.current["links"] = el)}
                    id="section-links"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <LinkSettings customization={design} onChange={updateDesign} />
                </div>

                {/* 10. Footer Settings */}
                <div
                    ref={(el) => (sectionRefs.current["footer"] = el)}
                    id="section-footer"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <FooterSettings customization={design} onChange={updateDesign} />
                </div>

                {/* 11. Section & Entry Customization */}
                <div
                    ref={(el) => (sectionRefs.current["sections"] = el)}
                    id="section-sections"
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-6"
                >
                    <SectionCustomizationPanel resumeData={resumeData} onChange={onChange} />
                </div>
            </div>
        </div>
    );
};

export default CustomizeContent;