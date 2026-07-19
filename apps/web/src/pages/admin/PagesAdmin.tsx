import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  blockTypes,
  pageKeys,
  type BlockType,
  type PageKey,
} from "@baseer-portfolio/shared";
import { apiFetch } from "../../lib/api-client";
import type { CmsPage, PageBlock } from "../../lib/types";
import { ReorderableList } from "../../components/admin/ReorderableList";

const PAGE_LABELS: Record<PageKey, string> = {
  home: "Home",
  about: "About",
  contact: "Contact",
  work: "Work template",
  "sector:automotive": "Sector — Automotive",
  "sector:charity": "Sector — Charity",
  "sector:education": "Sector — Education",
};

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero",
  spec_strip: "Spec strip",
  sector_grid: "Sector grid",
  featured_work: "Featured work",
  testimonial: "Testimonial",
  timeline: "Timeline",
  skills: "Skills",
  rich_text: "Rich text",
  cta_band: "CTA band",
  contact_card: "Contact card",
  cv_button: "CV button",
  gallery_highlight: "Gallery highlight",
};

function defaultConfig(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return {
        showBrand: true,
        headlineSource: "settings",
        subheadSource: "settings",
        ctas: [],
      };
    case "spec_strip":
      return { source: "career", metrics: [] };
    case "sector_grid":
      return {
        title: "Sectors",
        sectorSlugs: ["automotive", "charity", "education"],
        blurbOverrides: {},
      };
    case "featured_work":
      return { title: "Selected work", caseStudyIds: [], limit: 3 };
    case "testimonial":
      return { mode: "first", testimonialIds: [], limit: 1 };
    case "timeline":
      return { title: "Timeline" };
    case "skills":
      return { title: "Skills" };
    case "rich_text":
      return { source: "custom", markdown: "", title: "" };
    case "cta_band":
      return { headline: "", body: "", ctas: [] };
    case "contact_card":
      return { showEmail: true, showSocials: true, intro: "" };
    case "cv_button":
      return { label: "Download CV" };
    case "gallery_highlight":
      return { title: "Gallery", imageKeys: [] };
    default:
      return {};
  }
}

function previewPath(key: PageKey): string {
  if (key === "home") return "/";
  if (key === "about") return "/about";
  if (key === "contact") return "/contact";
  if (key === "work") return "/automotive";
  if (key.startsWith("sector:")) return `/${key.slice("sector:".length)}`;
  return "/";
}

