import React, { useState } from "react";
import CustomizeSidebar, { CUSTOMIZE_NAV_ITEMS } from "./CustomizeSidebar";
import CustomizeContent from "./CustomizeContent";

const CustomizeLayout = ({ resumeData, onChange }) => {
    const [activePanel, setActivePanel] = useState("document");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[160px_minmax(0,1fr)] h-full min-h-0 w-full">
            {/* Left Navigation Sidebar */}
            <CustomizeSidebar
                activePanel={activePanel}
                onSelectPanel={setActivePanel}
            />

            {/* Right Content Area */}
            <CustomizeContent
                activePanel={activePanel}
                resumeData={resumeData}
                onChange={onChange}
            />
        </div>
    );
};

export default CustomizeLayout;
