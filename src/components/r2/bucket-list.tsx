"use client";
import { useEffect, useState } from "react";

interface Bucket {
  name: string;
  creation_date: string;
  location?: string;
}

interface Props {
  connectionId: string;
  activeBucket?: string;
  onSelect: (bucket: string) => void;
}

export function BucketList({ connectionId, activeBucket, onSelect }: Props) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connectionId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/cloudflare/r2/buckets?connectionId=${connectionId}`)
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { buckets?: Bucket[]; error?: string };
        if (data.error) setError(data.error);
        else setBuckets(data.buckets ?? []);
      })
      .catch(() => setError("Failed to load buckets"))
      .finally(() => setLoading(false));
  }, [connectionId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/cloudflare/r2/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, name: newName.trim() }),
      });
      const data = await res.json() as { bucket?: Bucket; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      if (data.bucket) setBuckets((prev) => [...prev, data.bucket!]);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bucket");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(bucket: Bucket) {
    if (!confirm(`Delete "${bucket.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/cloudflare/r2/buckets?connectionId=${connectionId}&bucket=${encodeURIComponent(bucket.name)}`, {
        method: "DELETE",
      });
      setBuckets((prev) => prev.filter((b) => b.name !== bucket.name));
      if (activeBucket === bucket.name) onSelect("");
    } catch {
      setError("Failed to delete bucket");
    }
  }

  if (loading) {
    return (
      <div className="space-y-1 px-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 animate-pulse rounded bg-zinc-800/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-3 pt-2">
      {error && <p className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{error}</p>}

      {buckets.map((bucket) => (
        <div
          key={bucket.name}
          className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
            activeBucket === bucket.name
              ? "bg-emerald-500/15 text-emerald-300"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          <button
            onClick={() => onSelect(bucket.name)}
            className="min-w-0 flex-1 truncate text-left font-medium"
          >
            {bucket.name}
          </button>
          <button
            onClick={() => handleDelete(bucket)}
            className="ml-1 shrink-0 rounded p-0.5 text-zinc-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
            title="Delete bucket"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <form onSubmit={handleCreate} className="mt-1 flex gap-1">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New bucket…"
          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white placeholder-zinc-600 outline-none focus:border-emerald-500/60"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          +
        </button>
      </form>
    </div>
  );
}
