import type { Testimonial } from "../../lib/types";
import { TestimonialBlock } from "../TestimonialBlock";

export function TestimonialBlockView({
  config,
  testimonials,
}: {
  config: Record<string, unknown>;
  testimonials: Testimonial[];
}) {
  const mode = (config.mode as string) || "first";
  const ids = (Array.isArray(config.testimonialIds)
    ? config.testimonialIds
    : []) as string[];
  const limit =
    typeof config.limit === "number" && config.limit > 0 ? config.limit : 1;

  let picked: Testimonial[] = [];
  if (mode === "ids" && ids.length > 0) {
    const map = new Map(testimonials.map((t) => [t.id, t]));
    picked = ids.map((id) => map.get(id)).filter(Boolean) as Testimonial[];
  } else if (mode === "random" && testimonials.length > 0) {
    const shuffled = [...testimonials].sort(() => Math.random() - 0.5);
    picked = shuffled.slice(0, limit);
  } else {
    picked = testimonials.slice(0, limit);
  }

  if (picked.length === 0) return null;

  return (
    <section className="page-pad pb-20">
      <div className="mx-auto max-w-6xl space-y-10">
        {picked.map((t) => (
          <TestimonialBlock key={t.id} testimonial={t} />
        ))}
      </div>
    </section>
  );
}
