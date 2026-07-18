type MarkdownEditorProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  rows = 8,
}: MarkdownEditorProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="block space-y-2" htmlFor={fieldId}>
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
        {label}
      </span>
      <textarea
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-none border border-mist bg-fog px-3 py-2 font-mono text-sm text-graphite focus:border-steel"
      />
    </label>
  );
}
