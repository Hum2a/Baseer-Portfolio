import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { useTheme } from "../themes/ThemeProvider";
import { themesByGroup, type ThemeMeta } from "../themes/registry";

function Swatch({ colors }: { colors: ThemeMeta["swatches"] }) {
  return (
    <span className="inline-flex h-3.5 w-3.5 overflow-hidden border border-mist shrink-0" aria-hidden>
      <span className="w-1/2" style={{ background: colors[0] }} />
      <span className="flex w-1/2 flex-col">
        <span className="h-1/2" style={{ background: colors[2] }} />
        <span className="h-1/2" style={{ background: colors[3] }} />
      </span>
    </span>
  );
}

export function ThemeSwitcher({
  className,
  menuPlacement = "down",
}: {
  className?: string;
  menuPlacement?: "down" | "up";
}) {
  const { themeId, theme, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const essentials = themesByGroup("essentials");
  const ridiculous = themesByGroup("ridiculous");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function pick(id: string) {
    setThemeId(id);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 border border-mist bg-fog/80 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite/70 hover:text-steel hover:border-steel/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
      >
        <Swatch colors={theme.swatches} />
        <span className="max-w-[7.5rem] truncate">{theme.label}</span>
        <span aria-hidden className="text-mist">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Site theme"
          className={clsx(
            "absolute right-0 z-40 w-[min(18rem,calc(100vw-2rem))] max-h-[min(24rem,70vh)] overflow-y-auto border border-mist bg-fog shadow-[0_12px_40px_rgb(0_0_0_/0.12)] motion-safe:animate-[fade-up_0.2s_ease-out]",
            menuPlacement === "up" ? "bottom-full mb-2" : "mt-2 top-full",
          )}
        >
          <ThemeGroup
            title="Essentials"
            items={essentials}
            activeId={themeId}
            onPick={pick}
          />
          <ThemeGroup
            title="Ridiculous"
            items={ridiculous}
            activeId={themeId}
            onPick={pick}
          />
        </div>
      ) : null}
    </div>
  );
}

function ThemeGroup({
  title,
  items,
  activeId,
  onPick,
}: {
  title: string;
  items: ThemeMeta[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="border-b border-mist last:border-b-0">
      <p className="sticky top-0 bg-fog/95 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-steel backdrop-blur-sm">
        {title}
      </p>
      <ul className="pb-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onPick(item.id)}
                className={clsx(
                  "flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-mist/40 focus:outline-none focus-visible:bg-mist/50",
                  active && "bg-mist/30",
                )}
              >
                <Swatch colors={item.swatches} />
                <span className="min-w-0">
                  <span className="block font-mono text-xs uppercase tracking-[0.1em] text-graphite">
                    {item.label}
                    {active ? (
                      <span className="ml-2 text-amber">●</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-graphite/55 leading-snug">
                    {item.blurb}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
