import { useEffect, useState, type FormEvent } from "react";
import {
  ALLOWED_CV_TYPES,
  MAX_CV_BYTES,
  siteSettingsInputSchema,
  type SocialLinks,
} from "@baseer-portfolio/shared";
import { apiFetch, mediaFileUrl } from "../../lib/api-client";
import type { SiteSettings } from "../../lib/types";
import { themes } from "../../themes/registry";

type PresignResponse = { key: string; url: string };

export function AdminSitePage() {
  const [form, setForm] = useState({
    introHeadline: "",
    introSubhead: "",
    contactEmail: "",
    cvFileKey: null as string | null,
    socialLinks: {
      linkedin: "",
      twitter: "",
      instagram: "",
      website: "",
    } satisfies SocialLinks,
    siteName: "Baseer",
    tagline: "",
    defaultThemeId: "light",
    allowVisitorThemes: true,
    navLinks: [] as SiteSettings["navLinks"],
    footerBlurb: "",
    footerLinks: [] as SiteSettings["footerLinks"],
    seoTitleSuffix: "Baseer",
    defaultMetaDescription: "",
    faviconKey: null as string | null,
    ogImageKey: null as string | null,
    aboutBio: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const row = await apiFetch<SiteSettings>("/settings/admin");
        setForm({
          introHeadline: row.introHeadline,
          introSubhead: row.introSubhead,
          contactEmail: row.contactEmail,
          cvFileKey: row.cvFileKey,
          socialLinks: {
            linkedin: row.socialLinks.linkedin ?? "",
            twitter: row.socialLinks.twitter ?? "",
            instagram: row.socialLinks.instagram ?? "",
            website: row.socialLinks.website ?? "",
          },
          siteName: row.siteName ?? "Baseer",
          tagline: row.tagline ?? "",
          defaultThemeId: row.defaultThemeId ?? "light",
          allowVisitorThemes: row.allowVisitorThemes ?? true,
          navLinks: row.navLinks ?? [],
          footerBlurb: row.footerBlurb ?? "",
          footerLinks: row.footerLinks ?? [],
          seoTitleSuffix: row.seoTitleSuffix ?? "Baseer",
          defaultMetaDescription: row.defaultMetaDescription ?? "",
          faviconKey: row.faviconKey ?? null,
          ogImageKey: row.ogImageKey ?? null,
          aboutBio: row.aboutBio ?? "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
  }, []);

  async function uploadCv(file: File | null) {
    if (!file) return;
    if (!(ALLOWED_CV_TYPES as readonly string[]).includes(file.type)) {
      setError("CV must be a PDF.");
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      setError("CV must be under 10 MB.");
      return;
    }
    const { key, url } = await apiFetch<PresignResponse>("/media/presign", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        byteSize: file.size,
        purpose: "cv",
      }),
    });
    const put = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("CV upload failed");
    setForm((f) => ({ ...f, cvFileKey: key }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = siteSettingsInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid settings");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/settings/admin", {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const cvUrl = mediaFileUrl(form.cvFileKey);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Site</h1>
      <p className="font-body text-graphite/70 mb-8 measure">
        Brand, SEO, default appearance, intro copy, and contact details.
      </p>
      <form onSubmit={handleSubmit} className="space-y-10 max-w-2xl">
        <fieldset className="space-y-4">
          <legend className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Identity
          </legend>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Site name</span>
            <input
              required
              value={form.siteName}
              onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Tagline</span>
            <input
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Appearance
          </legend>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Default theme</span>
            <select
              value={form.defaultThemeId}
              onChange={(e) =>
                setForm((f) => ({ ...f, defaultThemeId: e.target.value }))
              }
              className="w-full border border-mist bg-fog px-3 py-2"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allowVisitorThemes}
              onChange={(e) =>
                setForm((f) => ({ ...f, allowVisitorThemes: e.target.checked }))
              }
            />
            <span className="font-mono text-xs uppercase tracking-[0.12em]">
              Allow visitors to switch themes
            </span>
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            SEO
          </legend>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Title suffix</span>
            <input
              value={form.seoTitleSuffix}
              onChange={(e) =>
                setForm((f) => ({ ...f, seoTitleSuffix: e.target.value }))
              }
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">
              Default meta description
            </span>
            <textarea
              rows={3}
              value={form.defaultMetaDescription}
              onChange={(e) =>
                setForm((f) => ({ ...f, defaultMetaDescription: e.target.value }))
              }
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Intro & about
          </legend>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Intro headline</span>
            <input
              required
              value={form.introHeadline}
              onChange={(e) =>
                setForm((f) => ({ ...f, introHeadline: e.target.value }))
              }
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Intro subhead</span>
            <textarea
              required
              rows={3}
              value={form.introSubhead}
              onChange={(e) =>
                setForm((f) => ({ ...f, introSubhead: e.target.value }))
              }
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">About bio (markdown)</span>
            <textarea
              rows={8}
              value={form.aboutBio}
              onChange={(e) => setForm((f) => ({ ...f, aboutBio: e.target.value }))}
              className="w-full border border-mist bg-fog px-3 py-2 font-mono text-sm"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Contact
          </legend>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Contact email</span>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, contactEmail: e.target.value }))
              }
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
          <div className="space-y-2">
            <p className="font-mono text-xs text-graphite/60">CV (PDF)</p>
            {cvUrl ? (
              <a href={cvUrl} className="font-mono text-xs text-steel underline block">
                Current CV file
              </a>
            ) : (
              <p className="font-body text-sm text-graphite/60">No CV uploaded.</p>
            )}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                void uploadCv(e.target.files?.[0] ?? null).catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : "Upload failed");
                })
              }
            />
          </div>
          {(["linkedin", "twitter", "instagram", "website"] as const).map((key) => (
            <label key={key} className="block space-y-1">
              <span className="font-mono text-xs capitalize text-graphite/60">{key}</span>
              <input
                type="url"
                value={form.socialLinks[key] ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socialLinks: { ...f.socialLinks, [key]: e.target.value },
                  }))
                }
                className="w-full border border-mist bg-fog px-3 py-2 font-mono text-sm"
                placeholder="https://"
              />
            </label>
          ))}
        </fieldset>

        {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}
        {saved ? <p className="font-mono text-xs text-steel">Saved</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="bg-steel text-fog px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save site"}
        </button>
      </form>
    </div>
  );
}
