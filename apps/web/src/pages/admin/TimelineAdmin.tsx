import { useCallback, useEffect, useState } from "react";
import { sectors } from "@baseer-portfolio/shared";
import { apiFetch } from "../../lib/api-client";
import type { TimelineEntry } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

const emptyForm = {
  yearRange: "",
  title: "",
  organisation: "",
  description: "",
  sector: "" as "" | (typeof sectors)[number],
};

export function AdminTimelinePage() {
  const [items, setItems] = useState<TimelineEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await apiFetch<TimelineEntry[]>("/timeline/admin"));
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    });
  }, [load]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Timeline</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
          Drag to reorder
        </p>
      </div>

      <ReorderableList
        items={items}
        emptyMessage="No timeline entries yet."
        onReorder={async (next) => {
          setItems(next);
          await apiFetch("/timeline/admin/reorder", {
            method: "PUT",
            body: JSON.stringify({ ids: next.map((i) => i.id) }),
          });
        }}
        renderItem={(item) => (
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-amber">{item.yearRange}</p>
              <p className="font-display font-medium">{item.title}</p>
              <p className="font-body text-sm text-graphite/70">{item.organisation}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (!confirm("Delete this entry?")) return;
                  await apiFetch(`/timeline/admin/${item.id}`, { method: "DELETE" });
                  setItems((prev) => prev.filter((i) => i.id !== item.id));
                })();
              }}
              className="font-mono text-xs uppercase text-graphite/50"
            >
              Delete
            </button>
          </div>
        )}
      />

      <form
        className="space-y-4 border-t border-mist pt-8 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            await apiFetch("/timeline/admin", {
              method: "POST",
              body: JSON.stringify({
                yearRange: form.yearRange,
                title: form.title,
                organisation: form.organisation,
                description: form.description,
                sector: form.sector || null,
              }),
            });
            setForm(emptyForm);
            await load();
          })();
        }}
      >
        <h2 className="font-display text-xl font-medium">Add entry</h2>
        {(
          [
            ["yearRange", "Year range"],
            ["title", "Title"],
            ["organisation", "Organisation"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block space-y-1">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
              {label}
            </span>
            <input
              required
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
        ))}
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Description
          </span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Sector</span>
          <select
            value={form.sector}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sector: e.target.value as typeof form.sector,
              }))
            }
            className="w-full border border-mist bg-fog px-3 py-2"
          >
            <option value="">None</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-steel text-fog px-4 py-2 font-mono text-xs uppercase tracking-[0.12em]"
        >
          Add
        </button>
      </form>

      {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}
    </div>
  );
}
