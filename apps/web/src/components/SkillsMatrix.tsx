import type { Skill } from "../lib/types";
import { Stagger, StaggerItem } from "./motion";

type SkillsMatrixProps = {
  skills: Skill[];
};

export function SkillsMatrix({ skills }: SkillsMatrixProps) {
  if (skills.length === 0) {
    return <p className="font-body text-graphite/70">Skills will appear here.</p>;
  }

  const byCategory = new Map<string, Skill[]>();
  for (const skill of skills) {
    const list = byCategory.get(skill.category) ?? [];
    list.push(skill);
    byCategory.set(skill.category, list);
  }

  return (
    <Stagger as="div" stagger={0.1} className="grid gap-10 md:grid-cols-2">
      {[...byCategory.entries()].map(([category, items]) => (
        <StaggerItem key={category} as="div">
          <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-steel mb-4">
            {category}
          </h3>
          <Stagger as="ul" stagger={0.04} className="space-y-2">
            {items.map((skill) => (
              <StaggerItem
                key={skill.id}
                as="li"
                y={6}
                className="font-body text-lg border-b border-mist/80 pb-2 transition-theme hover:border-steel/40 hover:pl-1"
              >
                {skill.name}
              </StaggerItem>
            ))}
          </Stagger>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
