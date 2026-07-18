import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";
import type { CaseStudy } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

export function AdminCaseStudiesListPage() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await apiFetch<CaseStudy[]>("/case-studies/admin");
    setItems(rows);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    });
  }, [load]);

  async function handleReorder(next: CaseStudy[]) {
    setItems(next);
    await apiFetch("/case-studies/admin/reorder", {
      method: "PUT",
      body: JSON.stringify({ ids: next.map((i) => i.id) }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this case study?")) return;
    await apiFetch(`/case-studies/admin/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Case studies</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
            Drag to reorder
          </p>
        </div>
        <Link
          to="/admin/case-studies/new"
          className="bg-steel text-fog px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] no-underline"
        >
          New
        </Link>
      </div>

      <ReorderableList
        items={items}
        onReorder={handleReorder}
        emptyMessage="No case studies yet. Create the first one."
        renderItem={(item) => (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                to={`/admin/case-studies/${item.id}`}
                className="font-display text-lg font-medium no-underline hover:text-steel"
              >
                {item.title}
              </Link>
              <p className="mt-1 font-mono text-xs text-graphite/55">
                <span className="capitalize">{item.sector}</span>
                <span className="text-mist mx-2">·</span>
                {item.published ? (
                  <span className="text-amber">Published</span>
                ) : (
                  <span>Draft</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDelete(item.id)}
              className="font-mono text-xs uppercase tracking-[0.1em] text-graphite/50"
            >
              Delete
            </button>
          </div>
        )}
      />

      {error ? <p className="mt-6 font-mono text-sm text-amber">{error}</p> : null}
    </div>
  );
}
