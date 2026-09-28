/**
 * Developer context for resumebuilder/frontend/src/components/ResumePreview.jsx.
 * Purpose: provide the Resume Builder Resume Preview interface component.
 * Why here: resume presentation and editing UI belong to the product package; the root shell owns routing and global providers.
 */
import ClassicTemplate from "./templates/ClassicTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import MinimalImageTemplate from "./templates/MinimalImageTemplate";
import { SECTION_RENDER_MAP } from "./templates/TemplateSections";
import { createElement, useLayoutEffect, useRef, useState } from "react";
import { FONT_FAMILY_MAP } from "../utils/typography";
import { resolveColors } from "../utils/colorResolver";
import { packResumePages, computePageBudgetPx } from "../utils/pagination";
import { A4_CSS } from "../constants/resumePage";
import ResumeDocument from "./ResumeDocument";
import ResumePage from "./ResumePage";

// normalizePreviewData lives in utils/previewNormalization.js so the Resume
// Preview and the backend PDF parity test consume one shared transformation.
import { normalizePreviewData } from "../utils/previewNormalization";

// Re-exported for existing importers (e.g. TemplatePreview.jsx).
export { normalizePreviewData };

const ResumePreview = ({ data, template, accentColor, classes = "" }) => {
    const measurementRef = useRef(null);
    const [pageMarkup, setPageMarkup] = useState([]);
    const previewData = normalizePreviewData(data);
    const design = previewData.design || {};
    const typography = design.typography || {};
    const typeScale = { small: 0.88, normal: 1, large: 1.12 }[typography.fontSizeScale] || 1;
    const headingScale = { small: 0.9, normal: 1, large: 1.15 }[typography.headingScale] || 1;
    const lineHeight = { tight: 1.3, normal: 1.5, relaxed: 1.7 }[typography.lineHeight] || 1.5;
    const selectedTemplate = template || design.template || "classic";
    const supplementalSections = selectedTemplate === "classic" ? [] : (previewData.sections || [])
        .filter((section) => ["certificates", "courses", "awards", "languages", "interests", "organisations", "publications", "references", "declaration", "custom"].includes(section.type?.toLowerCase()))
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .map((section, index) => {
            const Renderer = SECTION_RENDER_MAP[section.type?.toLowerCase()];
            return Renderer ? createElement(Renderer, {
                key: section._id || `supplemental-${section.type}-${index}`,
                data: previewData,
                // Templates resolve design colors before rendering; this
                // direct dispatch must resolve them the same way.
                colors: resolveColors(previewData.design?.colors || {}),
                typography,
                spacing: design.spacing || {},
            }) : null;
        });
    const spacing = design.spacing || {};
    const layout = design.layout || {};
    const pageMarginMm = Math.max(5, Math.min(20, Number(spacing.pageMarginMm) || 10));
    const sectionSpacingMm = Math.max(0, Math.min(15,
        (Number(spacing.sectionSpacingMm ?? 3)) +
        ({ tight: -1.5, normal: 0, spacious: 3 }[spacing.sectionSpacing] || 0)
    ));
    const lineHeightMultiplier = (Number(spacing.lineHeightMultiplier) || lineHeight) *
        ({ tight: 0.9, normal: 1, relaxed: 1.08 }[typography.lineHeight] || 1);

    useLayoutEffect(() => {
        const source = measurementRef.current?.querySelector("#resume-preview");
        if (!source) return;

        // Scale-independent measurement: the preview's visual zoom is an ancestor
        // `transform: scale(...)`, which never changes layout boxes. offsetHeight,
        // offsetTop, and computed styles are therefore measured in the same
        // unscaled coordinates as the A4 page shell itself, so zoom can never
        // change the page count.
        const px = (value) => {
            const parsed = Number.parseFloat(value);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        };
        const marginBottomOf = (el) => px(getComputedStyle(el).marginBottom);

        // The template root (density padding, e.g. p-8) sits inside every page
        // clone, so its vertical padding is charged against every page's budget.
        const root = source.firstElementChild;
        const rootPaddingPx = root
            ? px(getComputedStyle(root).paddingTop) + px(getComputedStyle(root).paddingBottom)
            : 0;
        const budgetPx = computePageBudgetPx({ pageMarginMm, rootPaddingPx });

        const headerEl = source.querySelector("header");
        const header = headerEl
            ? { heightPx: headerEl.offsetHeight, gapAfterPx: marginBottomOf(headerEl) }
            : null;

        // The footer renders only on the last page clone; its cost is the measured
        // gap from the preceding content (margins included) plus its own height.
        const footerEl = source.querySelector("footer");
        let footer = null;
        if (footerEl) {
            const prev = footerEl.previousElementSibling;
            const gapBeforePx = prev
                ? Math.max(0, footerEl.offsetTop - prev.offsetTop - prev.offsetHeight)
                : 0;
            footer = { heightPx: footerEl.offsetHeight, gapBeforePx };
        }

        const sections = Array.from(source.querySelectorAll("section")).map((sectionEl) => {
            // Same entry-container rule the clone pass below uses, so measurement
            // and page markup always agree on what counts as an entry.
            const children = Array.from(sectionEl.children);
            const containerIndex = children.findLastIndex((child) => child.children.length > 0);
            const entryContainer = containerIndex >= 0 ? sectionEl.children[containerIndex] : null;
            const entryEls = entryContainer ? Array.from(entryContainer.children) : [];

            let entries = null;
            if (entryEls.length) {
                const firstEntry = entryEls[0];
                const lastEntry = entryEls[entryEls.length - 1];
                // Entries are siblings, so offsetTop deltas are exact, scale-free
                // distances (they include the space-y gaps between entries).
                const containerSpan = lastEntry.offsetTop + lastEntry.offsetHeight - firstEntry.offsetTop;
                entries = {
                    headingHeightPx: Math.max(0, sectionEl.offsetHeight - containerSpan),
                    entries: entryEls.map((entryEl, index) => ({
                        heightPx: entryEl.offsetHeight,
                        gapAfterPx:
                            index < entryEls.length - 1
                                ? Math.max(
                                      0,
                                      entryEls[index + 1].offsetTop - entryEl.offsetTop - entryEl.offsetHeight
                                  )
                                : 0,
                    })),
                };
            }

            return {
                heightPx: sectionEl.offsetHeight,
                gapAfterPx: marginBottomOf(sectionEl),
                entries,
            };
        });

        const { pages } = packResumePages({ budgetPx, header, footer, sections });
        const markup = pages.map((page, pageIndex) => {
            const clone = source.cloneNode(true);
            const cloneSections = Array.from(clone.querySelectorAll("section"));
            const included = new Map(page.items.map(({ sectionIndex, entryIndexes }) => [sectionIndex, entryIndexes]));
            cloneSections.forEach((section, sectionIndex) => {
                if (!included.has(sectionIndex)) {
                    section.remove();
                    return;
                }
                const entryIndexes = included.get(sectionIndex);
                if (!entryIndexes) return;
                const containerIndex = Array.from(section.children).findLastIndex((child) => child.children.length > 0);
                const entryContainer = section.children[containerIndex];
                Array.from(entryContainer.children).forEach((entry, entryIndex) => {
                    if (!entryIndexes.includes(entryIndex)) entry.remove();
                });
            });
            if (pageIndex > 0) clone.querySelectorAll("header").forEach((node) => node.remove());
            if (pageIndex < pages.length - 1) clone.querySelectorAll("footer").forEach((node) => node.remove());
            return clone.outerHTML;
        });
        setPageMarkup(markup);
    }, [data, selectedTemplate, pageMarginMm, sectionSpacingMm, lineHeightMultiplier, typeScale, headingScale]);

    const renderTemplate = () => {
        const commonProps = {
            data: previewData,
            colors: previewData.design?.colors || {},
            typography: previewData.design?.typography || {},
            layout: previewData.design?.layout || {},
            spacing: previewData.design?.spacing || {},
            header: previewData.design?.header || {},
            footer: previewData.design?.footer || {},
            photo: {
                ...(previewData.design?.photo || {}),
                // This is the only registered template designed with a profile-photo slot.
                visibility: selectedTemplate === "minimal-image"
                    ? previewData.design?.photo?.visibility
                    : "hidden",
            },
            links: previewData.design?.links || {},
            document: previewData.document || {},
        };

        switch (selectedTemplate) {
            case "modern":
                return <ModernTemplate {...commonProps} />;
            case "classic":
                return <ClassicTemplate {...commonProps} />;
            case "minimal":
                return <MinimalTemplate {...commonProps} />;
            case "minimal-image":
                return <MinimalImageTemplate {...commonProps} />;
            default:
                return <ClassicTemplate {...commonProps} />;
        }
    };

    const previewStyle = {
        "--resume-font-family": FONT_FAMILY_MAP[typography.fontFamily] || FONT_FAMILY_MAP.system,
        "--resume-type-scale": typeScale,
        "--resume-heading-scale": headingScale,
        "--resume-body-size": `${typography.fontSizePt ?? 10.5}pt`,
        "--resume-name-size": `${typography.nameSizePt ?? 22}pt`,
        "--resume-section-size": `${typography.sectionHeadingSizePt ?? 13.5}pt`,
        "--resume-entry-size": `${typography.entryHeadingSizePt ?? 11.5}pt`,
        "--resume-line-height": lineHeightMultiplier,
        "--resume-section-space": `${sectionSpacingMm}mm`,
    };
    const previewAttributes = {
        id: "resume-preview",
        className: classes,
        "data-page-width": layout.pageWidth || "standard",
        "data-page-alignment": layout.pageAlignment || "center",
        "data-columns": layout.columns || "single",
        "data-template": selectedTemplate,
        "data-header-layout": design.header?.layout || "standard",
        style: previewStyle,
    };
    // One canonical A4 shell size (constants/resumePage.js) shared with the PDF side.
    const pageStyle = {
        width: A4_CSS.width,
        height: A4_CSS.height,
        minHeight: A4_CSS.minHeight,
        boxSizing: "border-box",
        padding: `${pageMarginMm}mm`,
        background: "white",
    };

    return (
        <div className="w-full mx-auto bg-white">
            <div className="resume-preview-measurement" ref={measurementRef} aria-hidden="true">
                <div className="resume-a4-page" style={pageStyle}>
                    <div {...previewAttributes}>
                        {renderTemplate()}
                        {supplementalSections}
                    </div>
                </div>
            </div>
            <ResumeDocument>
                {pageMarkup.map((markup, index) => (
                    <ResumePage
                        key={`resume-page-${index}`}
                        pageNumber={index + 1}
                        className="shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] mx-auto"
                        style={pageStyle}
                        html={markup}
                    />
                ))}
            </ResumeDocument>
            <style>{`
                @page { size: A4; margin: 0; }
                .resume-entry { break-inside: avoid; }
                .resume-section { break-inside: auto; }
                .resume-preview-measurement { position: absolute; left: -100000px; top: 0; visibility: hidden; pointer-events: none; }
                .resume-preview-pages { display: flex; flex-direction: column; align-items: center; gap: 8mm; }
                .resume-a4-page { flex: none; overflow: visible; }
                #resume-preview { font-family: var(--resume-font-family); font-size: calc(var(--resume-body-size) * var(--resume-type-scale)); line-height: var(--resume-line-height); }
                #resume-preview :is(h1, h2, h3, h4, p, span, a, li, div) { font-family: var(--resume-font-family); }
                #resume-preview h1[class] { font-size: calc(var(--resume-name-size) * var(--resume-heading-scale)) !important; }
                #resume-preview h2[class] { font-size: calc(var(--resume-section-size) * var(--resume-heading-scale)) !important; }
                #resume-preview h3[class] { font-size: var(--resume-entry-size) !important; }
                #resume-preview :is(p, li, span, a, div) { line-height: var(--resume-line-height); }
                #resume-preview section { margin-bottom: var(--resume-section-space) !important; }
                #resume-preview[data-header-layout="compact"] header { padding-top: 2mm !important; padding-bottom: 3mm !important; margin-bottom: 3mm !important; }
                #resume-preview[data-header-layout="split"] header > div { justify-content: space-between !important; }
                #resume-preview[data-columns="two"][data-template="classic"] > div { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 8mm; }
                #resume-preview[data-columns="two"][data-template="classic"] > div > header,
                #resume-preview[data-columns="two"][data-template="classic"] > div > footer { grid-column: 1 / -1; }
                #resume-preview > div { width: 100% !important; max-width: var(--resume-content-width, 100%) !important; margin-left: auto !important; margin-right: auto !important; }
                #resume-preview[data-page-width="compact"] { --resume-content-width: 650px; }
                #resume-preview[data-page-width="standard"] { --resume-content-width: 100%; }
                #resume-preview[data-page-width="wide"] { --resume-content-width: 100%; }
                #resume-preview[data-page-alignment="left"] > div { margin-left: 0 !important; margin-right: auto !important; }
                #resume-preview[data-page-alignment="right"] > div { margin-left: auto !important; margin-right: 0 !important; }
                @media print {
                    .resume-preview-measurement { display: none !important; }
                    .resume-preview-pages { display: block; }
                    .resume-a4-page { margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
                    .resume-a4-page:last-child { break-after: auto; page-break-after: auto; }
                }
            `}</style>
        </div>
    );
};

export default ResumePreview;
