import { useState, type FormEvent } from "react";
import {
  caseStudyInputSchema,
  sectors,
  slugify,
  type CaseStudyInput,
  type SpecMetric,
} from "@baseer-portfolio/shared";
import { MarkdownEditor } from "./MarkdownEditor";
import { ImageUploader } from "./ImageUploader";

type CaseStudyFormProps = {
  initial?: Partial<CaseStudyInput>;
  submitLabel?: string;
  onSubmit: (data: CaseStudyInput) => Promise<void>;
};

const empty: CaseStudyInput = {
  sector: "automotive",
  title: "",
  slug: "",
  dek: "",
  heroImageKey: null,
  challenge: "",
  strategy: "",
  execution: "",
  results: "",
  specMetrics: [],
  published: false,
  showChallenge: true,
  showStrategy: true,
  showExecution: true,
  showResults: true,
  showGallery: true,
};

export function CaseStudyForm({
  initial,
  submitLabel = "Save",
  onSubmit,
}: CaseStudyFormProps) {
  const [form, setForm] = useState<CaseStudyInput>({ ...empty, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  function update<K extends keyof CaseStudyInput>(key: K, value: CaseStudyInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateMetric(index: number, patch: Partial<SpecMetric>) {
    setForm((prev) => ({
      ...prev,
      specMetrics: prev.specMetrics.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = caseStudyInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
            Sector
          </span>
          <select
            value={form.sector}
            onChange={(e) => update("sector", e.target.value as CaseStudyInput["sector"])}
            className="w-full border border-mist bg-fog px-3 py-2 font-body"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => update("published", e.target.checked)}
          />
          <span className="font-mono text-xs uppercase tracking-[0.12em]">Published</span>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Title</span>
        <input
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            update("title", title);
            if (!slugTouched) update("slug", slugify(title));
          }}
          className="w-full border border-mist bg-fog px-3 py-2 font-display text-lg"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Slug</span>
        <input
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update("slug", e.target.value);
          }}
          className="w-full border border-mist bg-fog px-3 py-2 font-mono text-sm"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Dek</span>
        <textarea
          value={form.dek}
          onChange={(e) => update("dek", e.target.value)}
          rows={2}
          className="w-full border border-mist bg-fog px-3 py-2 font-body"
          required
        />
      </label>

      <ImageUploader
        value={form.heroImageKey ?? null}
        onUploaded={(key) => update("heroImageKey", key)}
        onClear={() => update("heroImageKey", null)}
      />

      <fieldset className="space-y-3">
        <legend className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
          Section visibility
        </legend>
        {(
          [
            ["showChallenge", "Challenge"],
            ["showStrategy", "Strategy"],
            ["showExecution", "Execution"],
            ["showResults", "Results"],
            ["showGallery", "Gallery"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 font-mono text-xs uppercase">
            <input
              type="checkbox"
              checked={form[key] !== false}
              onChange={(e) => update(key, e.target.checked)}
            />
            Show {label}
          </label>
        ))}
      </fieldset>

      <MarkdownEditor
        label="Challenge"
        value={form.challenge}
        onChange={(v) => update("challenge", v)}
      />
      <MarkdownEditor
        label="Strategy"
        value={form.strategy}
        onChange={(v) => update("strategy", v)}
      />
      <MarkdownEditor
        label="Execution"
        value={form.execution}
        onChange={(v) => update("execution", v)}
      />
      <MarkdownEditor
        label="Results"
        value={form.results}
        onChange={(v) => update("results", v)}
      />

      <fieldset className="space-y-3">
        <legend className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
          Spec metrics
        </legend>
        {form.specMetrics.map((metric, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={metric.label}
              placeholder="LABEL"
              onChange={(e) => updateMetric(index, { label: e.target.value })}
              className="border border-mist bg-fog px-3 py-2 font-mono text-sm"
            />
            <input
              value={metric.value}
              placeholder="value"
              onChange={(e) => updateMetric(index, { value: e.target.value })}
              className="border border-mist bg-fog px-3 py-2 font-mono text-sm"
            />
            <button
              type="button"
              className="font-mono text-xs uppercase text-graphite/60"
              onClick={() =>
                update(
                  "specMetrics",
                  form.specMetrics.filter((_, i) => i !== index),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="font-mono text-xs uppercase tracking-[0.1em] text-steel underline"
          onClick={() =>
            update("specMetrics", [...form.specMetrics, { label: "", value: "" }])
          }
        >
          Add metric
        </button>
      </fieldset>

      {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="bg-steel text-fog px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] disabled:opacity-50"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
