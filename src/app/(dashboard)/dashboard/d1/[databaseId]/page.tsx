"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectionSelector } from "@/components/d1/connection-selector";
import { DatabaseList } from "@/components/d1/database-list";
import { DatabaseView } from "@/components/d1/database-view";

interface Props {
  params: Promise<{ databaseId: string }>;
}

export default function DatabasePage({ params }: Props) {
  const [connectionId, setConnectionId] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    params.then(({ databaseId: id }) => {
      setDatabaseId(id);
    });
  }, [params]);

  useEffect(() => {
    const cid = searchParams.get("connectionId");
    if (cid && databaseId) {
      fetch(`/api/cloudflare/d1/databases?connectionId=${cid}`)
        .then((r) => r.json())
        .then((raw) => {
          const data = raw as { databases?: { uuid: string; name: string }[] };
          const db = data.databases?.find((d) => d.uuid === databaseId);
          if (db) setDatabaseName(db.name);
        });
    }
  }, [databaseId, searchParams]);

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
              <DatabaseList connectionId={connectionId} activeDatabaseId={databaseId} />
            </div>
          </>
        )}
      </aside>

      <main className="flex-1 overflow-hidden">
        {connectionId && databaseId ? (
          <DatabaseView
            connectionId={connectionId}
            databaseId={databaseId}
            databaseName={databaseName || databaseId}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-950 text-sm text-zinc-600">
            Loading…
          </div>
        )}
      </main>
    </div>
  );
}
