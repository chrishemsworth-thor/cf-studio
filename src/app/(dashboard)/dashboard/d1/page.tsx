"use client";
import { useState } from "react";
import { ConnectionSelector } from "@/components/d1/connection-selector";
import { DatabaseList } from "@/components/d1/database-list";

export default function D1Page() {
  const [connectionId, setConnectionId] = useState("");

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
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">Databases</p>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              <DatabaseList connectionId={connectionId} />
            </div>
          </>
        )}
      </aside>

      <main className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="text-center">
          <svg className="mx-auto mb-3 size-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625v2.625m-16.5-2.625v2.625" />
          </svg>
          <p className="text-sm text-zinc-600">Select a database to get started</p>
        </div>
      </main>
    </div>
  );
}
