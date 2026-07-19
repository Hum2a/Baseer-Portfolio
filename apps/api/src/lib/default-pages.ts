import type { BlockType, PageKey } from "@baseer-portfolio/shared";

export type DefaultBlockSeed = {
  type: BlockType;
  config: Record<string, unknown>;
  enabled?: boolean;
};

export const DEFAULT_PAGE_BLOCKS: Record<PageKey, DefaultBlockSeed[]> = {
  home: [
    {
      type: "hero",
      config: {
        showBrand: true,
        headlineSource: "settings",
        subheadSource: "settings",
        ctas: [
          { label: "View work", href: "/automotive", variant: "primary" },
          { label: "About", href: "/about", variant: "ghost" },
        ],
      },
    },
    {
      type: "spec_strip",
      config: { source: "career", metrics: [] },
    },
    {
      type: "sector_grid",
      config: {
        title: "Sectors",
        sectorSlugs: ["automotive", "charity", "education"],
        blurbOverrides: {
          automotive: "Launches, retail theatre, and product storytelling.",
          charity: "Cause campaigns with measurable public response.",
          education: "Enrolment, reputation, and student-facing narratives.",
        },
      },
    },
    {
      type: "testimonial",
      config: { mode: "first", testimonialIds: [], limit: 1 },
    },
  ],
  about: [
    {
      type: "hero",
      config: {
        showBrand: false,
        headlineSource: "custom",
        headline: "About",
        subheadSource: "custom",
        subhead: "Career path, capabilities, and a downloadable CV.",
        ctas: [],
      },
    },
    {
      type: "rich_text",
      config: { source: "about_bio", markdown: "", title: "" },
    },
    {
      type: "cv_button",
      config: { label: "Download CV" },
    },
    {
      type: "timeline",
      config: { title: "Timeline" },
    },
    {
      type: "skills",
      config: { title: "Skills" },
    },
  ],
  contact: [
    {
      type: "hero",
      config: {
        showBrand: false,
        headlineSource: "custom",
        headline: "Contact",
        subheadSource: "custom",
        subhead:
          "For briefs, collaborations, or a conversation about the next campaign.",
        ctas: [],
      },
    },
    {
      type: "contact_card",
      config: {
        showEmail: true,
        showSocials: true,
        intro: "",
      },
    },
  ],
  work: [
    {
      type: "featured_work",
      config: { title: "Selected work", caseStudyIds: [], limit: 6 },
    },
  ],
  "sector:automotive": [
    {
      type: "hero",
      config: {
        showBrand: false,
        headlineSource: "custom",
        headline: "Automotive",
        subheadSource: "custom",
        subhead: "Launches, retail theatre, and product storytelling.",
        ctas: [],
      },
    },
    {
      type: "featured_work",
      config: { title: "Case studies", caseStudyIds: [], limit: 12 },
    },
  ],
  "sector:charity": [
    {
      type: "hero",
      config: {
        showBrand: false,
        headlineSource: "custom",
        headline: "Charity",
        subheadSource: "custom",
        subhead: "Cause campaigns with measurable public response.",
        ctas: [],
      },
    },
    {
      type: "featured_work",
      config: { title: "Case studies", caseStudyIds: [], limit: 12 },
    },
  ],
  "sector:education": [
    {
      type: "hero",
      config: {
        showBrand: false,
        headlineSource: "custom",
        headline: "Education",
        subheadSource: "custom",
        subhead: "Enrolment, reputation, and student-facing narratives.",
        ctas: [],
      },
    },
    {
      type: "featured_work",
      config: { title: "Case studies", caseStudyIds: [], limit: 12 },
    },
  ],
};

export const PAGE_TITLES: Record<PageKey, string> = {
  home: "Home",
  about: "About",
  contact: "Contact",
  work: "Work",
  "sector:automotive": "Automotive",
  "sector:charity": "Charity",
  "sector:education": "Education",
};
