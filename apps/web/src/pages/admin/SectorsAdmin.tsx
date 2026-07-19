import { useEffect, useState } from "react";
import { sectorInputSchema } from "@baseer-portfolio/shared";
import { apiFetch } from "../../lib/api-client";
import type { SectorRecord } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

export function AdminSectorsPage() {
  const [rows, setRows] = useState<SectorRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const list = await apiFetch<SectorRecord[]>("/sectors/admin");
        setRows(list);
        setSelectedId(list[0]?.id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
  }, []);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  async function save(row: SectorRecord) {
    setBusy(true);
    setError(null);
    try {
      const parsed = sectorInputSchema.parse({
        slug: row.slug,
        label: row.label,
        intro: row.intro,
        heroImageKey: row.heroImageKey,
        displayOrder: row.displayOrder,
        published: row.published,
      });
      const updated = await apiFetch<SectorRecord>(`/sectors/admin/${row.id}`, {
        method: "PUT",
        body: JSON.stringify(parsed),
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
          Sectors
        </h1>
        <p className="font-body text-graphite/70 measure">
          Labels and intros for automotive, charity, and education.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <ReorderableList
          items={rows}
          onReorder={async (items) => {
            setRows(items);
            await apiFetch("/sectors/admin/reorder", {
              method: "PUT",
              body: JSON.stringify({ ids: items.map((i) => i.id) }),
            });
          }}
          emptyMessage="No sectors."
          renderItem={(item) => (
            <button
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full text-left px-2 py-1 ${
                selectedId === item.id ? "bg-mist/50" : ""
              }`}
            >
              <span className="font-display">{item.label}</span>
            </button>
          )}
        />

        {selected ? (
          <form
            className="space-y-4 border border-mist p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void save(selected);
            }}
          >
            <label className="block space-y-1">
              <span className="font-mono text-xs text-graphite/60">Label</span>
              <input
                value={selected.label}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.id === selected.id ? { ...r, label: e.target.value } : r,
                    ),
                  )
                }
                className="w-full border border-mist bg-fog px-3 py-2"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-mono text-xs text-graphite/60">Slug</span>
              <input
                value={selected.slug}
                disabled
                className="w-full border border-mist bg-fog px-3 py-2 font-mono text-sm opacity-70"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-mono text-xs text-graphite/60">Intro</span>
              <textarea
                rows={4}
                value={selected.intro}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.id === selected.id ? { ...r, intro: e.target.value } : r,
                    ),
                  )
                }
                className="w-full border border-mist bg-fog px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 font-mono text-xs uppercase">
              <input
                type="checkbox"
                checked={selected.published}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.id === selected.id
                        ? { ...r, published: e.target.checked }
                        : r,
                    ),
                  )
                }
              />
              Published
            </label>
            <button
              type="submit"
              disabled={busy}
              className="bg-steel text-fog px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save sector"}
            </button>
          </form>
        ) : (
          <p className="font-body text-graphite/60">Select a sector.</p>
        )}
      </div>

      {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}
      {saved ? <p className="font-mono text-xs text-steel">Saved</p> : null}
    </div>
  );
}
