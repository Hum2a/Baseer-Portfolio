import { useEffect, useState } from "react";
import type { Sector } from "@baseer-portfolio/shared";
import { apiFetch } from "../lib/api-client";
import type { CaseStudy } from "../lib/types";
import { SectorIndex } from "../components/SectorIndex";
import { DocumentTitle } from "../components/DocumentTitle";

type SectorPageProps = {
  sector: Sector;
};

export function SectorPage({ sector }: SectorPageProps) {
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await apiFetch<CaseStudy[]>(
          `/case-studies/public?sector=${encodeURIComponent(sector)}`,
        );
        if (!cancelled) setStudies(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sector]);

  const label = sector.charAt(0).toUpperCase() + sector.slice(1);

  return (
    <>
      <DocumentTitle title={`${label} — Baseer`} />
      <SectorIndex sector={sector} studies={studies} />
      {error ? (
        <p className="page-pad pb-10 font-mono text-sm text-amber mx-auto max-w-6xl">
          {error}
        </p>
      ) : null}
    </>
  );
}
