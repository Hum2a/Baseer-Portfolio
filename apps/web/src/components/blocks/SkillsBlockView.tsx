import type { Skill } from "../../lib/types";
import { SkillsMatrix } from "../SkillsMatrix";
import { Reveal } from "../motion";

export function SkillsBlockView({
  config,
  skills,
}: {
  config: Record<string, unknown>;
  skills: Skill[];
}) {
  const title =
    typeof config.title === "string" && config.title.trim() ? config.title : "Skills";
  if (skills.length === 0) return null;

  return (
    <section className="page-pad pb-16">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-8">
          {title}
        </Reveal>
        <SkillsMatrix skills={skills} />
      </div>
    </section>
  );
}
