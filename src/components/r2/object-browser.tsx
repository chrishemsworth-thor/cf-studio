"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { ObjectMetadata } from "./object-metadata";
import { PresignModal } from "./presign-modal";
import { R2CredsPrompt } from "./r2-creds-prompt";
import { R2_NO_CREDS_ERROR } from "@/lib/cloudflare/r2-s3";

interface R2Object {
  key: string;
  size: number;
  etag: string;
  last_modified: string;
  storage_class?: string;
}

interface Props {
  connectionId: string;
  bucket: string;
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function ObjectBrowser({ connectionId, bucket }: Props) {
  const [objects, setObjects] = useState<R2Object[]>([]);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [prefix, setPrefix] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [noR2Creds, setNoR2Creds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [presignKey, setPresignKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (p: string, cursor?: string) => {
    setLoading(true);
    setError(null);
    setNoR2Creds(false);
    try {
      const params = new URLSearchParams({
        connectionId,
        bucket,
        prefix: p,
        ...(cursor ? { cursor } : {}),
      });
      const res = await fetch(`/api/cloudflare/r2/objects?${params}`);
      const data = await res.json() as {
        objects?: R2Object[];
        prefixes?: string[];
        nextCursor?: string | null;
        error?: string;
      };
      if (!res.ok) {
        if (data.error?.includes(R2_NO_CREDS_ERROR)) {
          setNoR2Creds(true);
          return;
        }
        throw new Error(data.error ?? "Failed to load objects");
      }
      if (cursor) {
        setObjects((prev) => [...prev, ...(data.objects ?? [])]);
      } else {
        setObjects(data.objects ?? []);
        setPrefixes(data.prefixes ?? []);
      }
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load objects");
    } finally {
      setLoading(false);
    }
  }, [connectionId, bucket]);

  useEffect(() => {
    setPrefix("");
    setNextCursor(null);
    setSelectedKey(null);
    load("");
  }, [connectionId, bucket, load]);

  function navigatePrefix(p: string) {
    setPrefix(p);
    setNextCursor(null);
    setSelectedKey(null);
    load(p);
  }

  async function handleDelete(key: string) {
    if (!confirm(`Delete "${key}"?`)) return;
    try {
      const res = await fetch(`/api/cloudflare/r2/objects?connectionId=${connectionId}&bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Delete failed");
      }
      setObjects((prev) => prev.filter((o) => o.key !== key));
      if (selectedKey === key) setSelectedKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleDownload(key: string) {
    const url = `/api/cloudflare/r2/download?connectionId=${connectionId}&bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = key.split("/").pop() ?? "download";
    a.click();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("key", prefix + file.name);
      const res = await fetch(`/api/cloudflare/r2/upload?connectionId=${connectionId}&bucket=${encodeURIComponent(bucket)}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json() as { ok?: boolean; key?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      await load(prefix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Breadcrumb parts from prefix "a/b/c/" → ["a/", "a/b/", "a/b/c/"]
  const breadcrumbs = prefix
    ? prefix.split("/").filter(Boolean).map((_, i, arr) => ({
        label: arr[i],
        path: arr.slice(0, i + 1).join("/") + "/",
      }))
    : [];

  if (noR2Creds) return <R2CredsPrompt />;

  return (
    <div className={`flex h-full overflow-hidden ${selectedKey ? "flex-row" : ""}`}>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          {/* Breadcrumb */}
          <div className="flex min-w-0 flex-1 items-center gap-1 text-xs">
            <button onClick={() => navigatePrefix("")} className="text-zinc-500 hover:text-zinc-300">
              {bucket}
            </button>
            {breadcrumbs.map((b) => (
              <span key={b.path} className="flex items-center gap-1">
                <span className="text-zinc-700">/</span>
                <button onClick={() => navigatePrefix(b.path)} className="text-zinc-500 hover:text-zinc-300">
                  {b.label}
                </button>
              </span>
            ))}
          </div>

          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>

        {error && <div className="border-b border-zinc-800 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}

        {/* Object table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 bg-zinc-900">
              <tr>
                {["Name", "Size", "Last Modified", ""].map((h) => (
                  <th key={h} className="border-b border-zinc-800 px-3 py-2 text-left font-medium text-zinc-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Folder prefixes */}
              {prefixes.map((p) => {
                const label = p.slice(prefix.length).replace(/\/$/, "");
                return (
                  <tr key={p} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-3 py-1.5" colSpan={3}>
                      <button
                        onClick={() => navigatePrefix(p)}
                        className="flex items-center gap-1.5 font-mono text-zinc-400 hover:text-zinc-200"
                      >
                        <svg className="size-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>
                        {label}/
                      </button>
                    </td>
                    <td className="px-3 py-1.5" />
                  </tr>
                );
              })}

              {/* Objects */}
              {objects.map((obj) => {
                const name = obj.key.slice(prefix.length);
                const isSelected = selectedKey === obj.key;
                return (
                  <tr
                    key={obj.key}
                    className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 ${isSelected ? "bg-emerald-500/5" : ""}`}
                  >
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => setSelectedKey(isSelected ? null : obj.key)}
                        className="font-mono text-zinc-300 hover:text-emerald-300 text-left"
                      >
                        {name}
                      </button>
                    </td>
                    <td className="px-3 py-1.5 text-zinc-500 whitespace-nowrap">{fmt(obj.size)}</td>
                    <td className="px-3 py-1.5 text-zinc-500 whitespace-nowrap">
                      {new Date(obj.last_modified).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(obj.key)}
                          className="text-zinc-600 hover:text-zinc-300"
                          title="Download"
                        >
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPresignKey(obj.key)}
                          className="text-zinc-600 hover:text-zinc-300"
                          title="Presigned URL"
                        >
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(obj.key)}
                          className="text-zinc-600 hover:text-red-400"
                          title="Delete"
                        >
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && objects.length === 0 && prefixes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-xs text-zinc-600">
                    No objects in {prefix ? `"${prefix}"` : "this bucket"}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-xs text-zinc-600">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>

          {nextCursor && !loading && (
            <div className="flex justify-center border-t border-zinc-800 py-3">
              <button
                onClick={() => load(prefix, nextCursor)}
                className="rounded-md border border-zinc-700 px-4 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metadata side panel */}
      {selectedKey && (
        <div className="w-72 shrink-0">
          <ObjectMetadata
            connectionId={connectionId}
            bucket={bucket}
            objectKey={selectedKey}
            onClose={() => setSelectedKey(null)}
          />
        </div>
      )}

      {/* Presign modal */}
      {presignKey && (
        <PresignModal
          connectionId={connectionId}
          bucket={bucket}
          objectKey={presignKey}
          onClose={() => setPresignKey(null)}
        />
      )}
    </div>
  );
}
