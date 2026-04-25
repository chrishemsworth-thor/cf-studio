"use client";
import { useState } from "react";

interface Props {
  connectionId: string;
  bucket: string;
  objectKey: string;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [
  { label: "1 hour", value: 3600 },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
];

export function PresignModal({ connectionId, bucket, objectKey, onClose }: Props) {
  const [expiresIn, setExpiresIn] = useState(3600);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setUrl(null);
    try {
      const res = await fetch("/api/cloudflare/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, bucket, key: objectKey, expiresIn }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setUrl(data.url!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-200">Generate Presigned URL</h3>
          <button onClick={onClose} className="rounded p-1 text-zinc-500 hover:text-zinc-300">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Object</label>
            <p className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 break-all">
              {objectKey}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Expires in</label>
            <div className="flex gap-2">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExpiresIn(opt.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    expiresIn === opt.value
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

          {url && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Presigned URL</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={url}
                  className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-300 outline-none"
                />
                <button
                  onClick={copy}
                  className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-4">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
            Cancel
          </button>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
