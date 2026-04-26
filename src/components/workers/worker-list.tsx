"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Worker {
  id: string;
  modified_on: string;
  created_on: string;
  usage_model?: string;
}

interface Props {
  connectionId: string;
  activeScriptName?: string;
}

export function WorkerList({ connectionId, activeScriptName }: Props) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!connectionId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/cloudflare/workers?connectionId=${connectionId}`)
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { workers?: Worker[]; error?: string };
        if (data.error) setError(data.error);
        else setWorkers(data.workers ?? []);
      })
      .catch(() => setError("Failed to load workers"))
      .finally(() => setLoading(false));
  }, [connectionId]);

  async function handleDelete(worker: Worker) {
    if (!confirm(`Delete worker "${worker.id}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(
        `/api/cloudflare/workers?connectionId=${connectionId}&scriptName=${encodeURIComponent(worker.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setWorkers((prev) => prev.filter((w) => w.id !== worker.id));
      if (activeScriptName === worker.id) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("workerName");
        params.delete("tab");
        router.push(`/dashboard/workers?${params.toString()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete worker");
    }
  }

  function handleSelect(worker: Worker) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("workerName", worker.id);
    params.delete("tab");
    router.push(`/dashboard/workers?${params.toString()}`);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

      {workers.length === 0 && !error && (
        <p className="px-1 text-xs text-zinc-500">No workers found.</p>
      )}

      {workers.map((worker) => (
        <div
          key={worker.id}
          className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
            activeScriptName === worker.id
              ? "bg-violet-500/15 text-violet-300"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          <button
            onClick={() => handleSelect(worker)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate font-medium">{worker.id}</p>
            <p className="truncate text-[10px] text-zinc-600">{formatDate(worker.modified_on)}</p>
          </button>
          <button
            onClick={() => handleDelete(worker)}
            className="ml-1 shrink-0 rounded p-0.5 text-zinc-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
            title="Delete worker"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
