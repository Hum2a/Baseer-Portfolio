import { useEffect, useState, type FormEvent } from "react";
import {
  ALLOWED_CV_TYPES,
  MAX_CV_BYTES,
  siteSettingsInputSchema,
  type SocialLinks,
} from "@baseer-portfolio/shared";
import { apiFetch, mediaFileUrl } from "../../lib/api-client";
import type { SiteSettings } from "../../lib/types";

type PresignResponse = { key: string; url: string };

export function AdminSettingsPage() {
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
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-8">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Intro headline
          </span>
          <input
            required
            value={form.introHeadline}
            onChange={(e) => setForm((f) => ({ ...f, introHeadline: e.target.value }))}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Intro subhead
          </span>
          <textarea
            required
            rows={3}
            value={form.introSubhead}
            onChange={(e) => setForm((f) => ({ ...f, introSubhead: e.target.value }))}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Contact email
          </span>
          <input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>

        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-steel">CV (PDF)</p>
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
            onChange={(e) => void uploadCv(e.target.files?.[0] ?? null).catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Upload failed");
            })}
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Social links
          </legend>
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
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
