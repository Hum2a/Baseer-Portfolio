import { useEffect, useState } from "react";
import {
  DEFAULT_FOOTER_LINKS,
  DEFAULT_NAV_LINKS,
  siteSettingsInputSchema,
  type FooterLink,
  type NavLink,
} from "@baseer-portfolio/shared";
import { apiFetch } from "../../lib/api-client";
import type { SiteSettings } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AdminNavPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [footerBlurb, setFooterBlurb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const row = await apiFetch<SiteSettings>("/settings/admin");
        setSettings(row);
        setNavLinks(row.navLinks?.length ? row.navLinks : DEFAULT_NAV_LINKS);
        setFooterLinks(
          row.footerLinks?.length ? row.footerLinks : DEFAULT_FOOTER_LINKS,
        );
        setFooterBlurb(row.footerBlurb ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
  }, []);

  async function persist(nextNav: NavLink[], nextFooter: FooterLink[], blurb: string) {
    if (!settings) return;
    setBusy(true);
    setError(null);
    try {
      const payload = siteSettingsInputSchema.parse({
        ...settings,
        navLinks: nextNav,
        footerLinks: nextFooter,
        footerBlurb: blurb,
      });
      const savedRow = await apiFetch<SiteSettings>("/settings/admin", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSettings(savedRow);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return (
      <p className="font-mono text-sm text-graphite/60">
        {error ?? "Loading…"}
      </p>
    );
  }

  return (
    <div className="space-y-12 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
          Navigation
        </h1>
        <p className="font-body text-graphite/70 measure">
          Reorder header and footer links. Changes publish immediately.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Header links
          </h2>
          <button
            type="button"
            className="font-mono text-xs uppercase tracking-[0.12em] text-steel"
            onClick={() => {
              const next = [
                ...navLinks,
                {
                  id: newId("nav"),
                  label: "New link",
                  href: "/",
                  visible: true,
                },
              ];
              setNavLinks(next);
            }}
          >
            Add link
          </button>
        </div>
        <ReorderableList
          items={navLinks}
          onReorder={(items) => {
            setNavLinks(items);
            void persist(items, footerLinks, footerBlurb);
          }}
          emptyMessage="No nav links."
          renderItem={(item) => (
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] w-full">
              <input
                value={item.label}
                onChange={(e) => {
                  const next = navLinks.map((l) =>
                    l.id === item.id ? { ...l, label: e.target.value } : l,
                  );
                  setNavLinks(next);
                }}
                onBlur={() => void persist(navLinks, footerLinks, footerBlurb)}
                className="border border-mist bg-fog px-2 py-1.5 text-sm"
                aria-label="Nav label"
              />
              <input
                value={item.href}
                onChange={(e) => {
                  const next = navLinks.map((l) =>
                    l.id === item.id ? { ...l, href: e.target.value } : l,
                  );
                  setNavLinks(next);
                }}
                onBlur={() => void persist(navLinks, footerLinks, footerBlurb)}
                className="border border-mist bg-fog px-2 py-1.5 font-mono text-sm"
                aria-label="Nav href"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase">
                  <input
                    type="checkbox"
                    checked={item.visible !== false}
                    onChange={(e) => {
                      const next = navLinks.map((l) =>
                        l.id === item.id ? { ...l, visible: e.target.checked } : l,
                      );
                      setNavLinks(next);
                      void persist(next, footerLinks, footerBlurb);
                    }}
                  />
                  Show
                </label>
                <button
                  type="button"
                  className="font-mono text-[10px] uppercase text-amber"
                  onClick={() => {
                    const next = navLinks.filter((l) => l.id !== item.id);
                    setNavLinks(next);
                    void persist(next, footerLinks, footerBlurb);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
          Footer
        </h2>
        <label className="block space-y-1">
          <span className="font-mono text-xs text-graphite/60">Footer blurb</span>
          <input
            value={footerBlurb}
            onChange={(e) => setFooterBlurb(e.target.value)}
            onBlur={() => void persist(navLinks, footerLinks, footerBlurb)}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            className="font-mono text-xs uppercase tracking-[0.12em] text-steel"
            onClick={() => {
              const next = [
                ...footerLinks,
                {
                  id: newId("foot"),
                  label: "New link",
                  href: "/",
                  visible: true,
                },
              ];
              setFooterLinks(next);
            }}
          >
            Add footer link
          </button>
        </div>
        <ReorderableList
          items={footerLinks}
          onReorder={(items) => {
            setFooterLinks(items);
            void persist(navLinks, items, footerBlurb);
          }}
          emptyMessage="No footer links."
          renderItem={(item) => (
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] w-full">
              <input
                value={item.label}
                onChange={(e) => {
                  const next = footerLinks.map((l) =>
                    l.id === item.id ? { ...l, label: e.target.value } : l,
                  );
                  setFooterLinks(next);
                }}
                onBlur={() => void persist(navLinks, footerLinks, footerBlurb)}
                className="border border-mist bg-fog px-2 py-1.5 text-sm"
              />
              <input
                value={item.href}
                onChange={(e) => {
                  const next = footerLinks.map((l) =>
                    l.id === item.id ? { ...l, href: e.target.value } : l,
                  );
                  setFooterLinks(next);
                }}
                onBlur={() => void persist(navLinks, footerLinks, footerBlurb)}
                className="border border-mist bg-fog px-2 py-1.5 font-mono text-sm"
              />
              <button
                type="button"
                className="font-mono text-[10px] uppercase text-amber"
                onClick={() => {
                  const next = footerLinks.filter((l) => l.id !== item.id);
                  setFooterLinks(next);
                  void persist(navLinks, next, footerBlurb);
                }}
              >
                Remove
              </button>
            </div>
          )}
        />
      </section>

      {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}
      {saved ? <p className="font-mono text-xs text-steel">Saved</p> : null}
      {busy ? <p className="font-mono text-xs text-graphite/50">Saving…</p> : null}
    </div>
  );
}
