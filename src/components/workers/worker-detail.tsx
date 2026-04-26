"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface WorkerRoute {
  id: string;
  pattern: string;
  script: string;
}

interface Worker {
  id: string;
  etag: string;
  created_on: string;
  modified_on: string;
  deployment_id?: string;
  usage_model?: string;
  handlers?: string[];
  routes?: WorkerRoute[];
}

interface WorkerDeployment {
  id: string;
  created_on: string;
  source?: string;
  author_email?: string;
  annotations?: { message?: string; trigger_operation?: string };
}

interface Props {
  connectionId: string;
  scriptName: string;
}

type Tab = "overview" | "routes" | "deployments" | "logs";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "routes", label: "Routes" },
  { id: "deployments", label: "Deployments" },
  { id: "logs", label: "Logs" },
];

export function WorkerDetail({ connectionId, scriptName }: Props) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [deployments, setDeployments] = useState<WorkerDeployment[]>([]);
  const [loadingWorker, setLoadingWorker] = useState(false);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab) ?? "overview";

  useEffect(() => {
    if (!connectionId || !scriptName) return;
    setLoadingWorker(true);
    setError(null);
    setWorker(null);
    fetch(`/api/cloudflare/workers/${encodeURIComponent(scriptName)}?connectionId=${connectionId}`)
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { worker?: Worker; error?: string };
        if (data.error) setError(data.error);
        else setWorker(data.worker ?? null);
      })
      .catch(() => setError("Failed to load worker"))
      .finally(() => setLoadingWorker(false));
  }, [connectionId, scriptName]);

  useEffect(() => {
    if (!connectionId || !scriptName || activeTab !== "deployments") return;
    setLoadingDeps(true);
    fetch(`/api/cloudflare/workers/${encodeURIComponent(scriptName)}/deployments?connectionId=${connectionId}`)
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { deployments?: WorkerDeployment[]; error?: string };
        setDeployments(data.deployments ?? []);
      })
      .catch(() => setDeployments([]))
      .finally(() => setLoadingDeps(false));
  }, [connectionId, scriptName, activeTab]);

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard/workers?${params.toString()}`);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
          <svg className="size-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-white">{scriptName}</h2>
          {worker && (
            <p className="text-xs text-zinc-500">
              Modified {formatDate(worker.modified_on)}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-violet-400 text-violet-300"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <p className="mb-4 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        {loadingWorker && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/60" />
            ))}
          </div>
        )}

        {!loadingWorker && worker && activeTab === "overview" && (
          <div className="space-y-3">
            <InfoRow label="Script name" value={worker.id} />
            <InfoRow label="Created" value={formatDate(worker.created_on)} />
            <InfoRow label="Last modified" value={formatDate(worker.modified_on)} />
            <InfoRow label="Usage model" value={worker.usage_model ?? "—"} />
            <InfoRow label="Deployment ID" value={worker.deployment_id ?? "—"} mono />
            {worker.handlers && worker.handlers.length > 0 && (
              <InfoRow label="Handlers" value={worker.handlers.join(", ")} />
            )}
          </div>
        )}

        {!loadingWorker && worker && activeTab === "routes" && (
          <div>
            {(!worker.routes || worker.routes.length === 0) ? (
              <EmptyState message="No routes configured for this worker." />
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900">
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Pattern</th>
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Route ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worker.routes.map((route) => (
                      <tr key={route.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                        <td className="px-4 py-2.5 font-mono text-zinc-200">{route.pattern}</td>
                        <td className="px-4 py-2.5 font-mono text-zinc-500">{route.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "deployments" && (
          <div>
            {loadingDeps ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/60" />
                ))}
              </div>
            ) : deployments.length === 0 ? (
              <EmptyState message="No deployment history available." />
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900">
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Deployed</th>
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Source</th>
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Author</th>
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map((dep) => (
                      <tr key={dep.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                        <td className="px-4 py-2.5 text-zinc-300">{formatDate(dep.created_on)}</td>
                        <td className="px-4 py-2.5 text-zinc-400">{dep.source ?? "—"}</td>
                        <td className="px-4 py-2.5 text-zinc-400">{dep.author_email ?? "—"}</td>
                        <td className="px-4 py-2.5 text-zinc-500">{dep.annotations?.message ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center">
            <svg
              className="mx-auto mb-3 size-8 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="mb-1 text-sm font-medium text-zinc-300">Live logs require a WebSocket connection</p>
            <p className="mb-4 text-xs text-zinc-500">
              The Cloudflare tail API uses WebSockets — not supported on edge API routes.
            </p>
            <code className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-violet-300">
              wrangler tail {scriptName}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <span className="w-36 shrink-0 text-xs text-zinc-500">{label}</span>
      <span className={`min-w-0 flex-1 break-all text-xs text-zinc-200 ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-800 p-10 text-center">
      <p className="text-xs text-zinc-600">{message}</p>
    </div>
  );
}
