import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { CaseStudyInput } from "@baseer-portfolio/shared";
import { apiFetch } from "../../lib/api-client";
import type { CaseStudyDetail } from "../../lib/types";
import { CaseStudyForm } from "../../components/admin/CaseStudyForm";
import { ImageUploader } from "../../components/admin/ImageUploader";

export function AdminCaseStudyNewPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-8">New case study</h1>
      <CaseStudyForm
        submitLabel="Create"
        onSubmit={async (data) => {
          const created = await apiFetch<{ id: string }>("/case-studies/admin", {
            method: "POST",
            body: JSON.stringify(data),
          });
          void navigate(`/admin/case-studies/${created.id}`);
        }}
      />
    </div>
  );
}

export function AdminCaseStudyEditPage() {
  const { id } = useParams<{ id: string }>();
  const [study, setStudy] = useState<CaseStudyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const row = await apiFetch<CaseStudyDetail>(`/case-studies/admin/${id}`);
        if (!cancelled) setStudy(row);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return <p className="font-mono text-sm text-amber">{error}</p>;
  }

  if (!study) {
    return <p className="font-mono text-sm text-graphite/60">Loading…</p>;
  }

  const initial: Partial<CaseStudyInput> = {
    sector: study.sector,
    title: study.title,
    slug: study.slug,
    dek: study.dek,
    heroImageKey: study.heroImageKey,
    challenge: study.challenge,
    strategy: study.strategy,
    execution: study.execution,
    results: study.results,
    specMetrics: study.specMetrics,
    published: study.published,
    displayOrder: study.displayOrder,
  };

  async function addGalleryImage(key: string) {
    if (!id) return;
    const created = await apiFetch<CaseStudyDetail["gallery"][number]>(
      `/case-studies/admin/${id}/gallery`,
      {
        method: "POST",
        body: JSON.stringify({ imageKey: key, caption: "" }),
      },
    );
    setStudy((prev) => (prev ? { ...prev, gallery: [...prev.gallery, created] } : prev));
  }

  async function removeGalleryImage(imageId: string) {
    if (!id) return;
    await apiFetch(`/case-studies/admin/${id}/gallery/${imageId}`, { method: "DELETE" });
    setStudy((prev) =>
      prev ? { ...prev, gallery: prev.gallery.filter((g) => g.id !== imageId) } : prev,
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Edit case study</h1>
        <Link
          to={`/work/${study.slug}`}
          className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/60"
        >
          View public
        </Link>
      </div>

      <CaseStudyForm
        initial={initial}
        onSubmit={async (data) => {
          const updated = await apiFetch<CaseStudyDetail>(`/case-studies/admin/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
          setStudy((prev) => (prev ? { ...updated, gallery: prev.gallery } : updated));
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2000);
        }}
      />
      {saved ? <p className="font-mono text-xs text-steel">Saved</p> : null}

      <section className="border-t border-mist pt-10 space-y-4">
        <h2 className="font-display text-xl font-medium">Gallery</h2>
        <ul className="space-y-3">
          {study.gallery.length === 0 ? (
            <li className="font-body text-graphite/60">No gallery images yet.</li>
          ) : (
            study.gallery.map((image) => (
              <li
                key={image.id}
                className="flex items-center justify-between gap-3 border-b border-mist py-2"
              >
                <span className="font-mono text-xs truncate">{image.imageKey}</span>
                <button
                  type="button"
                  onClick={() => void removeGalleryImage(image.id)}
                  className="font-mono text-xs uppercase text-graphite/50"
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
        <ImageUploader
          label="Add gallery image"
          value={null}
          purpose="gallery-image"
          onUploaded={(key) => void addGalleryImage(key)}
        />
      </section>
    </div>
  );
}
