/** Deterministic, versioned scoring for the Resume Builder job-tailoring flow. */
export const RUBRIC_VERSION = "jd-match-v1";

const MATCH_VALUES = Object.freeze({
    exact: 1,
    alias: 0.9,
    contextual: 0.75,
    related: 0.25,
    missing: 0,
    unclear: 0,
});

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateJDMatch(requirements = [], resumeText = "") {
    const categories = {
        required: { weight: 25, items: [] },
        skills: { weight: 20, items: [] },
        experience: { weight: 20, items: [] },
        role: { weight: 10, items: [] },
        achievements: { weight: 10, items: [] },
        education: { weight: 10, items: [] },
        keywords: { weight: 5, items: [] },
    };

    const criticalGaps = [];
    const uniqueRequirements = new Map();
    for (const item of requirements) {
        const key = `${String(item.category || "skills").toLowerCase()}:${String(item.priority || "preferred").toLowerCase()}:${String(item.label || "").trim().toLowerCase().replace(/\s+/g, " ")}`;
        if (key.endsWith(":")) continue;
        if (!uniqueRequirements.has(key)) uniqueRequirements.set(key, item);
    }
    for (const item of uniqueRequirements.values()) {
        const category = categories[item.category] || categories.skills;
        const classification = Object.hasOwn(MATCH_VALUES, item.match) ? item.match : "unclear";
        const requiredMultiplier = item.priority === "required" ? 1 : 0.5;
        const evidenceMultiplier = item.evidence && item.sectionId ? 1 : 0;
        const score = MATCH_VALUES[classification] * requiredMultiplier * evidenceMultiplier;
        category.items.push({ ...item, match: classification, score: Math.round(score * 100) });
        if (item.priority === "required" && ["related", "missing", "unclear"].includes(classification)) criticalGaps.push(item.label);
    }

    const weighted = Object.values(categories).reduce((sum, category) => {
        if (!category.items.length) return sum;
        const average = category.items.reduce((acc, item) => acc + item.score / 100, 0) / category.items.length;
        return sum + average * category.weight;
    }, 0);
    const activeWeight = Object.values(categories).reduce((sum, category) => sum + (category.items.length ? category.weight : 0), 0);
    const score = activeWeight ? clampPercent((weighted / activeWeight) * 100) : 0;
    const breakdown = Object.entries(categories).filter(([, category]) => category.items.length).map(([name, category]) => ({
        category: name,
        weight: category.weight,
        effectiveWeight: activeWeight ? Math.round((category.weight / activeWeight) * 100) : 0,
        score: clampPercent(category.items.reduce((sum, item) => sum + item.score, 0) / category.items.length),
    }));
    const normalizedResume = String(resumeText).toLowerCase();
    const keywordRepetition = [...new Set([...uniqueRequirements.values()]
        .filter((item) => ["skills", "keywords"].includes(item.category))
        .map((item) => String(item.label || "").trim().toLowerCase())
        .filter((label) => label.length >= 3 && normalizedResume.split(label).length - 1 >= 5))];
    return { score, rubricVersion: RUBRIC_VERSION, categories, breakdown, criticalGaps, keywordRepetition };
}

export function calculateATSReadiness(resume) {
    const sections = Array.isArray(resume?.sections) ? resume.sections : [];
    const visibleSections = sections.filter((section) => section.visible !== false);
    const findings = [];
    const template = String(resume?.design?.template || "classic");
    let score = 100;
    if (!visibleSections.length) { score -= 35; findings.push("No visible resume sections were found."); }
    const experienceSection = visibleSections.find((section) => ["experience", "experiences"].includes(String(section.type).toLowerCase()));
    if (!experienceSection) {
        score -= 15; findings.push("A clearly labelled experience section was not found.");
    } else if (!(experienceSection.entries || []).some((entry) => entry.visible !== false && entry.data && Object.values(entry.data).some((value) => typeof value === "string" && value.trim()))) {
        score -= 10; findings.push("The experience section has no visible text content.");
    }
    const skillsSection = visibleSections.find((section) => String(section.type).toLowerCase() === "skills");
    if (!skillsSection) {
        score -= 10; findings.push("A clearly labelled skills section was not found.");
    } else if (!(skillsSection.entries || []).some((entry) => entry.visible !== false && entry.data && Object.values(entry.data).some((value) => typeof value === "string" && value.trim()))) {
        score -= 5; findings.push("The skills section has no visible text content.");
    }
    if (template === "modern") { score -= 8; findings.push("Modern uses a two-column content grid at wider viewport widths; check the exported PDF text order for the target application."); }
    if (template === "minimal-image") { score -= 15; findings.push("Minimal Image uses a three-column grid; check the exported PDF text order and consider a single-column template for simpler reading order."); }
    findings.push("This score checks resume section structure only. It does not simulate a specific employer's ATS parser.");
    const templateRecommendation = ["classic", "minimal"].includes(template)
        ? { template, changeRecommended: false, reason: "The current template uses a vertically ordered section layout in its renderer, which is the simpler layout profile in this template set." }
        : { template: "classic", changeRecommended: true, reason: template === "modern" ? "Classic renders resume sections in a single vertical sequence; the current Modern template switches to a two-column grid on wider screens." : "Classic renders resume sections in a single vertical sequence; the current Minimal Image renderer uses a three-column grid." };
    return { score: clampPercent(score), findings, templateRecommendation, checks: { visibleSections: visibleSections.length, template, layoutProfile: template === "minimal-image" ? "three-column" : template === "modern" ? "two-column" : "single-column" } };
}
