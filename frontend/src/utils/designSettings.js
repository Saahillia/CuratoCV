// ============================================================
// Design Customization Utilities
// Canonical enum-to-CSS mapping and validation for Header/Footer/Photo/Links
// Matches backend Constants/resumeCustomization.js enums exactly
// ============================================================

// Header
export const HEADER_ALIGNMENT_MAP = { left: "text-left", center: "text-center", right: "text-right" };
export const HEADER_LAYOUT_MAP = { standard: "standard", compact: "compact", split: "split" };

// Footer
export const FOOTER_ALIGNMENT_MAP = { left: "text-left", center: "text-center", right: "text-right" };

// Photo
export const PHOTO_SHAPE_MAP = { square: "rounded-none", rounded: "rounded-lg", circle: "rounded-full" };
export const PHOTO_POSITION_MAP = { left: "justify-start", center: "justify-center", right: "justify-end" };
export const PHOTO_SIZE_MAP = { small: "w-16 h-16", medium: "w-24 h-24", large: "w-32 h-32" };
export const PHOTO_FIT_MAP = { cover: "object-cover", contain: "object-contain" };

// Links
export const LINK_STYLE_MAP = { plain: "text-current", underline: "underline", accent: "text-accent" };
export const LINK_TARGET_MAP = { "same-tab": "_self", "new-tab": "_blank" };

// Validation logic (assuming backend enums provided)
// Backend:
// header: alignment: ["left", "center", "right"], layout: ["standard", "compact", "split"]
// footer: visibility: ["hidden", "visible"], alignment: ["left", "center", "right"]
// photo: visibility: ["hidden", "visible"], shape: ["square", "rounded", "circle"], position: ["left", "center", "right"], size: ["small", "medium", "large"], fit: ["cover", "contain"]
// links: style: ["plain", "underline", "accent"], target: ["same-tab", "new-tab"]

export const resolveHeader = (header = {}) => ({
  alignment: ["left", "center", "right"].includes(header.alignment) ? header.alignment : "left",
  layout: ["standard", "compact", "split"].includes(header.layout) ? header.layout : "standard",
});

export const resolveFooter = (footer = {}) => ({
  visibility: ["hidden", "visible"].includes(footer.visibility) ? footer.visibility : "hidden",
  alignment: ["left", "center", "right"].includes(footer.alignment) ? footer.alignment : "center",
});

export const resolvePhoto = (photo = {}) => ({
  visibility: ["hidden", "visible"].includes(photo.visibility) ? photo.visibility : "hidden",
  shape: ["square", "rounded", "circle"].includes(photo.shape) ? photo.shape : "circle",
  position: ["left", "center", "right"].includes(photo.position) ? photo.position : "right",
  size: ["small", "medium", "large"].includes(photo.size) ? photo.size : "medium",
  fit: ["cover", "contain"].includes(photo.fit) ? photo.fit : "cover",
});

export const resolveLinks = (links = {}) => ({
  style: ["plain", "underline", "accent"].includes(links.style) ? links.style : "accent",
  target: ["same-tab", "new-tab"].includes(links.target) ? links.target : "new-tab",
});
