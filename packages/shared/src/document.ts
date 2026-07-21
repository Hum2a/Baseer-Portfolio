import { z } from "zod";

export const breakpoints = ["mobile", "tablet", "desktop"] as const;
export type Breakpoint = (typeof breakpoints)[number];
export const breakpointSchema = z.enum(breakpoints);

export const documentKinds = [
  "page",
  "header",
  "footer",
  "template",
  "case_study_layout",
  "collection",
] as const;
export type DocumentKind = (typeof documentKinds)[number];
export const documentKindSchema = z.enum(documentKinds);

export const documentStatuses = ["draft", "published", "archived"] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const nodeTypes = [
  "frame",
  "stack",
  "grid",
  "text",
  "image",
  "video",
  "button",
  "icon",
  "shape",
  "embed",
  "html",
  "component",
  "form",
] as const;
export type NodeType = (typeof nodeTypes)[number];

export const layoutModeSchema = z.enum(["flow", "absolute"]);

export const nodeLayoutSchema = z.object({
  mode: layoutModeSchema.optional(),
  display: z.enum(["block", "flex", "grid", "none"]).optional(),
  flexDirection: z.enum(["row", "column", "row-reverse", "column-reverse"]).optional(),
  justifyContent: z
    .enum(["flex-start", "center", "flex-end", "space-between", "space-around"])
    .optional(),
  alignItems: z.enum(["stretch", "flex-start", "center", "flex-end"]).optional(),
  gap: z.string().max(40).optional(),
  gridTemplateColumns: z.string().max(120).optional(),
  gridTemplateRows: z.string().max(120).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.string().max(40).optional(),
  height: z.string().max(40).optional(),
  zIndex: z.number().int().optional(),
  padding: z.string().max(80).optional(),
  margin: z.string().max(80).optional(),
  maxWidth: z.string().max(40).optional(),
});
export type NodeLayout = z.infer<typeof nodeLayoutSchema>;

export const nodeStylesSchema = z
  .object({
    color: z.string().max(40).optional(),
    background: z.string().max(200).optional(),
    fontFamily: z.string().max(80).optional(),
    fontSize: z.string().max(40).optional(),
    fontWeight: z.string().max(20).optional(),
    lineHeight: z.string().max(20).optional(),
    letterSpacing: z.string().max(20).optional(),
    textAlign: z.enum(["left", "center", "right"]).optional(),
    border: z.string().max(80).optional(),
    borderRadius: z.string().max(40).optional(),
    boxShadow: z.string().max(120).optional(),
    opacity: z.number().min(0).max(1).optional(),
    overflow: z.enum(["visible", "hidden", "auto"]).optional(),
    objectFit: z.enum(["cover", "contain", "fill", "none"]).optional(),
  })
  .passthrough();
export type NodeStyles = z.infer<typeof nodeStylesSchema>;

export const motionPresetSchema = z.enum([
  "none",
  "fade-up",
  "fade-in",
  "scale-in",
  "slide-left",
  "slide-right",
]);

export const nodeMotionSchema = z.object({
  preset: motionPresetSchema.optional(),
  delay: z.number().min(0).max(5).optional(),
  duration: z.number().min(0).max(5).optional(),
});

export const componentBindings = [
  "case_study_list",
  "case_study_detail",
  "testimonial",
  "skills",
  "timeline",
  "career_metrics",
  "sector_grid",
  "cv_button",
  "contact_card",
] as const;

export type DocumentNode = {
  id: string;
  type: NodeType;
  name?: string;
  layout?: z.infer<typeof nodeLayoutSchema>;
  styles?: z.infer<typeof nodeStylesSchema>;
  stylesByBreakpoint?: Partial<
    Record<Breakpoint, z.infer<typeof nodeStylesSchema>>
  >;
  layoutByBreakpoint?: Partial<Record<Breakpoint, z.infer<typeof nodeLayoutSchema>>>;
  props?: Record<string, unknown>;
  motion?: z.infer<typeof nodeMotionSchema>;
  visibility?: { hidden?: boolean; abVariant?: string };
  children?: DocumentNode[];
};

export const documentNodeSchema: z.ZodType<DocumentNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(64),
    type: z.enum(nodeTypes),
    name: z.string().max(80).optional(),
    layout: nodeLayoutSchema.optional(),
    styles: nodeStylesSchema.optional(),
    stylesByBreakpoint: z
      .record(breakpointSchema, nodeStylesSchema)
      .optional(),
    layoutByBreakpoint: z
      .record(breakpointSchema, nodeLayoutSchema)
      .optional(),
    props: z.record(z.unknown()).optional(),
    motion: nodeMotionSchema.optional(),
    visibility: z
      .object({
        hidden: z.boolean().optional(),
        abVariant: z.string().max(64).optional(),
      })
      .optional(),
    children: z.array(documentNodeSchema).optional(),
  }),
);

export const documentTreeSchema = z.object({
  root: documentNodeSchema,
  seo: z
    .object({
      title: z.string().max(200).optional(),
      description: z.string().max(500).optional(),
      ogImageKey: z.string().nullable().optional(),
      noIndex: z.boolean().optional(),
    })
    .optional(),
  meta: z
    .object({
      templateId: z.string().uuid().optional(),
      caseStudySlug: z.string().optional(),
    })
    .optional(),
});
export type DocumentTree = z.infer<typeof documentTreeSchema>;

