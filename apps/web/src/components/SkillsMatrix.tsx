import type { Skill } from "../lib/types";

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
    <div className="grid gap-10 md:grid-cols-2">
      {[...byCategory.entries()].map(([category, items]) => (
        <div key={category}>
          <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-steel mb-4">
            {category}
          </h3>
          <ul className="space-y-2">
            {items.map((skill) => (
              <li
                key={skill.id}
                className="font-body text-lg border-b border-mist/80 pb-2"
              >
                {skill.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
