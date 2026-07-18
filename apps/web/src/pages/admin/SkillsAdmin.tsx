import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../lib/api-client";
import type { Skill } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

export function AdminSkillsPage() {
  const [items, setItems] = useState<Skill[]>([]);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await apiFetch<Skill[]>("/skills/admin"));
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    });
  }, [load]);

  function startEdit(item: Skill) {
    setEditingId(item.id);
    setCategory(item.category);
    setName(item.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setCategory("");
    setName("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await apiFetch(`/skills/admin/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ category, name }),
        });
        setToast("Skill updated");
      } else {
        await apiFetch("/skills/admin", {
          method: "POST",
          body: JSON.stringify({ category, name }),
        });
        setToast("Skill added");
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Skills</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
          Drag to reorder · edit in place
        </p>
      </div>

      {toast ? (
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-steel" role="status">
          {toast}
        </p>
      ) : null}

      <ReorderableList
        items={items}
        emptyMessage="No skills yet. Add the first capability below."
        onReorder={async (next) => {
          setItems(next);
          await apiFetch("/skills/admin/reorder", {
            method: "PUT",
            body: JSON.stringify({ ids: next.map((i) => i.id) }),
          });
        }}
        renderItem={(item) => (
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-display font-medium">{item.name}</p>
              <p className="font-mono text-xs text-graphite/55">{item.category}</p>
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
                onClick={() => {
                  void (async () => {
                    if (!confirm("Delete this skill?")) return;
                    try {
                      await apiFetch(`/skills/admin/${item.id}`, { method: "DELETE" });
                      if (editingId === item.id) cancelEdit();
                      setItems((prev) => prev.filter((i) => i.id !== item.id));
                      setToast("Deleted");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Delete failed");
                    }
                  })();
                }}
                className="font-mono text-xs uppercase text-graphite/50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      />

      <form className="space-y-4 border-t border-mist pt-8 max-w-xl" onSubmit={handleSubmit}>
        <h2 className="font-display text-xl font-medium">
          {editingId ? "Edit skill" : "Add skill"}
        </h2>
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Category
          </span>
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-mist bg-fog px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-mist bg-fog px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
          />
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
