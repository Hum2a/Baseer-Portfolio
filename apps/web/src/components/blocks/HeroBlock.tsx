import { motion, useReducedMotion } from "motion/react";
import type { SiteSettings } from "../../lib/types";
import { InteractiveLink, Reveal } from "../motion";

const ease = [0.22, 1, 0.36, 1] as const;

type Cta = {
  label: string;
  href: string;
  variant?: "primary" | "ghost" | "text";
};

export function HeroBlock({
  config,
  settings,
}: {
  config: Record<string, unknown>;
  settings: SiteSettings;
}) {
  const reduce = useReducedMotion();
  const showBrand = config.showBrand !== false;
  const brand =
    typeof config.brandOverride === "string" && config.brandOverride.trim()
      ? config.brandOverride
      : settings.siteName || "Baseer";

  const headline =
    config.headlineSource === "custom" && typeof config.headline === "string"
      ? config.headline
      : settings.introHeadline;
  const subhead =
    config.subheadSource === "custom" && typeof config.subhead === "string"
      ? config.subhead
      : settings.introSubhead;
  const ctas = (Array.isArray(config.ctas) ? config.ctas : []) as Cta[];

  return (
    <section className="page-pad pt-10 md:pt-16 pb-12 md:pb-20">
      <div className="mx-auto max-w-6xl">
        {showBrand ? (
          <>
            <Reveal
              immediate
              as="p"
              className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[0.95]"
              y={14}
            >
              {brand}
            </Reveal>
            <motion.div
              className="mt-8 h-px w-full max-w-md bg-mist origin-left"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease, delay: 0.12 }}
            />
          </>
        ) : null}
        <Reveal
          immediate
          as="h1"
          delay={showBrand ? 0.18 : 0}
          className={
            showBrand
              ? "mt-8 font-display text-2xl md:text-3xl font-medium tracking-tight text-graphite max-w-2xl"
              : "font-display text-4xl md:text-5xl font-semibold tracking-tight"
          }
        >
          {headline}
        </Reveal>
        {subhead ? (
          <Reveal
            immediate
            as="p"
            delay={showBrand ? 0.26 : 0.08}
            className="mt-5 font-body text-lg md:text-xl text-graphite/80 measure"
          >
            {subhead}
          </Reveal>
        ) : null}
        {ctas.length > 0 ? (
          <Reveal
            immediate
            delay={showBrand ? 0.34 : 0.16}
            className="mt-10 flex flex-wrap gap-4"
            y={8}
          >
            {ctas.map((cta) => (
              <InteractiveLink
                key={`${cta.href}-${cta.label}`}
                to={cta.href}
                variant={cta.variant === "text" ? "ghost" : cta.variant ?? "primary"}
              >
                {cta.label}
              </InteractiveLink>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
