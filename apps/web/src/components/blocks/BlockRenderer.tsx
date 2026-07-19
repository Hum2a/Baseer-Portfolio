import type { PageKey, Sector } from "@baseer-portfolio/shared";
import type {
  CaseStudy,
  CmsPage,
  PageBlock,
  SectorRecord,
  SiteSettings,
  Skill,
  Testimonial,
  TimelineEntry,
} from "../../lib/types";
import { HeroBlock } from "./HeroBlock";
import { SpecStripBlockView } from "./SpecStripBlock";
import { SectorGridBlock } from "./SectorGridBlock";
import { FeaturedWorkBlock } from "./FeaturedWorkBlock";
import { TestimonialBlockView } from "./TestimonialBlockView";
import { TimelineBlockView } from "./TimelineBlockView";
import { SkillsBlockView } from "./SkillsBlockView";
import { RichTextBlockView } from "./RichTextBlockView";
import { CtaBandBlock } from "./CtaBandBlock";
import { ContactCardBlock } from "./ContactCardBlock";
import { CvButtonBlock } from "./CvButtonBlock";
import { GalleryHighlightBlock } from "./GalleryHighlightBlock";

export type BlockData = {
  settings: SiteSettings;
  studies: CaseStudy[];
  testimonials: Testimonial[];
  timeline: TimelineEntry[];
  skills: Skill[];
  sectors: SectorRecord[];
  pageKey: PageKey | string;
};

function sectorFromPageKey(key: string): Sector | null {
  if (key.startsWith("sector:")) {
    return key.slice("sector:".length) as Sector;
  }
  return null;
}

export function BlockRenderer({
  page,
  data,
}: {
  page: CmsPage;
  data: BlockData;
}) {
  const blocks = page.blocks.filter((b) => b.enabled !== false);
  const pageSector = sectorFromPageKey(String(page.key));

  if (blocks.length === 0) {
    return (
      <section className="page-pad section-y mx-auto max-w-6xl">
        <p className="font-body text-lg text-graphite/70">
          This page has no published sections yet.
        </p>
      </section>
    );
  }

  return (
    <>
      {blocks.map((block) => (
        <BlockSwitch
          key={block.id}
          block={block}
          data={data}
          pageSector={pageSector}
        />
      ))}
    </>
  );
}

function BlockSwitch({
  block,
  data,
  pageSector,
}: {
  block: PageBlock;
  data: BlockData;
  pageSector: Sector | null;
}) {
  switch (block.type) {
    case "hero":
      return <HeroBlock config={block.config} settings={data.settings} />;
    case "spec_strip":
      return (
        <SpecStripBlockView
          config={block.config}
          studies={data.studies}
          timeline={data.timeline}
        />
      );
    case "sector_grid":
      return (
        <SectorGridBlock
          config={block.config}
          studies={data.studies}
          sectors={data.sectors}
        />
      );
    case "featured_work":
      return (
        <FeaturedWorkBlock
          config={block.config}
          studies={data.studies}
          pageSector={pageSector}
        />
      );
    case "testimonial":
      return (
        <TestimonialBlockView
          config={block.config}
          testimonials={data.testimonials}
        />
      );
    case "timeline":
      return <TimelineBlockView config={block.config} timeline={data.timeline} />;
    case "skills":
      return <SkillsBlockView config={block.config} skills={data.skills} />;
    case "rich_text":
      return <RichTextBlockView config={block.config} settings={data.settings} />;
    case "cta_band":
      return <CtaBandBlock config={block.config} />;
    case "contact_card":
      return <ContactCardBlock config={block.config} settings={data.settings} />;
    case "cv_button":
      return <CvButtonBlock config={block.config} settings={data.settings} />;
    case "gallery_highlight":
      return <GalleryHighlightBlock config={block.config} />;
    default:
      return null;
  }
}
