import { InteractiveLink, Reveal } from "../motion";

type Cta = {
  label: string;
  href: string;
  variant?: "primary" | "ghost" | "text";
};

export function CtaBandBlock({ config }: { config: Record<string, unknown> }) {
  const headline = typeof config.headline === "string" ? config.headline : "";
  const body = typeof config.body === "string" ? config.body : "";
  const ctas = (Array.isArray(config.ctas) ? config.ctas : []) as Cta[];
  if (!headline && !body && ctas.length === 0) return null;

  return (
    <section className="page-pad pb-16">
      <Reveal className="mx-auto max-w-6xl border border-mist px-6 py-10 md:px-10">
        {headline ? (
          <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight">
            {headline}
          </h2>
        ) : null}
        {body ? (
          <p className="mt-4 font-body text-lg text-graphite/80 measure">{body}</p>
        ) : null}
        {ctas.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-4">
            {ctas.map((cta) => (
              <InteractiveLink
                key={`${cta.href}-${cta.label}`}
                to={cta.href}
                variant={cta.variant === "text" ? "ghost" : cta.variant ?? "primary"}
              >
                {cta.label}
              </InteractiveLink>
            ))}
          </div>
        ) : null}
      </Reveal>
    </section>
  );
}
