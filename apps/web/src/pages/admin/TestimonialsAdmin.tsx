import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../lib/api-client";
import type { Testimonial } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

const emptyForm = {
  authorName: "",
  authorRole: "",
  company: "",
  quote: "",
};

export function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await apiFetch<Testimonial[]>("/testimonials/admin"));
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    });
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await apiFetch("/testimonials/admin", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await apiFetch(`/testimonials/admin/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Testimonials</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
          Drag to reorder
        </p>
      </div>

      <ReorderableList
        items={items}
        emptyMessage="No testimonials yet."
        onReorder={async (next) => {
          setItems(next);
          await apiFetch("/testimonials/admin/reorder", {
            method: "PUT",
            body: JSON.stringify({ ids: next.map((i) => i.id) }),
          });
        }}
        renderItem={(item) => (
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-body">“{item.quote.slice(0, 120)}{item.quote.length > 120 ? "…" : ""}”</p>
              <p className="mt-1 font-mono text-xs text-graphite/55">
                {item.authorName} · {item.company}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDelete(item.id)}
              className="font-mono text-xs uppercase text-graphite/50"
            >
              Delete
            </button>
          </div>
        )}
      />

      <form onSubmit={handleCreate} className="space-y-4 border-t border-mist pt-8 max-w-xl">
        <h2 className="font-display text-xl font-medium">Add testimonial</h2>
        {(["authorName", "authorRole", "company"] as const).map((key) => (
          <label key={key} className="block space-y-1">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
              {key}
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
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Quote</span>
          <textarea
            required
            rows={4}
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
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
