"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ActionResult } from "../result";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const PDF_TYPES: Record<string, string> = { "application/pdf": "pdf", ...IMAGE_TYPES };

/**
 * Uploads a file straight from the browser to Supabase Storage (admin session;
 * storage policies allow admins only), then lets a server action record it.
 */
export function FileUploader({
  bucket,
  folder,
  onUploaded,
  kind = "image",
  maxMb = 5,
  withAlt = false,
  label = "Upload image",
  altPlaceholder = "Image description (optional, helps Google and screen readers)",
}: {
  bucket: "product-images" | "category-images" | "site-assets" | "certifications";
  folder: string;
  onUploaded: (path: string, alt: string, type: string) => Promise<ActionResult>;
  kind?: "image" | "document";
  maxMb?: number;
  withAlt?: boolean;
  label?: string;
  altPlaceholder?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const types = kind === "document" ? PDF_TYPES : IMAGE_TYPES;

  const upload = async (file: File) => {
    setMessage(null);
    const ext = types[file.type];
    if (!ext) return setMessage({ ok: false, text: kind === "document" ? "Use a PDF, JPG, PNG or WebP file." : "Use a JPG, PNG, WebP or AVIF image." });
    if (file.size > maxMb * 1024 * 1024) return setMessage({ ok: false, text: `The file is larger than ${maxMb} MB.` });

    setBusy(true);
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createBrowserSupabase().storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setBusy(false);
      return setMessage({ ok: false, text: `Upload failed: ${error.message}` });
    }
    const result = await onUploaded(path, alt, ext === "pdf" ? "pdf" : "image");
    setBusy(false);
    setMessage({ ok: result.ok, text: result.message });
    if (result.ok) {
      setAlt("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
  };

  return (
    <div className="space-y-2">
      {withAlt ? (
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          maxLength={250}
          placeholder={altPlaceholder}
          className="h-10 w-full rounded-md border border-[#cdd5df] px-3 text-sm outline-none focus-visible:border-navy-800"
        />
      ) : null}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#cdd5df] bg-steel/50 px-4 py-6 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-800 hover:bg-steel">
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
        {busy ? "Uploading…" : label}
        <input
          ref={inputRef}
          type="file"
          accept={Object.keys(types).join(",")}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      <p className="text-xs text-slate-text">
        {kind === "document" ? "PDF or image" : "JPG, PNG or WebP"}, up to {maxMb} MB.{kind === "image" ? " Square photos on a white background look best." : ""}
      </p>
      {message ? <p className={message.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{message.text}</p> : null}
    </div>
  );
}
