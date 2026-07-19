import { useEffect } from "react";
import { useSiteSettings } from "../lib/site-settings";

export function DocumentTitle({ title }: { title: string }) {
  const { settings } = useSiteSettings();
  const suffix = settings?.seoTitleSuffix?.trim() || settings?.siteName || "Baseer";

  useEffect(() => {
    const base = title.trim();
    if (!base) {
      document.title = suffix;
      return;
    }
    if (base === suffix || base.endsWith(` — ${suffix}`) || base.endsWith(` - ${suffix}`)) {
      document.title = base;
      return;
    }
    document.title = `${base} — ${suffix}`;
  }, [title, suffix]);

  return null;
}
