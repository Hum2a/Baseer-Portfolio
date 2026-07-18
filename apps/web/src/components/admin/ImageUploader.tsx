import { useState } from "react";
import { apiFetch, mediaFileUrl } from "../../lib/api-client";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@baseer-portfolio/shared";

type PresignResponse = {
  key: string;
  url: string;
  expiresIn: number;
};

type ImageUploaderProps = {
  label?: string;
  value: string | null;
  purpose?: "case-study-image" | "gallery-image";
  onUploaded: (key: string) => void;
  onClear?: () => void;
};

export function ImageUploader({
  label = "Image",
  value,
  purpose = "case-study-image",
  onUploaded,
  onClear,
}: ImageUploaderProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = mediaFileUrl(value);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setError("Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 8 MB.");
      return;
    }

    setBusy(true);
    try {
      const { key, url } = await apiFetch<PresignResponse>("/media/presign", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          byteSize: file.size,
          purpose,
        }),
      });

      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        throw new Error("Upload to storage failed");
      }

      onUploaded(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-steel">{label}</p>
      {preview ? (
        <div className="space-y-2">
          <img src={preview} alt="" className="max-h-48 w-auto object-cover bg-mist/40" />
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="font-mono text-xs uppercase tracking-[0.1em] text-graphite/70 underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
      <input
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        disabled={busy}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm font-mono"
      />
      {busy ? <p className="font-mono text-xs text-steel">Uploading…</p> : null}
      {error ? <p className="font-mono text-xs text-amber">{error}</p> : null}
    </div>
  );
}
