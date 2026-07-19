import { mediaFileUrl } from "../../lib/api-client";
import { Reveal, Stagger, StaggerItem } from "../motion";

export function GalleryHighlightBlock({
  config,
}: {
  config: Record<string, unknown>;
}) {
  const title =
    typeof config.title === "string" && config.title.trim()
      ? config.title
      : "Gallery";
  const keys = (Array.isArray(config.imageKeys) ? config.imageKeys : []) as string[];
  const urls = keys.map((k) => mediaFileUrl(k)).filter(Boolean) as string[];
  if (urls.length === 0) return null;

  return (
    <section className="page-pad pb-16">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-6">
          {title}
        </Reveal>
        <Stagger as="ul" stagger={0.08} className="grid gap-6 md:grid-cols-2">
          {urls.map((src) => (
            <StaggerItem key={src} as="li" y={12}>
              <img src={src} alt="" className="w-full object-cover" />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
