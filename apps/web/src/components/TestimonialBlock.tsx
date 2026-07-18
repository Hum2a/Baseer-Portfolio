import type { Testimonial } from "../lib/types";

type TestimonialBlockProps = {
  testimonial: Testimonial;
};

export function TestimonialBlock({ testimonial }: TestimonialBlockProps) {
  return (
    <figure className="max-w-3xl">
      <blockquote className="font-body text-xl md:text-2xl leading-relaxed text-graphite">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-6 font-mono text-sm tracking-wide text-graphite/70">
        <span className="text-graphite">{testimonial.authorName}</span>
        <span className="text-mist mx-2" aria-hidden="true">
          ·
        </span>
        <span>
          {testimonial.authorRole}, {testimonial.company}
        </span>
      </figcaption>
    </figure>
  );
}
