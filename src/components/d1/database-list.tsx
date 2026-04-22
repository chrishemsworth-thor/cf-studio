"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Database {
  uuid: string;
  name: string;
  created_at: string;
  num_tables?: number;
}

interface Props {
  connectionId: string;
  activeDatabaseId?: string;
}

export function DatabaseList({ connectionId, activeDatabaseId }: Props) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!connectionId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/cloudflare/d1/databases?connectionId=${connectionId}`)
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { databases?: Database[]; error?: string };
        if (data.error) setError(data.error);
        else setDatabases(data.databases ?? []);
      })
      .catch(() => setError("Failed to load databases"))
      .finally(() => setLoading(false));
  }, [connectionId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/cloudflare/d1/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, name: newName.trim() }),
      });
      const data = await res.json() as { database?: Database; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      if (data.database) setDatabases((prev) => [...prev, data.database!]);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create database");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(db: Database) {
    if (!confirm(`Delete "${db.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/cloudflare/d1/databases?connectionId=${connectionId}&databaseId=${db.uuid}`, {
        method: "DELETE",
      });
      setDatabases((prev) => prev.filter((d) => d.uuid !== db.uuid));
      if (activeDatabaseId === db.uuid) {
        const params = new URLSearchParams(searchParams.toString());
        router.push(`/dashboard/d1?${params.toString()}`);
      }
    } catch {
      setError("Failed to delete database");
    }
  }

  function handleSelect(db: Database) {
    const params = new URLSearchParams(searchParams.toString());
    router.push(`/dashboard/d1/${db.uuid}?${params.toString()}`);
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
      {error && (
        <p className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{error}</p>
      )}

      {databases.map((db) => (
        <div
          key={db.uuid}
          className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
            activeDatabaseId === db.uuid
              ? "bg-orange-500/15 text-orange-300"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          <button
            onClick={() => handleSelect(db)}
            className="min-w-0 flex-1 truncate text-left font-medium"
          >
            {db.name}
          </button>
          <button
            onClick={() => handleDelete(db)}
            className="ml-1 shrink-0 rounded p-0.5 text-zinc-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
            title="Delete database"
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
          placeholder="New database…"
          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white placeholder-zinc-600 outline-none focus:border-orange-500/60"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="rounded-md bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40"
        >
          +
        </button>
      </form>
    </div>
  );
}