export function AdminPagesListPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Pages</h1>
      <p className="font-body text-graphite/70 mb-8 measure">
        Compose each page from reorderable sections. Changes publish immediately.
      </p>
      <ul className="divide-y divide-mist max-w-xl">
        {pageKeys.map((key) => (
          <li key={key} className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg">{PAGE_LABELS[key]}</p>
              <p className="font-mono text-xs text-graphite/50">{key}</p>
            </div>
            <Link
              to={`/admin/pages/${encodeURIComponent(key)}`}
              className="font-mono text-xs uppercase tracking-[0.12em] text-steel"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminPageEditorPage() {
  const { key: rawKey } = useParams<{ key: string }>();
  const pageKey = decodeURIComponent(rawKey ?? "") as PageKey;
  const [page, setPage] = useState<CmsPage | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addType, setAddType] = useState<BlockType>("hero");

  const valid = useMemo(
    () => (pageKeys as readonly string[]).includes(pageKey),
    [pageKey],
  );

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    void (async () => {
      try {
        const row = await apiFetch<CmsPage>(
          `/pages/admin/${encodeURIComponent(pageKey)}`,
        );
        if (cancelled) return;
        setPage(row);
        setBlocks(row.blocks);
        setSelectedId(row.blocks[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageKey, valid]);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  async function save(nextBlocks: PageBlock[], published = page?.published ?? true) {
    setBusy(true);
    setError(null);
    try {
      const savedPage = await apiFetch<CmsPage>(
        `/pages/admin/${encodeURIComponent(pageKey)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: page?.title ?? PAGE_LABELS[pageKey],
            published,
            blocks: nextBlocks.map((b, i) => ({
              id: b.id.startsWith("tmp-") ? undefined : b.id,
              type: b.type,
              config: b.config,
              enabled: b.enabled,
              displayOrder: i,
            })),
          }),
        },
      );
      setPage(savedPage);
      setBlocks(savedPage.blocks);
      if (selectedId?.startsWith("tmp-")) {
        setSelectedId(savedPage.blocks[nextBlocks.findIndex((b) => b.id === selectedId)]?.id ?? null);
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!valid) {
    return <p className="font-mono text-sm text-amber">Unknown page key.</p>;
  }

  if (!page) {
    return (
      <p className="font-mono text-sm text-graphite/60">{error ?? "Loading…"}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-steel mb-2">
            <Link to="/admin/pages" className="hover:underline">
              Pages
            </Link>
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {PAGE_LABELS[pageKey]}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={previewPath(pageKey)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs uppercase tracking-[0.12em] text-steel border border-mist px-3 py-2"
          >
            Preview
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save(blocks)}
            className="bg-steel text-fog px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save page"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as BlockType)}
              className="flex-1 border border-mist bg-fog px-2 py-1.5 text-sm"
            >
              {blockTypes.map((t) => (
                <option key={t} value={t}>
                  {BLOCK_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="font-mono text-xs uppercase text-steel border border-mist px-2"
              onClick={() => {
                const id = `tmp-${Math.random().toString(36).slice(2, 9)}`;
                const next: PageBlock[] = [
                  ...blocks,
                  {
                    id,
                    ownerId: "",
                    pageId: page.id ?? "",
                    type: addType,
                    config: defaultConfig(addType),
                    displayOrder: blocks.length,
                    enabled: true,
                  },
                ];
                setBlocks(next);
                setSelectedId(id);
              }}
            >
              Add
            </button>
          </div>

          {blocks.length === 0 ? (
            <p className="font-body text-sm text-graphite/60 border border-dashed border-mist p-4">
              No sections yet. Add a block to start building this page.
            </p>
          ) : (
            <ReorderableList
              items={blocks}
              onReorder={(items) => {
                setBlocks(items);
                void save(items);
              }}
              renderItem={(item) => (
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left px-2 py-1 ${
                    selectedId === item.id ? "bg-mist/50" : ""
                  }`}
                >
                  <span className="font-mono text-xs uppercase tracking-[0.1em]">
                    {BLOCK_LABELS[item.type as BlockType] ?? item.type}
                  </span>
                  {!item.enabled ? (
                    <span className="ml-2 font-mono text-[10px] text-amber">off</span>
                  ) : null}
                </button>
              )}
            />
          )}
        </div>

        <div className="border border-mist p-5 min-h-[16rem]">
          {!selected ? (
            <p className="font-body text-graphite/60">Select a section to edit.</p>
          ) : (
            <BlockConfigForm
              block={selected}
              onChange={(next) => {
                setBlocks((prev) =>
                  prev.map((b) => (b.id === selected.id ? next : b)),
                );
              }}
              onDelete={() => {
                const next = blocks.filter((b) => b.id !== selected.id);
                setBlocks(next);
                setSelectedId(next[0]?.id ?? null);
                void save(next);
              }}
            />
          )}
        </div>
      </div>

      {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}
      {saved ? <p className="font-mono text-xs text-steel">Saved</p> : null}
    </div>
  );
}

function BlockConfigForm({
  block,
  onChange,
  onDelete,
}: {
  block: PageBlock;
  onChange: (b: PageBlock) => void;
  onDelete: () => void;
}) {
  const cfg = block.config;

  function setConfig(patch: Record<string, unknown>) {
    onChange({ ...block, config: { ...cfg, ...patch } });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">
          {BLOCK_LABELS[block.type as BlockType] ?? block.type}
        </h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 font-mono text-xs uppercase">
            <input
              type="checkbox"
              checked={block.enabled !== false}
              onChange={(e) => onChange({ ...block, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <button
            type="button"
            onClick={onDelete}
            className="font-mono text-xs uppercase text-amber"
          >
            Delete
          </button>
        </div>
      </div>

      {block.type === "hero" ? (
        <>
          <label className="flex items-center gap-2 font-mono text-xs uppercase">
            <input
              type="checkbox"
              checked={cfg.showBrand !== false}
              onChange={(e) => setConfig({ showBrand: e.target.checked })}
            />
            Show brand
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Headline source</span>
            <select
              value={(cfg.headlineSource as string) ?? "settings"}
              onChange={(e) => setConfig({ headlineSource: e.target.value })}
              className="w-full border border-mist bg-fog px-3 py-2"
            >
              <option value="settings">Site intro headline</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          {cfg.headlineSource === "custom" ? (
            <label className="block space-y-1">
              <span className="font-mono text-xs text-graphite/60">Headline</span>
              <input
                value={(cfg.headline as string) ?? ""}
                onChange={(e) => setConfig({ headline: e.target.value })}
                className="w-full border border-mist bg-fog px-3 py-2"
              />
            </label>
          ) : null}
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Subhead source</span>
            <select
              value={(cfg.subheadSource as string) ?? "settings"}
              onChange={(e) => setConfig({ subheadSource: e.target.value })}
              className="w-full border border-mist bg-fog px-3 py-2"
            >
              <option value="settings">Site intro subhead</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          {cfg.subheadSource === "custom" ? (
            <label className="block space-y-1">
              <span className="font-mono text-xs text-graphite/60">Subhead</span>
              <textarea
                rows={3}
                value={(cfg.subhead as string) ?? ""}
                onChange={(e) => setConfig({ subhead: e.target.value })}
                className="w-full border border-mist bg-fog px-3 py-2"
              />
            </label>
          ) : null}
          <CtaEditor
            value={(cfg.ctas as { label: string; href: string; variant?: string }[]) ?? []}
            onChange={(ctas) => setConfig({ ctas })}
          />
        </>
      ) : null}

      {block.type === "spec_strip" ? (
        <label className="block space-y-1">
          <span className="font-mono text-xs text-graphite/60">Source</span>
          <select
            value={(cfg.source as string) ?? "career"}
            onChange={(e) => setConfig({ source: e.target.value })}
            className="w-full border border-mist bg-fog px-3 py-2"
          >
            <option value="career">Career metrics</option>
            <option value="custom">Custom metrics (JSON)</option>
          </select>
        </label>
      ) : null}

      {block.type === "sector_grid" ||
      block.type === "featured_work" ||
      block.type === "timeline" ||
      block.type === "skills" ||
      block.type === "gallery_highlight" ||
      block.type === "cta_band" ? (
        <label className="block space-y-1">
          <span className="font-mono text-xs text-graphite/60">Title</span>
          <input
            value={(cfg.title as string) ?? (cfg.headline as string) ?? ""}
            onChange={(e) =>
              setConfig(
                block.type === "cta_band"
                  ? { headline: e.target.value }
                  : { title: e.target.value },
              )
            }
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>
      ) : null}

      {block.type === "featured_work" ? (
        <label className="block space-y-1">
          <span className="font-mono text-xs text-graphite/60">Limit</span>
          <input
            type="number"
            min={1}
            max={12}
            value={(cfg.limit as number) ?? 3}
            onChange={(e) => setConfig({ limit: Number(e.target.value) })}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>
      ) : null}

      {block.type === "testimonial" ? (
        <>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Mode</span>
            <select
              value={(cfg.mode as string) ?? "first"}
              onChange={(e) => setConfig({ mode: e.target.value })}
              className="w-full border border-mist bg-fog px-3 py-2"
            >
              <option value="first">First in list</option>
              <option value="ids">Specific IDs</option>
              <option value="random">Random</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Limit</span>
            <input
              type="number"
              min={1}
              max={6}
              value={(cfg.limit as number) ?? 1}
              onChange={(e) => setConfig({ limit: Number(e.target.value) })}
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
          {cfg.mode === "ids" ? (
            <label className="block space-y-1">
              <span className="font-mono text-xs text-graphite/60">
                Testimonial IDs (comma-separated)
              </span>
              <input
                value={((cfg.testimonialIds as string[]) ?? []).join(", ")}
                onChange={(e) =>
                  setConfig({
                    testimonialIds: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full border border-mist bg-fog px-3 py-2 font-mono text-sm"
              />
            </label>
          ) : null}
        </>
      ) : null}

      {block.type === "rich_text" ? (
        <>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Source</span>
            <select
              value={(cfg.source as string) ?? "custom"}
              onChange={(e) => setConfig({ source: e.target.value })}
              className="w-full border border-mist bg-fog px-3 py-2"
            >
              <option value="custom">Custom markdown</option>
              <option value="about_bio">About bio from Site</option>
            </select>
          </label>
          {cfg.source !== "about_bio" ? (
            <label className="block space-y-1">
              <span className="font-mono text-xs text-graphite/60">Markdown</span>
              <textarea
                rows={10}
                value={(cfg.markdown as string) ?? ""}
                onChange={(e) => setConfig({ markdown: e.target.value })}
                className="w-full border border-mist bg-fog px-3 py-2 font-mono text-sm"
              />
            </label>
          ) : null}
        </>
      ) : null}

      {block.type === "cta_band" ? (
        <>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Body</span>
            <textarea
              rows={3}
              value={(cfg.body as string) ?? ""}
              onChange={(e) => setConfig({ body: e.target.value })}
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
          <CtaEditor
            value={(cfg.ctas as { label: string; href: string; variant?: string }[]) ?? []}
            onChange={(ctas) => setConfig({ ctas })}
          />
        </>
      ) : null}

      {block.type === "contact_card" ? (
        <>
          <label className="flex items-center gap-2 font-mono text-xs uppercase">
            <input
              type="checkbox"
              checked={cfg.showEmail !== false}
              onChange={(e) => setConfig({ showEmail: e.target.checked })}
            />
            Show email
          </label>
          <label className="flex items-center gap-2 font-mono text-xs uppercase">
            <input
              type="checkbox"
              checked={cfg.showSocials !== false}
              onChange={(e) => setConfig({ showSocials: e.target.checked })}
            />
            Show socials
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs text-graphite/60">Intro</span>
            <textarea
              rows={3}
              value={(cfg.intro as string) ?? ""}
              onChange={(e) => setConfig({ intro: e.target.value })}
              className="w-full border border-mist bg-fog px-3 py-2"
            />
          </label>
        </>
      ) : null}

      {block.type === "cv_button" ? (
        <label className="block space-y-1">
          <span className="font-mono text-xs text-graphite/60">Button label</span>
          <input
            value={(cfg.label as string) ?? "Download CV"}
            onChange={(e) => setConfig({ label: e.target.value })}
            className="w-full border border-mist bg-fog px-3 py-2"
          />
        </label>
      ) : null}

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite/45">
        Click Save page when finished editing this section.
      </p>
    </div>
  );
}

function CtaEditor({
  value,
  onChange,
}: {
  value: { label: string; href: string; variant?: string }[];
  onChange: (v: { label: string; href: string; variant?: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-graphite/60">CTAs</span>
        <button
          type="button"
          className="font-mono text-xs uppercase text-steel"
          onClick={() =>
            onChange([...value, { label: "Learn more", href: "/", variant: "primary" }])
          }
        >
          Add CTA
        </button>
      </div>
      {value.map((cta, i) => (
        <div key={i} className="grid gap-2 md:grid-cols-3">
          <input
            value={cta.label}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...cta, label: e.target.value };
              onChange(next);
            }}
            className="border border-mist bg-fog px-2 py-1.5 text-sm"
            placeholder="Label"
          />
          <input
            value={cta.href}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...cta, href: e.target.value };
              onChange(next);
            }}
            className="border border-mist bg-fog px-2 py-1.5 font-mono text-sm"
            placeholder="/path"
          />
          <button
            type="button"
            className="font-mono text-[10px] uppercase text-amber text-left"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
