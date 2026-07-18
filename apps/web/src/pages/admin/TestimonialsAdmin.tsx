import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../lib/api-client";
import type { CaseStudy, Testimonial } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

type FormState = {
  authorName: string;
  authorRole: string;
  company: string;
  quote: string;
  caseStudyId: string;
};

const emptyForm: FormState = {
  authorName: "",
  authorRole: "",
  company: "",
  quote: "",
  caseStudyId: "",
};

export function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [rows, caseRows] = await Promise.all([
      apiFetch<Testimonial[]>("/testimonials/admin"),
      apiFetch<CaseStudy[]>("/case-studies/admin"),
    ]);
    setItems(rows);
    setCases(caseRows);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    });
  }, [load]);

  function startEdit(item: Testimonial) {
    setEditingId(item.id);
    setForm({
      authorName: item.authorName,
      authorRole: item.authorRole,
      company: item.company,
      quote: item.quote,
      caseStudyId: item.caseStudyId ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body = {
      authorName: form.authorName,
      authorRole: form.authorRole,
      company: form.company,
      quote: form.quote,
      caseStudyId: form.caseStudyId || null,
    };
    try {
      if (editingId) {
        await apiFetch(`/testimonials/admin/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setToast("Testimonial updated");
      } else {
        await apiFetch("/testimonials/admin", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setToast("Testimonial added");
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await apiFetch(`/testimonials/admin/${id}`, { method: "DELETE" });
      if (editingId === id) cancelEdit();
      setItems((prev) => prev.filter((i) => i.id !== id));
      setToast("Deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const caseTitle = (id: string | null) =>
    id ? cases.find((c) => c.id === id)?.title ?? "Linked case" : null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Testimonials</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
          Drag to reorder · edit inline
        </p>
      </div>

      {toast ? (
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-steel" role="status">
          {toast}
        </p>
      ) : null}

      <ReorderableList
        items={items}
        emptyMessage="No testimonials yet. Add the first quote below."
        onReorder={async (next) => {
          setItems(next);
          await apiFetch("/testimonials/admin/reorder", {
            method: "PUT",
            body: JSON.stringify({ ids: next.map((i) => i.id) }),
          });
        }}
        renderItem={(item) => (
          <div className="flex justify-between gap-3">
            <div className="min-w-0">
              <p className="font-body">
                “{item.quote.slice(0, 120)}
                {item.quote.length > 120 ? "…" : ""}”
              </p>
              <p className="mt-1 font-mono text-xs text-graphite/55">
                {item.authorName} · {item.company}
                {caseTitle(item.caseStudyId) ? (
                  <>
                    <span className="text-mist mx-2">·</span>
                    <span className="text-amber">{caseTitle(item.caseStudyId)}</span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="font-mono text-xs uppercase text-steel"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(item.id)}
                className="font-mono text-xs uppercase text-graphite/50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      />

      <form onSubmit={handleSubmit} className="space-y-4 border-t border-mist pt-8 max-w-xl">
        <h2 className="font-display text-xl font-medium">
          {editingId ? "Edit testimonial" : "Add testimonial"}
        </h2>
        {(["authorName", "authorRole", "company"] as const).map((key) => (
          <label key={key} className="block space-y-1">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
              {key === "authorName"
                ? "Author"
                : key === "authorRole"
                  ? "Role"
                  : "Company"}
            </span>
            <input
              required
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-mist bg-fog px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
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
            className="w-full border border-mist bg-fog px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Case study (optional)
          </span>
          <select
            value={form.caseStudyId}
            onChange={(e) => setForm((f) => ({ ...f, caseStudyId: e.target.value }))}
            className="w-full border border-mist bg-fog px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
          >
            <option value="">None</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="bg-steel text-fog px-4 py-2 font-mono text-xs uppercase tracking-[0.12em]"
          >
            {editingId ? "Save" : "Add"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="border border-mist px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-graphite/60"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}
    </div>
  );
}
