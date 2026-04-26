"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectionSelector } from "@/components/d1/connection-selector";
import { WorkerList } from "@/components/workers/worker-list";
import { WorkerDetail } from "@/components/workers/worker-detail";

export default function WorkersPage() {
  const [connectionId, setConnectionId] = useState("");
  const searchParams = useSearchParams();
  const workerName = searchParams.get("workerName") ?? undefined;

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-panel)]">
        <div className="border-b border-[var(--border)] px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">Account</p>
        </div>
        <div className="py-2">
          <ConnectionSelector onSelect={setConnectionId} />
        </div>
        {connectionId && (
          <>
            <div className="border-b border-[var(--border)] px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">Workers</p>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              <WorkerList connectionId={connectionId} activeScriptName={workerName} />
            </div>
          </>
        )}
      </aside>

      <main className="flex flex-1 overflow-hidden">
        {connectionId && workerName ? (
          <WorkerDetail connectionId={connectionId} scriptName={workerName} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-zinc-950">
            <div className="text-center">
              <svg
                className="mx-auto mb-3 size-10 text-zinc-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
              <p className="text-sm text-zinc-600">Select a worker to get started</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
