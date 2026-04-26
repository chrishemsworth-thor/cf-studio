"use client";
import { useEffect, useState } from "react";

interface Metadata {
  key: string;
  size: number;
  content_type: string | null;
  etag: string | null;
  last_modified: string | null;
  storage_class: string | null;
  metadata: Record<string, string>;
}

interface Props {
  connectionId: string;
  bucket: string;
  objectKey: string;
  onClose: () => void;
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function ObjectMetadata({ connectionId, bucket, objectKey, onClose }: Props) {
  const [data, setData] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/cloudflare/r2/metadata?connectionId=${connectionId}&bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(objectKey)}`)
      .then((r) => r.json())
      .then((raw) => {
        const d = raw as Metadata & { error?: string };
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load metadata"))
      .finally(() => setLoading(false));
  }, [connectionId, bucket, objectKey]);

  const rows = data ? [
    ["Key", data.key],
    ["Size", fmt(data.size)],
    ["Content-Type", data.content_type ?? "—"],
    ["ETag", data.etag ?? "—"],
    ["Last Modified", data.last_modified ? new Date(data.last_modified).toLocaleString() : "—"],
    ["Storage Class", data.storage_class ?? "—"],
  ] : [];

  const customMeta = data ? Object.entries(data.metadata) : [];

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-xs font-semibold text-zinc-400">Object Metadata</span>
        <button onClick={onClose} className="rounded p-1 text-zinc-600 hover:text-zinc-300">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && <div className="text-xs text-zinc-600">Loading…</div>}
        {error && <div className="text-xs text-red-400">{error}</div>}
        {data && (
          <div className="space-y-4">
            <section>
              <table className="w-full text-xs">
                <tbody>
                  {rows.map(([label, value]) => (
                    <tr key={label} className="border-b border-zinc-800/50">
                      <td className="py-2 pr-3 font-medium text-zinc-500 whitespace-nowrap">{label}</td>
                      <td className="py-2 font-mono text-zinc-300 break-all">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {customMeta.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Custom Metadata</h3>
                <table className="w-full text-xs">
                  <tbody>
                    {customMeta.map(([k, v]) => (
                      <tr key={k} className="border-b border-zinc-800/50">
                        <td className="py-2 pr-3 font-mono text-zinc-500">{k}</td>
                        <td className="py-2 font-mono text-zinc-300 break-all">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
