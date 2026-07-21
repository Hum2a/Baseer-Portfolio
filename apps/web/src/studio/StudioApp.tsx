import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createEmptyPageTree,
  newNodeId,
  type Breakpoint,
  type DocumentNode,
  type DocumentTree,
  type NodeType,
} from "@baseer-portfolio/shared";
import { apiFetch } from "../lib/api-client";
import { DocumentRenderer } from "../render/DocumentRenderer";
import { useSiteSettingsOrFallback } from "../lib/site-settings";
import type {
  CaseStudy,
  SectorRecord,
  Skill,
  Testimonial,
  TimelineEntry,
} from "../lib/types";
type DocRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  locale: string;
  status: string;
  draftRevisionId: string | null;
  publishedRevisionId: string | null;
};

type EditorPayload = {
  document: DocRow;
  draft: { id: string; tree: DocumentTree } | null;
  revisions: { id: string; label: string; createdAt: string }[];
};

const ADDABLE: { type: NodeType; label: string; tip: string }[] = [
  { type: "stack", label: "Stack", tip: "Vertical or horizontal flex container." },
  { type: "grid", label: "Grid", tip: "CSS grid container for multi-column layouts." },
  { type: "frame", label: "Frame", tip: "Generic frame; supports absolute children." },
  { type: "text", label: "Text", tip: "Heading or body copy. Supports bindings like {{siteName}}." },
  { type: "button", label: "Button", tip: "Link styled as a button." },
  { type: "image", label: "Image", tip: "Image from the media library (srcKey)." },
  { type: "video", label: "Video", tip: "R2 video or embed URL (YouTube/Vimeo)." },
  { type: "component", label: "Component", tip: "Data-bound portfolio block (metrics, cases, etc.)." },
  { type: "embed", label: "Embed/HTML", tip: "Owner HTML/embed. Use carefully." },
  { type: "form", label: "Form", tip: "Links to a form id for Resend submissions." },
  { type: "shape", label: "Shape", tip: "Decorative rectangle/shape." },
];

function walk(
  node: DocumentNode,
  fn: (n: DocumentNode, parent: DocumentNode | null) => void,
  parent: DocumentNode | null = null,
) {
  fn(node, parent);
  for (const child of node.children ?? []) walk(child, fn, node);
}

function findNode(root: DocumentNode, id: string): DocumentNode | null {
  let found: DocumentNode | null = null;
  walk(root, (n) => {
    if (n.id === id) found = n;
  });
  return found;
}

function updateNode(
  root: DocumentNode,
  id: string,
  patch: Partial<DocumentNode>,
): DocumentNode {
  if (root.id === id) return { ...root, ...patch };
  return {
    ...root,
    children: (root.children ?? []).map((c) => updateNode(c, id, patch)),
  };
}

function removeNode(root: DocumentNode, id: string): DocumentNode {
  return {
    ...root,
    children: (root.children ?? [])
      .filter((c) => c.id !== id)
      .map((c) => removeNode(c, id)),
  };
}

function addChild(root: DocumentNode, parentId: string, child: DocumentNode): DocumentNode {
  if (root.id === parentId) {
    return { ...root, children: [...(root.children ?? []), child] };
  }
  return {
    ...root,
    children: (root.children ?? []).map((c) => addChild(c, parentId, child)),
  };
}

function defaultChild(type: NodeType): DocumentNode {
  const id = newNodeId(type);
  switch (type) {
    case "text":
      return {
        id,
        type,
        name: "Text",
        props: { tag: "p", text: "New text" },
        layout: { mode: "flow", display: "block" },
      };
    case "button":
      return {
        id,
        type,
        name: "Button",
        props: { label: "Click", href: "/", variant: "primary" },
      };
    case "image":
      return {
        id,
        type,
        name: "Image",
        props: { srcKey: "", alt: "" },
        layout: { mode: "flow", display: "block", width: "100%" },
      };
    case "component":
      return {
        id,
        type,
        name: "Component",
        props: { component: "career_metrics" },
      };
    case "grid":
      return {
        id,
        type,
        name: "Grid",
        layout: {
          mode: "flow",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        },
        children: [],
      };
    case "frame":
      return {
        id,
        type,
        name: "Frame",
        layout: {
          mode: "absolute",
          display: "block",
          width: "100%",
          height: "240px",
        },
        children: [],
      };
    default:
      return {
        id,
        type,
        name: type,
        layout: { mode: "flow", display: "flex", flexDirection: "column", gap: "1rem" },
        children: [],
      };
  }
}

function LayerItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: DocumentNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`w-full text-left px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] ${
          selectedId === node.id ? "bg-mist/50 text-steel" : "hover:bg-mist/30"
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {node.name || node.type}
      </button>
      {(node.children ?? []).map((c) => (
        <LayerItem
          key={c.id}
          node={c}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export function StudioApp() {
  const settings = useSiteSettingsOrFallback();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tree, setTree] = useState<DocumentTree | null>(null);
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [history, setHistory] = useState<DocumentTree[]>([]);
  const [future, setFuture] = useState<DocumentTree[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addType, setAddType] = useState<NodeType>("text");
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sectors, setSectors] = useState<SectorRecord[]>([]);
  const [locale, setLocale] = useState("en");
  const [designOpen, setDesignOpen] = useState(false);
  const [tokensJson, setTokensJson] = useState("{}");
  const [headHtml, setHeadHtml] = useState("");
  const [aiKeys, setAiKeys] = useState({ openai: "", anthropic: "", google: "" });
  const [aiPrompt, setAiPrompt] = useState("");

  const activeDoc = docs.find((d) => d.id === activeId) ?? null;
  const selected = tree && selectedId ? findNode(tree.root, selectedId) : null;

  const pushHistory = useCallback(
    (next: DocumentTree) => {
      if (tree) setHistory((h) => [...h.slice(-49), tree]);
      setFuture([]);
      setTree(next);
    },
    [tree],
  );

  const loadDocs = useCallback(async () => {
    const rows = await apiFetch<DocRow[]>("/documents/admin");
    setDocs(rows);
    if (!activeId && rows[0]) setActiveId(rows[0].id);
  }, [activeId]);

  useEffect(() => {
    void loadDocs().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : "Failed to load documents"),
    );
    void Promise.all([
      apiFetch<CaseStudy[]>("/case-studies/public"),
      apiFetch<Testimonial[]>("/testimonials/public"),
      apiFetch<TimelineEntry[]>("/timeline/public"),
      apiFetch<Skill[]>("/skills/public"),
      apiFetch<SectorRecord[]>("/sectors/public"),
    ]).then(([cs, tm, tl, sk, sec]) => {
      setStudies(cs);
      setTestimonials(tm);
      setTimeline(tl);
      setSkills(sk);
      setSectors(sec);
    });
    void apiFetch<{ tokens: Record<string, unknown> }>("/design-system/admin")
      .then((r) => setTokensJson(JSON.stringify(r.tokens ?? {}, null, 2)))
      .catch(() => undefined);
    void apiFetch<{ headHtml: string; aiKeys: Record<string, string> }>(
      "/integrations/admin",
    )
      .then((r) => {
        setHeadHtml(r.headHtml ?? "");
        setAiKeys({
          openai: r.aiKeys?.openai ? "••••saved" : "",
          anthropic: r.aiKeys?.anthropic ? "••••saved" : "",
          google: r.aiKeys?.google ? "••••saved" : "",
        });
      })
      .catch(() => undefined);
  }, [loadDocs]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void (async () => {
      try {
        const payload = await apiFetch<EditorPayload>(`/documents/admin/${activeId}`);
        if (cancelled) return;
        setTree(payload.draft?.tree ?? createEmptyPageTree(payload.document.title));
        setRevisionId(payload.draft?.id ?? null);
        setSelectedId(payload.draft?.tree.root.id ?? null);
        setHistory([]);
        setFuture([]);
        setLocale(payload.document.locale);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to open document");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function saveDraft() {
    if (!activeDoc || !tree) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{
        conflict?: boolean;
        revision?: { id: string };
        document?: DocRow;
      }>(`/documents/admin/${activeDoc.id}`, {
        method: "PUT",
        body: JSON.stringify({
          slug: activeDoc.slug,
          title: activeDoc.title,
          kind: activeDoc.kind,
          locale,
          tree,
          expectedRevisionId: revisionId,
          label: "Studio save",
        }),
      });
      if (res.conflict) {
        setError("Someone else saved this page. Reload before editing further.");
        return;
      }
      setRevisionId(res.revision?.id ?? null);
      setStatus("Draft saved");
      window.setTimeout(() => setStatus(null), 2000);
      await loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!activeDoc) return;
    await saveDraft();
    setBusy(true);
    try {
      await apiFetch(`/documents/admin/${activeDoc.id}/publish`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setStatus("Published");
      window.setTimeout(() => setStatus(null), 2000);
      await loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function createPage() {
    const title = window.prompt("Page title?", "New page");
    if (!title) return;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const created = await apiFetch<{ document: DocRow }>("/documents/admin", {
      method: "POST",
      body: JSON.stringify({
        slug,
        title,
        kind: "page",
        locale: "en",
        tree: createEmptyPageTree(title),
      }),
    });
    await loadDocs();
    setActiveId(created.document.id);
  }

  const canvasWidth =
    breakpoint === "mobile" ? 390 : breakpoint === "tablet" ? 768 : 1200;

  const renderData = useMemo(
    () => ({
      settings,
      studies,
      testimonials,
      timeline,
      skills,
      sectors,
      breakpoint,
      editMode: true,
      selectedId,
      onSelectNode: setSelectedId,
    }),
    [
      settings,
      studies,
      testimonials,
      timeline,
      skills,
      sectors,
      breakpoint,
      selectedId,
    ],
  );

  return (
    <div className="h-screen flex flex-col bg-fog text-graphite">
      <header className="flex flex-wrap items-center gap-3 border-b border-mist px-4 py-2">
        <Link to="/admin" className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
          Admin
        </Link>
        <h1 className="font-display text-lg font-semibold">Studio</h1>
        <div className="flex gap-1 ml-4">
          {(["mobile", "tablet", "desktop"] as Breakpoint[]).map((bp) => (
            <button
              key={bp}
              type="button"
              onClick={() => setBreakpoint(bp)}
              className={`px-2 py-1 font-mono text-[10px] uppercase border ${
                breakpoint === bp ? "border-steel text-steel" : "border-mist"
              }`}
              title={`Preview at ${bp} width. Overrides for this breakpoint edit the selected node’s breakpoint styles.`}
            >
              {bp}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            className="font-mono text-[10px] uppercase border border-mist px-2 py-1"
            disabled={!history.length}
            onClick={() => {
              if (!tree || !history.length) return;
              const prev = history[history.length - 1]!;
              setFuture((f) => [tree, ...f]);
              setHistory((h) => h.slice(0, -1));
              setTree(prev);
            }}
            title="Undo last canvas change"
          >
            Undo
          </button>
          <button
            type="button"
            className="font-mono text-[10px] uppercase border border-mist px-2 py-1"
            disabled={!future.length}
            onClick={() => {
              if (!tree || !future.length) return;
              const next = future[0]!;
              setHistory((h) => [...h, tree]);
              setFuture((f) => f.slice(1));
              setTree(next);
            }}
            title="Redo"
          >
            Redo
          </button>
          <button
            type="button"
            className="font-mono text-[10px] uppercase border border-mist px-2 py-1"
            onClick={() => setDesignOpen((v) => !v)}
            title="Design tokens, head HTML, and AI keys"
          >
            Design / Integrations
          </button>
          {activeDoc ? (
            <a
              href={
                activeDoc.slug === "home"
                  ? `/?preview=${revisionId ?? ""}`
                  : `/${activeDoc.slug}?preview=${revisionId ?? ""}`
              }
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] uppercase border border-mist px-2 py-1"
              title="Open draft preview in a new tab (admin session required)"
            >
              Preview
            </a>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveDraft()}
            className="font-mono text-[10px] uppercase border border-mist px-2 py-1"
            title="Save a new draft revision (optimistic lock)"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void publish()}
            className="font-mono text-[10px] uppercase bg-steel text-fog px-3 py-1"
            title="Publish the current draft to the live site"
          >
            Publish
          </button>
        </div>
      </header>

      {error ? (
        <p className="px-4 py-2 font-mono text-xs text-amber border-b border-mist">{error}</p>
      ) : null}
      {status ? (
        <p className="px-4 py-2 font-mono text-xs text-steel border-b border-mist">{status}</p>
      ) : null}

      <div className="flex-1 min-h-0 grid grid-cols-[14rem_minmax(0,1fr)_18rem]">
        <aside className="border-r border-mist overflow-y-auto">
          <div className="p-3 flex items-center justify-between">
            <FieldTip label="Pages" tip="All routes and chrome canvases (header/footer)." />
            <button
              type="button"
              className="font-mono text-[10px] uppercase text-steel"
              onClick={() => void createPage().catch((e: unknown) => setError(String(e)))}
              title="Create a new page document and route"
            >
              New
            </button>
          </div>
          <ul className="pb-4">
            {docs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(d.id)}
                  className={`w-full text-left px-3 py-2 border-l-2 ${
                    activeId === d.id
                      ? "border-steel bg-mist/40"
                      : "border-transparent hover:bg-mist/20"
                  }`}
                >
                  <span className="block font-display text-sm">{d.title}</span>
                  <span className="font-mono text-[10px] text-graphite/50">
                    {d.slug} · {d.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {tree ? (
            <div className="border-t border-mist">
              <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-steel">
                Layers
              </p>
              <LayerItem
                node={tree.root}
                depth={0}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          ) : null}
        </aside>

        <section className="overflow-auto bg-mist/20 p-6">
          <div
            className="mx-auto bg-fog shadow-[0_0_0_1px_rgb(0_0_0_/0.06)] min-h-[80vh]"
            style={{ width: canvasWidth, maxWidth: "100%" }}
          >
            {tree ? (
              <DocumentRenderer tree={tree} data={renderData} />
            ) : (
              <p className="p-8 font-mono text-sm text-graphite/50">Select a page</p>
            )}
          </div>
        </section>

        <aside className="border-l border-mist overflow-y-auto p-4 space-y-5">
          <div className="flex gap-2">
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as NodeType)}
              className="flex-1 border border-mist bg-fog px-2 py-1 text-sm"
              title="Type of node to insert under the selection (or root)"
            >
              {ADDABLE.map((a) => (
                <option key={a.type} value={a.type}>
                  {a.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="font-mono text-[10px] uppercase text-steel border border-mist px-2"
              title={ADDABLE.find((a) => a.type === addType)?.tip}
              onClick={() => {
                if (!tree) return;
                const parentId = selectedId ?? tree.root.id;
                const child = defaultChild(addType);
                pushHistory({
                  ...tree,
                  root: addChild(tree.root, parentId, child),
                });
                setSelectedId(child.id);
              }}
            >
              Add
            </button>
          </div>

          {selected && tree ? (
            <div className="space-y-3">
              <FieldTip label="Selected" tip="Edit properties for the highlighted layer." />
              <label className="block space-y-1">
                <FieldTip label="Name" tip="Layer label in the left panel." />
                <input
                  value={selected.name ?? ""}
                  onChange={(e) =>
                    pushHistory({
                      ...tree,
                      root: updateNode(tree.root, selected.id, {
                        name: e.target.value,
                      }),
                    })
                  }
                  className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                />
              </label>

              {selected.type === "text" ? (
                <>
                  <label className="block space-y-1">
                    <FieldTip label="Text" tip="Supports {{siteName}}, {{introHeadline}}, etc." />
                    <textarea
                      rows={4}
                      value={String(selected.props?.text ?? "")}
                      onChange={(e) =>
                        pushHistory({
                          ...tree,
                          root: updateNode(tree.root, selected.id, {
                            props: { ...selected.props, text: e.target.value },
                          }),
                        })
                      }
                      className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block space-y-1">
                    <FieldTip label="Tag" tip="Semantic HTML tag for this text node." />
                    <select
                      value={String(selected.props?.tag ?? "p")}
                      onChange={(e) =>
                        pushHistory({
                          ...tree,
                          root: updateNode(tree.root, selected.id, {
                            props: { ...selected.props, tag: e.target.value },
                          }),
                        })
                      }
                      className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                    >
                      {["p", "h1", "h2", "h3", "div"].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              {selected.type === "button" ? (
                <>
                  <label className="block space-y-1">
                    <FieldTip label="Label" tip="Button text." />
                    <input
                      value={String(selected.props?.label ?? "")}
                      onChange={(e) =>
                        pushHistory({
                          ...tree,
                          root: updateNode(tree.root, selected.id, {
                            props: { ...selected.props, label: e.target.value },
                          }),
                        })
                      }
                      className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block space-y-1">
                    <FieldTip label="Href" tip="Internal path or absolute URL." />
                    <input
                      value={String(selected.props?.href ?? "")}
                      onChange={(e) =>
                        pushHistory({
                          ...tree,
                          root: updateNode(tree.root, selected.id, {
                            props: { ...selected.props, href: e.target.value },
                          }),
                        })
                      }
                      className="w-full border border-mist bg-fog px-2 py-1.5 font-mono text-sm"
                    />
                  </label>
                </>
              ) : null}

              {selected.type === "component" ? (
                <label className="block space-y-1">
                  <FieldTip
                    label="Component"
                    tip="Data-bound block fed by case studies, testimonials, etc."
                  />
                  <select
                    value={String(selected.props?.component ?? "career_metrics")}
                    onChange={(e) =>
                      pushHistory({
                        ...tree,
                        root: updateNode(tree.root, selected.id, {
                          props: { ...selected.props, component: e.target.value },
                        }),
                      })
                    }
                    className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                  >
                    {[
                      "career_metrics",
                      "sector_grid",
                      "testimonial",
                      "timeline",
                      "skills",
                      "case_study_list",
                      "cv_button",
                      "contact_card",
                      "nav_links",
                      "footer_links",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {(selected.type === "embed" || selected.type === "html") && (
                <label className="block space-y-1">
                  <FieldTip
                    label="HTML"
                    tip="Raw HTML/embed markup. Owner-only power feature."
                  />
                  <textarea
                    rows={6}
                    value={String(selected.props?.html ?? "")}
                    onChange={(e) =>
                      pushHistory({
                        ...tree,
                        root: updateNode(tree.root, selected.id, {
                          props: { ...selected.props, html: e.target.value },
                        }),
                      })
                    }
                    className="w-full border border-mist bg-fog px-2 py-1.5 font-mono text-xs"
                  />
                </label>
              )}

              <FieldTip label="Layout mode" tip="Flow uses flex/grid. Absolute enables free x/y placement." />
              <select
                value={selected.layout?.mode ?? "flow"}
                onChange={(e) =>
                  pushHistory({
                    ...tree,
                    root: updateNode(tree.root, selected.id, {
                      layout: {
                        ...selected.layout,
                        mode: e.target.value as "flow" | "absolute",
                        display: selected.layout?.display ?? "block",
                      },
                    }),
                  })
                }
                className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
              >
                <option value="flow">Flow (flex/grid)</option>
                <option value="absolute">Absolute (free placement)</option>
              </select>

              {selected.layout?.mode === "absolute" ? (
                <div className="grid grid-cols-2 gap-2">
                  {(["x", "y"] as const).map((key) => (
                    <label key={key} className="block space-y-1">
                      <FieldTip label={key.toUpperCase()} tip={`Pixel ${key} position.`} />
                      <input
                        type="number"
                        value={selected.layout?.[key] ?? 0}
                        onChange={(e) =>
                          pushHistory({
                            ...tree,
                            root: updateNode(tree.root, selected.id, {
                              layout: {
                                ...selected.layout!,
                                [key]: Number(e.target.value),
                              },
                            }),
                          })
                        }
                        className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
              ) : null}

              <label className="block space-y-1">
                <FieldTip label="Font size" tip="CSS font-size for this node." />
                <input
                  value={selected.styles?.fontSize ?? ""}
                  onChange={(e) =>
                    pushHistory({
                      ...tree,
                      root: updateNode(tree.root, selected.id, {
                        styles: { ...selected.styles, fontSize: e.target.value },
                      }),
                    })
                  }
                  className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                  placeholder="1.5rem"
                />
              </label>

              <label className="block space-y-1">
                <FieldTip
                  label={`${breakpoint} font size override`}
                  tip="Optional override for the active device breakpoint."
                />
                <input
                  value={selected.stylesByBreakpoint?.[breakpoint]?.fontSize ?? ""}
                  onChange={(e) =>
                    pushHistory({
                      ...tree,
                      root: updateNode(tree.root, selected.id, {
                        stylesByBreakpoint: {
                          ...selected.stylesByBreakpoint,
                          [breakpoint]: {
                            ...selected.stylesByBreakpoint?.[breakpoint],
                            fontSize: e.target.value,
                          },
                        },
                      }),
                    })
                  }
                  className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <FieldTip label="Motion" tip="Entrance animation; respects prefers-reduced-motion." />
                <select
                  value={selected.motion?.preset ?? "none"}
                  onChange={(e) =>
                    pushHistory({
                      ...tree,
                      root: updateNode(tree.root, selected.id, {
                        motion: {
                          preset: e.target.value as NonNullable<
                            DocumentNode["motion"]
                          >["preset"],
                        },
                      }),
                    })
                  }
                  className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                >
                  {["none", "fade-up", "fade-in", "scale-in", "slide-left", "slide-right"].map(
                    (p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="flex items-center gap-2 font-mono text-[10px] uppercase">
                <input
                  type="checkbox"
                  checked={selected.visibility?.hidden === true}
                  onChange={(e) =>
                    pushHistory({
                      ...tree,
                      root: updateNode(tree.root, selected.id, {
                        visibility: {
                          ...selected.visibility,
                          hidden: e.target.checked,
                        },
                      }),
                    })
                  }
                />
                <FieldTip label="Hidden" tip="Hide this node on the published page." />
              </label>

              <button
                type="button"
                className="font-mono text-[10px] uppercase text-amber"
                title="Delete this layer and its children"
                onClick={() => {
                  if (!tree || selected.id === tree.root.id) return;
                  pushHistory({ ...tree, root: removeNode(tree.root, selected.id) });
                  setSelectedId(tree.root.id);
                }}
              >
                Delete node
              </button>

              <div className="border-t border-mist pt-3 space-y-2">
                <FieldTip
                  label="AI assist (BYOK)"
                  tip="Uses your own model API keys from Design / Integrations. Nothing is billed to the site."
                />
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Rewrite this text to be sharper…"
                  className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  className="font-mono text-[10px] uppercase border border-mist px-2 py-1"
                  onClick={() =>
                    void (async () => {
                      try {
                        const res = await apiFetch<{ text: string }>("/ai/admin/complete", {
                          method: "POST",
                          body: JSON.stringify({
                            provider: "openai",
                            prompt: `${aiPrompt}\n\nCurrent text:\n${String(selected.props?.text ?? selected.props?.label ?? "")}`,
                          }),
                        });
                        if (selected.type === "text") {
                          pushHistory({
                            ...tree,
                            root: updateNode(tree.root, selected.id, {
                              props: { ...selected.props, text: res.text },
                            }),
                          });
                        }
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "AI failed");
                      }
                    })()
                  }
                >
                  Apply AI
                </button>
              </div>
            </div>
          ) : (
            <p className="font-body text-sm text-graphite/60">Select a layer to inspect.</p>
          )}

          {activeDoc ? (
            <div className="border-t border-mist pt-3 space-y-2">
              <FieldTip label="SEO title" tip="Document title used in meta tags." />
              <input
                value={tree?.seo?.title ?? activeDoc.title}
                onChange={(e) =>
                  tree &&
                  pushHistory({
                    ...tree,
                    seo: { ...tree.seo, title: e.target.value },
                  })
                }
                className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
              />
              <FieldTip label="SEO description" tip="Meta description for this page." />
              <textarea
                rows={3}
                value={tree?.seo?.description ?? ""}
                onChange={(e) =>
                  tree &&
                  pushHistory({
                    ...tree,
                    seo: { ...tree.seo, description: e.target.value },
                  })
                }
                className="w-full border border-mist bg-fog px-2 py-1.5 text-sm"
              />
              <FieldTip label="Locale" tip="Document locale code (e.g. en, fr)." />
              <input
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full border border-mist bg-fog px-2 py-1.5 font-mono text-sm"
              />
            </div>
          ) : null}
        </aside>
      </div>

      {designOpen ? (
        <div className="absolute inset-0 z-50 bg-graphite/40 flex items-center justify-center p-6">
          <div className="bg-fog border border-mist max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl">Design & integrations</h2>
              <button
                type="button"
                className="font-mono text-xs uppercase"
                onClick={() => setDesignOpen(false)}
              >
                Close
              </button>
            </div>
            <label className="block space-y-1">
              <FieldTip
                label="Design tokens (JSON)"
                tip="Colors, fonts, radii. Merged into CSS variables on the public site."
              />
              <textarea
                rows={10}
                value={tokensJson}
                onChange={(e) => setTokensJson(e.target.value)}
                className="w-full border border-mist bg-fog px-2 py-1.5 font-mono text-xs"
              />
            </label>
            <button
              type="button"
              className="font-mono text-xs uppercase bg-steel text-fog px-3 py-2"
              onClick={() =>
                void apiFetch("/design-system/admin", {
                  method: "PUT",
                  body: JSON.stringify({ tokens: JSON.parse(tokensJson) }),
                })
                  .then(() => setStatus("Tokens saved"))
                  .catch((e: unknown) => setError(String(e)))
              }
            >
              Save tokens
            </button>
            <label className="block space-y-1">
              <FieldTip
                label="Head HTML"
                tip="Injected into document head for analytics/pixels. Owner power feature."
              />
              <textarea
                rows={5}
                value={headHtml}
                onChange={(e) => setHeadHtml(e.target.value)}
                className="w-full border border-mist bg-fog px-2 py-1.5 font-mono text-xs"
              />
            </label>
            <div className="grid gap-2">
              <FieldTip
                label="AI API keys (BYOK)"
                tip="Stored for your account only. Leave blank to keep existing saved keys."
              />
              {(["openai", "anthropic", "google"] as const).map((k) => (
                <input
                  key={k}
                  type="password"
                  placeholder={`${k} api key`}
                  value={aiKeys[k]}
                  onChange={(e) => setAiKeys((prev) => ({ ...prev, [k]: e.target.value }))}
                  className="w-full border border-mist bg-fog px-2 py-1.5 font-mono text-sm"
                />
              ))}
            </div>
            <button
              type="button"
              className="font-mono text-xs uppercase border border-mist px-3 py-2"
              onClick={() =>
                void apiFetch("/integrations/admin", {
                  method: "PUT",
                  body: JSON.stringify({
                    headHtml,
                    aiKeys: {
                      openai: aiKeys.openai.startsWith("••••") ? undefined : aiKeys.openai,
                      anthropic: aiKeys.anthropic.startsWith("••••")
                        ? undefined
                        : aiKeys.anthropic,
                      google: aiKeys.google.startsWith("••••") ? undefined : aiKeys.google,
                    },
                  }),
                })
                  .then(() => setStatus("Integrations saved"))
                  .catch((e: unknown) => setError(String(e)))
              }
            >
              Save integrations
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldTip({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-steel">
      {label}
      <span
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-mist text-[9px] text-graphite/60 cursor-help"
        title={tip}
        aria-label={tip}
      >
        ?
      </span>
    </span>
  );
}
