export const TEMPLATES = [
    {
        id: "classic",
        name: "Classic",
        category: "traditional",
        tags: ["clean", "traditional", "professional"],
        description:
            "A clean, traditional resume layout with clean sections and professional typography.",
    },
    {
        id: "modern",
        name: "Modern",
        category: "contemporary",
        tags: ["sleek", "colorful", "modern", "visual"],
        description:
            "Sleek design and strategic use of color and modern font choices to create a visually appealing and contemporary resume.",
    },
    {
        id: "minimal",
        name: "Minimal",
        category: "minimalist",
        tags: ["ultra-clean", "simple", "content-first"],
        description:
            "Ultra-clean design that puts your content front and center.",
    },
    {
        id: "minimal-image",
        name: "Minimal Image",
        category: "minimalist",
        tags: ["image", "minimalist", "clean"],
        description:
            "A minimalist design with a single image and clean typography.",
    },
];

export const DEFAULT_TEMPLATE_ID = "classic";

export const getTemplateById = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

export const getTemplateIds = () => TEMPLATES.map((t) => t.id);

export const isValidTemplateId = (id) => getTemplateIds().includes(id);
