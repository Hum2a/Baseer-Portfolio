import type { Testimonial } from "../lib/types";
import { Reveal } from "./motion";

type TestimonialBlockProps = {
  testimonial: Testimonial;
};

export function TestimonialBlock({ testimonial }: TestimonialBlockProps) {
  return (
    <figure className="max-w-3xl">
      <Reveal as="blockquote" className="font-body text-xl md:text-2xl leading-relaxed text-graphite" y={14}>
        “{testimonial.quote}”
      </Reveal>
      <Reveal
        as="figcaption"
        delay={0.12}
        className="mt-6 font-mono text-sm tracking-wide text-graphite/70"
        y={8}
      >
        <span className="text-graphite">{testimonial.authorName}</span>
        <span className="text-mist mx-2" aria-hidden="true">
          ·
        </span>
        <span>
          {testimonial.authorRole}, {testimonial.company}
        </span>
      </Reveal>
    </figure>
  );
}
