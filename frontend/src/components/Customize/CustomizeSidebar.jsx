import React from "react";
import {
    FileText,
    LayoutTemplate,
    PanelsTopLeft,
    Type,
    Maximize2,
    ListTree,
    Heading,
    Baseline,
    Palette,
    LayoutDashboard,
    Image,
    Link2,
    Footprints,
    Layers,
} from "lucide-react";

export const CUSTOMIZE_NAV_ITEMS = [
    { id: "document", label: "Document", icon: FileText },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
    { id: "layout", label: "Layout", icon: PanelsTopLeft },
    { id: "fontsize", label: "Font Size", icon: Type },
    { id: "spacing", label: "Spacing", icon: Maximize2 },
    { id: "entries", label: "Entries", icon: ListTree },
    { id: "headings", label: "Headings", icon: Heading },
    { id: "font", label: "Font", icon: Baseline },
    { id: "colors", label: "Colors", icon: Palette },
    { id: "header", label: "Header", icon: LayoutDashboard },
    { id: "photo", label: "Photo", icon: Image },
    { id: "links", label: "Links", icon: Link2 },
    { id: "footer", label: "Footer", icon: Footprints },
    { id: "sections", label: "Sections", icon: Layers },
];

const CustomizeSidebar = ({ activePanel, onSelectPanel }) => {
    return (
        <aside className="w-full lg:w-[160px] flex-shrink-0 flex flex-col bg-transparent border-0 shadow-none">
            <div className="p-4 lg:px-4 lg:py-6 border-b border-slate-200">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Design & Customization
                </h3>
            </div>
            <nav className="flex-none lg:flex-1 overflow-x-auto lg:overflow-y-auto lg:px-2 lg:py-2 flex lg:flex-col flex-row gap-px custom-scrollbar" aria-label="Customize panels">
                {CUSTOMIZE_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePanel === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectPanel(item.id)}
                            aria-current={isActive ? "page" : undefined}
                            className={`group flex flex-row lg:flex-row items-center gap-2.5 w-max lg:w-full px-3.5 py-2 lg:py-1.5 text-left rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent ${
                                isActive
                                    ? "text-blue-700 font-semibold bg-blue-50/50"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                            style={{
                                fontSize: "13px",
                                fontWeight: isActive ? 600 : 500,
                            }}
                        >
                            <span
                                className={`hidden lg:block flex-shrink-0 w-0.5 h-4 rounded-full transition-opacity ${
                                    isActive ? "opacity-100 bg-blue-600" : "opacity-0"
                                }`}
                                aria-hidden="true"
                            />
                            <Icon
                                className={`size-3.5 flex-shrink-0 transition-colors ${
                                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"
                                }`}
                                aria-hidden="true"
                            />
                            <span className="truncate">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

export default CustomizeSidebar;