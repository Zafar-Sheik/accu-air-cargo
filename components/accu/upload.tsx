"use client";
import { useState } from "react";
import { Notice } from "./ui";
export function ImageUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div>
      <label className="field">
        <span>Upload a product image (PNG, JPEG or WebP; maximum 3 MB)</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError("");
            setMessage("");
            setBusy(true);
            try {
              if (file.size > 3 * 1024 * 1024)
                throw Error("Choose an image smaller than 3 MB.");
              const res = await fetch("/api/media", {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              });
              const d = (await res.json()) as { error?: string; url: string };
              if (!res.ok) throw Error(d.error || "Upload failed");
              onUploaded(d.url);
              setMessage("Image uploaded. Save the product to use it.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {busy && <p>Uploading image…</p>}
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
    </div>
  );
}
