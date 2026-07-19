import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSiteSettings } from "../lib/site-settings";
import {
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  getTheme,
  isThemeId,
  themes,
  type ThemeMeta,
} from "./registry";

type ThemeContextValue = {
  themeId: string;
  theme: ThemeMeta;
  themes: ThemeMeta[];
  setThemeId: (id: string) => void;
  allowVisitorThemes: boolean;
  siteDefaultThemeId: string;
  resetToSiteDefault: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(id: string) {
  document.documentElement.setAttribute("data-theme", id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", getTheme(id).swatches[2]);
  }
}

function readStoredTheme(): string | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

function isAdminPath() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSiteSettings();
  const siteDefault = isThemeId(settings?.defaultThemeId)
    ? settings!.defaultThemeId
    : DEFAULT_THEME_ID;
  const allowVisitorThemes = settings?.allowVisitorThemes ?? true;

  const [themeId, setThemeIdState] = useState(() => {
    const stored = readStoredTheme();
    if (stored) return stored;
    const attr = document.documentElement.getAttribute("data-theme");
    if (isThemeId(attr)) return attr;
    return DEFAULT_THEME_ID;
  });
  const [visitorOverride, setVisitorOverride] = useState(() => Boolean(readStoredTheme()));

  useEffect(() => {
    if (!settings) return;
    if (!allowVisitorThemes && !isAdminPath()) {
      setThemeIdState(siteDefault);
      applyTheme(siteDefault);
      return;
    }
    if (!visitorOverride) {
      setThemeIdState(siteDefault);
      applyTheme(siteDefault);
    }
  }, [settings, siteDefault, allowVisitorThemes, visitorOverride]);

  const setThemeId = useCallback(
    (id: string) => {
      const next = isThemeId(id) ? id : siteDefault;
      setThemeIdState(next);
      setVisitorOverride(true);
      applyTheme(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    },
    [siteDefault],
  );

  const resetToSiteDefault = useCallback(() => {
    setVisitorOverride(false);
    setThemeIdState(siteDefault);
    applyTheme(siteDefault);
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [siteDefault]);

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      theme: getTheme(themeId),
      themes,
      setThemeId,
      allowVisitorThemes,
      siteDefaultThemeId: siteDefault,
      resetToSiteDefault,
    }),
    [themeId, setThemeId, allowVisitorThemes, siteDefault, resetToSiteDefault],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
