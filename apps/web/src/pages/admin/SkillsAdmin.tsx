import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";
import type { Skill } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

export function AdminSkillsPage() {
  const [items, setItems] = useState<Skill[]>([]);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await apiFetch<Skill[]>("/skills/admin"));
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    });
  }, [load]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Skills</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
          Drag to reorder
        </p>
      </div>

      <ReorderableList
        items={items}
        emptyMessage="No skills yet."
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
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (!confirm("Delete this skill?")) return;
                  await apiFetch(`/skills/admin/${item.id}`, { method: "DELETE" });
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
            await apiFetch("/skills/admin", {
              method: "POST",
              body: JSON.stringify({ category, name }),
            });
            setCategory("");
            setName("");
            await load();
          })();
        }}
      >
        <h2 className="font-display text-xl font-medium">Add skill</h2>
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Category
          </span>
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
