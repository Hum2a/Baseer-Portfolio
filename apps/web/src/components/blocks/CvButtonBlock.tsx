import { mediaFileUrl } from "../../lib/api-client";
import type { SiteSettings } from "../../lib/types";
import { InteractiveAnchor, Reveal } from "../motion";

export function CvButtonBlock({
  config,
  settings,
}: {
  config: Record<string, unknown>;
  settings: SiteSettings;
}) {
  const label =
    typeof config.label === "string" && config.label.trim()
      ? config.label
      : "Download CV";
  const cvUrl = mediaFileUrl(settings.cvFileKey);
  if (!cvUrl) return null;

  return (
    <section className="page-pad pb-8">
      <Reveal className="mx-auto max-w-6xl" y={8}>
        <InteractiveAnchor href={cvUrl} variant="primary">
          {label}
        </InteractiveAnchor>
      </Reveal>
    </section>
  );
}
