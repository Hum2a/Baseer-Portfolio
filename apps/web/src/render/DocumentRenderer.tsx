import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import type { Breakpoint, DocumentNode, DocumentTree } from "@baseer-portfolio/shared";
import type {
  CaseStudy,
  SectorRecord,
  SiteSettings,
  Skill,
  Testimonial,
  TimelineEntry,
} from "../lib/types";
import { mediaFileUrl } from "../lib/api-client";
import { computeCareerMetrics } from "../lib/career-metrics";
import { SpecStrip } from "../components/SpecStrip";
import { TestimonialBlock } from "../components/TestimonialBlock";
import { Timeline } from "../components/Timeline";
import { SkillsMatrix } from "../components/SkillsMatrix";
import { MarkdownBody } from "../components/MarkdownBody";
import { InteractiveLink, InteractiveAnchor } from "../components/motion";
import { mergeNodeCss } from "./layoutStyles";

export type RenderData = {
  settings: SiteSettings | null;
  studies: CaseStudy[];
  testimonials: Testimonial[];
  timeline: TimelineEntry[];
  skills: Skill[];
  sectors: SectorRecord[];
  breakpoint?: Breakpoint;
  abVariant?: string | null;
  editMode?: boolean;
  selectedId?: string | null;
  onSelectNode?: (id: string) => void;
};

function resolveText(
  raw: string,
  settings: SiteSettings | null,
): string {
  if (!settings) return raw;
  return raw
    .replaceAll("{{siteName}}", settings.siteName ?? "Baseer")
    .replaceAll("{{introHeadline}}", settings.introHeadline ?? "")
    .replaceAll("{{introSubhead}}", settings.introSubhead ?? "")
    .replaceAll("{{footerBlurb}}", settings.footerBlurb ?? "")
    .replaceAll("{{aboutBio}}", settings.aboutBio ?? "")
    .replaceAll("{{contactEmail}}", settings.contactEmail ?? "");
}