export const designTokensSchema = z.object({
  colors: z.record(z.string().max(40)).optional().default({
    fog: "#f7f6f3",
    graphite: "#1c1c1c",
    steel: "#3d5a5b",
    amber: "#c4a35a",
    mist: "#d9d6cf",
  }),
  fonts: z
    .object({
      display: z.string().optional().default("Space Grotesk"),
      body: z.string().optional().default("Source Serif 4"),
      mono: z.string().optional().default("IBM Plex Mono"),
    })
    .optional()
    .default({
      display: "Space Grotesk",
      body: "Source Serif 4",
      mono: "IBM Plex Mono",
    }),
  radii: z.record(z.string()).optional().default({ sm: "0", md: "0", lg: "0" }),
  spacing: z.record(z.string()).optional().default({}),
  baseThemeId: z.string().max(64).optional(),
  customFontKeys: z.array(z.string()).optional().default([]),
});
export type DesignTokens = z.infer<typeof designTokensSchema>;

export const documentInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$|^home$/, {
      message: "slug must be kebab path or 'home'",
    }),
  title: z.string().min(1).max(200),
  kind: documentKindSchema.default("page"),
  locale: z.string().min(2).max(12).default("en"),
  tree: documentTreeSchema,
  expectedRevisionId: z.string().uuid().optional(),
  label: z.string().max(120).optional(),
});

export const publishDocumentSchema = z.object({
  revisionId: z.string().uuid().optional(),
});

export const adminRoles = ["owner", "editor", "viewer"] as const;
export type AdminRole = (typeof adminRoles)[number];
export const adminRoleSchema = z.enum(adminRoles);

export const formFieldSchema = z.object({
  id: z.string(),
  label: z.string().max(120),
  type: z.enum(["text", "email", "textarea", "select"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export const formDefinitionSchema = z.object({
  name: z.string().min(1).max(120),
  fields: z.array(formFieldSchema).min(1),
  notifyEmail: z.string().email().optional(),
  successMessage: z.string().max(300).default("Thanks — we’ll be in touch."),
});

export const aiProviderSchema = z.enum(["openai", "anthropic", "google"]);

export function newNodeId(prefix = "n"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyPageTree(title = "Untitled"): DocumentTree {
  const rootId = newNodeId("root");
  return {
    root: {
      id: rootId,
      type: "frame",
      name: title,
      layout: {
        mode: "flow",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        padding: "2rem",
        maxWidth: "72rem",
        margin: "0 auto",
        width: "100%",
      },
      children: [
        {
          id: newNodeId("text"),
          type: "text",
          name: "Heading",
          props: { tag: "h1", text: title },
          styles: { fontSize: "2.5rem", fontWeight: "600" },
        },
      ],
    },
    seo: { title, description: "" },
  };
}

export function createHomeDocumentTree(): DocumentTree {
  return {
    root: {
      id: "home_root",
      type: "frame",
      name: "Home",
      layout: {
        mode: "flow",
        display: "flex",
        flexDirection: "column",
        gap: "3rem",
        padding: "2.5rem 1.5rem 4rem",
        maxWidth: "72rem",
        margin: "0 auto",
        width: "100%",
      },
      children: [
        {
          id: "home_hero",
          type: "stack",
          name: "Hero",
          layout: {
            mode: "flow",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          },
          children: [
            {
              id: "home_brand",
              type: "text",
              name: "Brand",
              props: { tag: "p", text: "{{siteName}}", binding: "siteName" },
              styles: {
                fontSize: "clamp(3rem, 8vw, 4.5rem)",
                fontWeight: "600",
                fontFamily: "var(--font-display)",
              },
            },
            {
              id: "home_headline",
              type: "text",
              name: "Headline",
              props: {
                tag: "h1",
                text: "{{introHeadline}}",
                binding: "introHeadline",
              },
              styles: { fontSize: "1.75rem", fontWeight: "500" },
            },
            {
              id: "home_subhead",
              type: "text",
              name: "Subhead",
              props: {
                tag: "p",
                text: "{{introSubhead}}",
                binding: "introSubhead",
              },
              styles: { fontSize: "1.125rem", opacity: 0.85 },
            },
            {
              id: "home_ctas",
              type: "stack",
              name: "CTAs",
              layout: {
                mode: "flow",
                display: "flex",
                flexDirection: "row",
                gap: "1rem",
              },
              children: [
                {
                  id: "cta_work",
                  type: "button",
                  props: {
                    label: "View work",
                    href: "/automotive",
                    variant: "primary",
                  },
                },
                {
                  id: "cta_about",
                  type: "button",
                  props: { label: "About", href: "/about", variant: "ghost" },
                },
              ],
            },
          ],
        },
        {
          id: "home_metrics",
          type: "component",
          name: "Career metrics",
          props: { component: "career_metrics" },
        },
        {
          id: "home_sectors",
          type: "component",
          name: "Sectors",
          props: { component: "sector_grid" },
        },
        {
          id: "home_testimonial",
          type: "component",
          name: "Testimonial",
          props: { component: "testimonial", mode: "first" },
        },
      ],
    },
    seo: {
      title: "Home",
      description: "Marketing portfolio across automotive, charity, and education.",
    },
  };
}
