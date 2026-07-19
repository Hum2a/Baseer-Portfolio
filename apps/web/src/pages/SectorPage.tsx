import type { Sector } from "@baseer-portfolio/shared";
import { CmsPageView } from "../components/CmsPageView";

type SectorPageProps = {
  sector: Sector;
};

export function SectorPage({ sector }: SectorPageProps) {
  const label = sector.charAt(0).toUpperCase() + sector.slice(1);
  return (
    <CmsPageView
      pageKey={`sector:${sector}`}
      titleFallback={label}
    />
  );
}
