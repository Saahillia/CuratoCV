import ExperienceForm from "../components/Forms/ExperienceForm";
import EducationForm from "../components/Forms/EducationForm";
import ProjectForm from "../components/Forms/ProjectForm";
import SkillsForm from "../components/Forms/SkillsForm";
import CustomSectionEditor from "../components/ContentEditor/CustomSectionEditor";

export const resumeSectionRegistry = {
  summary: { label: "Professional Summary", entryBased: false },
  professional_summary: { label: "Professional Summary", entryBased: false },
  declaration: { label: "Declaration", entryBased: false },
  experience: {
    label: "Experience",
    entryBased: true,
    editor: ExperienceForm,
    defaultEntry: { company: "", position: "", startDate: "", endDate: "", isCurrent: false, description: "" },
  },
  experiences: {
    label: "Experience",
    entryBased: true,
    editor: ExperienceForm,
    defaultEntry: { company: "", position: "", startDate: "", endDate: "", isCurrent: false, description: "" },
  },
  education: {
    label: "Education",
    entryBased: true,
    editor: EducationForm,
    defaultEntry: { institution: "", degree: "", field: "", graduationDate: "", isCurrent: false },
  },
  educations: {
    label: "Education",
    entryBased: true,
    editor: EducationForm,
    defaultEntry: { institution: "", degree: "", field: "", graduationDate: "", isCurrent: false },
  },
  skills: {
    label: "Skills",
    entryBased: true,
    component: SkillsForm,
    defaultEntry: { category: "", skills: [] },
  },
  projects: {
    label: "Projects",
    entryBased: true,
    editor: ProjectForm,
    defaultEntry: { name: "", url: "", technologies: "", description: "" },
  },
  project: {
    label: "Projects",
    entryBased: true,
    editor: ProjectForm,
    defaultEntry: { name: "", url: "", technologies: "", description: "" },
  },
  certificates: {
    label: "Certificates",
    entryBased: true,
    defaultEntry: { name: "" },
  },
  courses: {
    label: "Courses",
    entryBased: true,
    defaultEntry: { name: "", field: "", date: "" },
  },
  awards: {
    label: "Awards",
    entryBased: true,
    defaultEntry: { name: "", year: "" },
  },
  languages: {
    label: "Languages",
    entryBased: true,
    defaultEntry: { language: "", proficiency: "" },
  },
  interests: {
    label: "Interests",
    entryBased: true,
    defaultEntry: { name: "" },
  },
  organisations: {
    label: "Organisations",
    entryBased: true,
    defaultEntry: { name: "", role: "" },
  },
  publications: {
    label: "Publications",
    entryBased: true,
    defaultEntry: { title: "", publisher: "" },
  },
  references: {
    label: "References",
    entryBased: true,
    defaultEntry: { name: "", company: "" },
  },
  custom: {
    label: "Custom Section",
    entryBased: true,
    component: CustomSectionEditor,
  },
};