function MotionWrap({
  node,
  children,
}: {
  node: DocumentNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const preset = node.motion?.preset ?? "none";
  if (reduce || preset === "none") return <>{children}</>;
  const delay = node.motion?.delay ?? 0;
  const duration = node.motion?.duration ?? 0.45;
  const initial =
    preset === "fade-up"
      ? { opacity: 0, y: 12 }
      : preset === "fade-in"
        ? { opacity: 0 }
        : preset === "scale-in"
          ? { opacity: 0, scale: 0.96 }
          : preset === "slide-left"
            ? { opacity: 0, x: 16 }
            : preset === "slide-right"
              ? { opacity: 0, x: -16 }
              : { opacity: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ComponentNode({
  node,
  data,
}: {
  node: DocumentNode;
  data: RenderData;
}) {
  const component = String(node.props?.component ?? "");
  const settings = data.settings;

  if (component === "career_metrics") {
    const metrics = computeCareerMetrics(data.studies, data.timeline);
    if (!metrics.length) return null;
    return (
      <div className="border-y border-mist py-6">
        <SpecStrip metrics={metrics} />
      </div>
    );
  }

  if (component === "sector_grid") {
    const rows =
      data.sectors.length > 0
        ? data.sectors
        : (["automotive", "charity", "education"] as const).map((slug, i) => ({
            id: slug,
            ownerId: "",
            slug,
            label: slug.charAt(0).toUpperCase() + slug.slice(1),
            intro: "",
            heroImageKey: null,
            displayOrder: i,
            published: true,
          }));
    return (
      <ul className="grid gap-10 md:grid-cols-3">
        {rows.map((sector) => {
          const count = data.studies.filter((s) => s.sector === sector.slug).length;
          return (
            <li key={sector.id} className="border-t border-mist pt-5">
              <Link to={`/${sector.slug}`} className="no-underline group block">
                <h3 className="font-display text-xl font-medium group-hover:text-steel">
                  {sector.label}
                </h3>
                {sector.intro ? (
                  <p className="mt-3 font-body text-graphite/75">{sector.intro}</p>
                ) : null}
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-amber">
                  {count} case {count === 1 ? "study" : "studies"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  if (component === "testimonial") {
    const t = data.testimonials[0];
    if (!t) return null;
    return <TestimonialBlock testimonial={t} />;
  }

  if (component === "timeline") {
    return <Timeline entries={data.timeline} />;
  }

  if (component === "skills") {
    return <SkillsMatrix skills={data.skills} />;
  }

  if (component === "cv_button") {
    const url = mediaFileUrl(settings?.cvFileKey);
    if (!url) return null;
    return (
      <InteractiveAnchor href={url} variant="primary">
        Download CV
      </InteractiveAnchor>
    );
  }

  if (component === "contact_card") {
    const socials = settings?.socialLinks ?? {};
    const links = [
      { label: "LinkedIn", href: socials.linkedin },
      { label: "Twitter", href: socials.twitter },
      { label: "Instagram", href: socials.instagram },
      { label: "Website", href: socials.website },
    ].filter((l): l is { label: string; href: string } => Boolean(l.href));
    return (
      <div className="space-y-6">
        {settings?.contactEmail ? (
          <InteractiveAnchor
            href={`mailto:${settings.contactEmail}`}
            variant="text"
            className="font-display text-2xl text-steel"
          >
            {settings.contactEmail}
          </InteractiveAnchor>
        ) : null}
        <ul className="space-y-2">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase tracking-[0.14em] text-graphite/70 hover:text-steel"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (component === "case_study_list") {
    const sector = node.props?.sector as string | undefined;
    const list = sector
      ? data.studies.filter((s) => s.sector === sector)
      : data.studies;
    return (
      <ul className="divide-y divide-mist">
        {list.map((study) => (
          <li key={study.id} className="py-8">
            <Link to={`/work/${study.slug}`} className="no-underline group block">
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-steel mb-2 capitalize">
                {study.sector}
              </p>
              <h3 className="font-display text-2xl font-medium group-hover:text-steel">
                {study.title}
              </h3>
              <p className="mt-3 font-body text-graphite/75">{study.dek}</p>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  if (component === "nav_links") {
    const links = (settings?.navLinks ?? []).filter((l) => l.visible !== false);
    return (
      <nav className="flex flex-wrap gap-x-5 gap-y-2">
        {links.map((l) => (
          <Link
            key={l.id}
            to={l.href}
            className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/70 hover:text-steel no-underline"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    );
  }

  if (component === "footer_links") {
    const links = (settings?.footerLinks ?? []).filter((l) => l.visible !== false);
    return (
      <div className="flex flex-wrap gap-5">
        {links.map((l) =>
          l.href.endsWith(".xml") || l.href.startsWith("http") ? (
            <a
              key={l.id}
              href={l.href}
              className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/70"
            >
              {l.label}
            </a>
          ) : (
            <Link
              key={l.id}
              to={l.href}
              className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/70 no-underline"
            >
              {l.label}
            </Link>
          ),
        )}
      </div>
    );
  }

  return null;
}

function NodeView({
  node,
  data,
}: {
  node: DocumentNode;
  data: RenderData;
}) {
  if (node.visibility?.hidden) return null;
  if (
    data.abVariant &&
    node.visibility?.abVariant &&
    node.visibility.abVariant !== data.abVariant
  ) {
    return null;
  }

  const bp = data.breakpoint ?? "desktop";
  const layoutBp = node.layoutByBreakpoint?.[bp];
  const stylesBp = node.stylesByBreakpoint?.[bp];
  const css = mergeNodeCss(node.layout, node.styles, layoutBp, stylesBp);
  const selected = data.editMode && data.selectedId === node.id;
  const shellProps = data.editMode
    ? {
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          data.onSelectNode?.(node.id);
        },
        "data-node-id": node.id,
        className: selected ? "outline outline-2 outline-steel outline-offset-2" : undefined,
      }
    : {};

  const inner = (() => {
    switch (node.type) {
      case "frame":
      case "stack":
      case "grid":
        return (
          <div style={css} {...shellProps}>
            {(node.children ?? []).map((child) => (
              <NodeView key={child.id} node={child} data={data} />
            ))}
          </div>
        );
      case "text": {
        const tag = (node.props?.tag as string) || "p";
        const text = resolveText(String(node.props?.text ?? ""), data.settings);
        if (node.props?.markdown) {
          return (
            <div style={css} {...shellProps}>
              <MarkdownBody content={text} />
            </div>
          );
        }
        if (tag === "h1")
          return (
            <h1 style={css} {...shellProps}>
              {text}
            </h1>
          );
        if (tag === "h2")
          return (
            <h2 style={css} {...shellProps}>
              {text}
            </h2>
          );
        if (tag === "h3")
          return (
            <h3 style={css} {...shellProps}>
              {text}
            </h3>
          );
        return (
          <p style={css} {...shellProps}>
            {text}
          </p>
        );
      }
      case "button": {
        const label = resolveText(
          String(node.props?.label ?? "Button"),
          data.settings,
        );
        const href = String(node.props?.href ?? "/");
        const variant = (node.props?.variant as "primary" | "ghost" | "text") ?? "primary";
        return (
          <div style={css} {...shellProps}>
            <InteractiveLink to={href} variant={variant}>
              {label}
            </InteractiveLink>
          </div>
        );
      }
      case "image": {
        const src = mediaFileUrl(String(node.props?.srcKey ?? ""));
        if (!src) return null;
        return (
          <img
            src={src}
            alt={String(node.props?.alt ?? "")}
            style={{ ...css, display: "block", maxWidth: "100%" }}
            {...shellProps}
          />
        );
      }
      case "video": {
        const src = mediaFileUrl(String(node.props?.srcKey ?? ""));
        const embed = String(node.props?.embedUrl ?? "");
        if (embed) {
          return (
            <div style={css} {...shellProps}>
              <iframe
                src={embed}
                title={String(node.props?.title ?? "Video")}
                className="w-full aspect-video border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        if (!src) return null;
        return (
          <video src={src} controls style={css} {...shellProps}>
            <track kind="captions" />
          </video>
        );
      }
      case "embed":
      case "html": {
        const html = String(node.props?.html ?? "");
        if (!html) return null;
        return (
          <div
            style={css}
            {...shellProps}
            // Owner-authored HTML/embeds — studio power feature
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
      case "shape":
        return <div style={css} {...shellProps} aria-hidden />;
      case "icon":
        return (
          <span style={css} {...shellProps}>
            {String(node.props?.symbol ?? "◆")}
          </span>
        );
      case "form":
        return (
          <div style={css} {...shellProps}>
            <p className="font-mono text-xs text-graphite/60">
              Form {String(node.props?.formId ?? "")} — submit wired via /api/forms
            </p>
          </div>
        );
      case "component":
        return (
          <div style={css} {...shellProps}>
            <ComponentNode node={node} data={data} />
          </div>
        );
      default:
        return null;
    }
  })();

  return <MotionWrap node={node}>{inner}</MotionWrap>;
}

export function DocumentRenderer({
  tree,
  data,
}: {
  tree: DocumentTree;
  data: RenderData;
}) {
  return <NodeView node={tree.root} data={data} />;
}
