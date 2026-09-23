import ClassicTemplate from "./templates/ClassicTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import MinimalImageTemplate from "./templates/MinimalImageTemplate";

const TemplateRenderer = ({ templateId, data }) => {
    // Construct common props mimicking what templates expect
    const commonProps = {
        data,
        colors: data?.design?.colors || {},
        typography: data?.design?.typography || {},
        layout: data?.design?.layout || {},
        spacing: data?.design?.spacing || {},
        header: data?.design?.header || {},
        footer: data?.design?.footer || {},
        photo: data?.design?.photo || {},
        links: data?.design?.links || {},
    };

    switch (templateId) {
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

export default TemplateRenderer;
