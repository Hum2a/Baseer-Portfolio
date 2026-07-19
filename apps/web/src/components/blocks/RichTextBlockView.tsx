import type { SiteSettings } from "../../lib/types";
import { MarkdownBody } from "../MarkdownBody";
import { Reveal } from "../motion";

export function RichTextBlockView({
  config,
  settings,
}: {
  config: Record<string, unknown>;
  settings: SiteSettings;
}) {
  const source = config.source === "about_bio" ? "about_bio" : "custom";
  const markdown =
    source === "about_bio"
      ? settings.aboutBio
      : typeof config.markdown === "string"
        ? config.markdown
        : "";
  const title = typeof config.title === "string" ? config.title : "";
  if (!markdown.trim()) return null;

  return (
    <section className="page-pad pb-12">
      <div className="mx-auto max-w-6xl">
        {title ? (
          <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-6">
            {title}
          </Reveal>
        ) : null}
        <Reveal>
          <MarkdownBody content={markdown} />
        </Reveal>
      </div>
    </section>
  );
}
