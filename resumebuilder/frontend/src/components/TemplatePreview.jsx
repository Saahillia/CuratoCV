import React, { useRef, useState, useEffect } from "react";
import { normalizePreviewData } from "./ResumePreview";
import TemplateRenderer from "./TemplateRenderer";

/**
 * TemplatePreview — renders a live template inside a scaled A4 canvas.
 *
 * Scaling approach:
 *   1. Inner page is rendered at standard A4 pixel dimensions (794px × 1123px at 96 DPI).
 *   2. Container measures available width and scales uniformly with CSS transform: scale(scale).
 *   3. Accepts an optional maxHeight to keep selection preview cards compact.
 *   4. pointer-events: none prevents any interaction inside the miniature.
 */
const TemplatePreview = ({ data, templateId, viewportWidth, maxHeight = 140 }) => {
    const previewData = normalizePreviewData(data);
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(viewportWidth || 240);

    // Canonical A4 dimensions at 96 DPI (210mm × 297mm)
    const A4_WIDTH_PX = 794;
    const A4_HEIGHT_PX = 1123;

    useEffect(() => {
        if (viewportWidth) {
            setContainerWidth(viewportWidth);
            return;
        }

        const el = containerRef.current;
        if (!el) return;

        const updateWidth = () => {
            if (el.clientWidth > 0) {
                setContainerWidth(el.clientWidth);
            }
        };

        updateWidth();

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0) {
                    setContainerWidth(entry.contentRect.width);
                }
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, [viewportWidth]);

    const scale = containerWidth / A4_WIDTH_PX;
    const computedFullHeight = Math.round(A4_HEIGHT_PX * scale);
    const containerHeight = maxHeight ? Math.min(computedFullHeight, maxHeight) : computedFullHeight;

    return (
        <div
            ref={containerRef}
            className="template-preview-container w-full overflow-hidden relative bg-white rounded-lg shadow-xs border border-slate-200"
            style={{
                height: `${containerHeight}px`,
            }}
        >
            <div
                className="template-preview-page origin-top-left"
                style={{
                    width: `${A4_WIDTH_PX}px`,
                    minHeight: `${A4_HEIGHT_PX}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    pointerEvents: "none",
                    background: "white",
                }}
            >
                <TemplateRenderer
                    templateId={templateId}
                    data={previewData}
                />
            </div>
            {/* Soft bottom fade to indicate preview continuation */}
            {maxHeight && computedFullHeight > maxHeight && (
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
            )}
        </div>
    );
};

export default TemplatePreview;
