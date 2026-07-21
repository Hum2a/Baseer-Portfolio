import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_FOOTER_LINKS,
  DEFAULT_NAV_LINKS,
} from "@baseer-portfolio/shared";
import { apiFetch, mediaFileUrl } from "./api-client";
import type { SiteSettings } from "./types";

type SiteSettingsContextValue = {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

const FALLBACK: SiteSettings = {
  id: "",
  ownerId: "",
  cvFileKey: null,
  introHeadline: "Marketing that moves people and markets.",
  introSubhead: "Campaigns and launches across automotive, charity, and education.",
  contactEmail: "",
  socialLinks: {},
  siteName: "Baseer",
  tagline: "Marketing portfolio",
  defaultThemeId: "light",
  allowVisitorThemes: true,
  navLinks: DEFAULT_NAV_LINKS,
  footerBlurb: "Baseer · Marketing portfolio",
  footerLinks: DEFAULT_FOOTER_LINKS,
  seoTitleSuffix: "Baseer",
  defaultMetaDescription: "",
  faviconKey: null,
  ogImageKey: null,
  aboutBio: "",
};

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const row = await apiFetch<SiteSettings>("/settings/public");
      setSettings(row);
      setError(null);
    } catch (err) {
      setSettings(FALLBACK);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!settings) return;
    const desc = settings.defaultMetaDescription?.trim();
    if (desc) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", desc);
    }

    const customIcon = mediaFileUrl(settings.faviconKey);
    const href = customIcon || "/favicon.svg";
    const type = customIcon
      ? customIcon.endsWith(".svg")
        ? "image/svg+xml"
        : "image/png"
      : "image/svg+xml";
    for (const rel of ["icon", "shortcut icon"] as const) {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.type = type;
      // Cache-bust so browsers pick up replacements after CMS uploads.
      link.href = customIcon ? `${href}${href.includes("?") ? "&" : "?"}v=${settings.id}` : href;
    }
  }, [settings]);

  const value = useMemo(
    () => ({ settings, loading, error, refresh }),
    [settings, loading, error],
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }
  return ctx;
}

export function useSiteSettingsOrFallback(): SiteSettings {
  const { settings } = useSiteSettings();
  return settings ?? FALLBACK;
}
