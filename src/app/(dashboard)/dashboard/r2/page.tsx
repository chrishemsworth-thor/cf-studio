"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ConnectionSelector } from "@/components/d1/connection-selector";
import { BucketList } from "@/components/r2/bucket-list";
import { BucketView } from "@/components/r2/bucket-view";

export default function R2Page() {
  const [connectionId, setConnectionId] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeBucket = searchParams.get("bucket") ?? "";

  function selectBucket(name: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (name) {
      params.set("bucket", name);
      params.delete("tab");
    } else {
      params.delete("bucket");
      params.delete("tab");
    }
    router.replace(`?${params.toString()}`);
  }

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
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">Buckets</p>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              <BucketList
                connectionId={connectionId}
                activeBucket={activeBucket}
                onSelect={selectBucket}
              />
            </div>
          </>
        )}
      </aside>

      <main className="flex flex-1 overflow-hidden bg-zinc-950">
        {activeBucket && connectionId ? (
          <BucketView connectionId={connectionId} bucket={activeBucket} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto mb-3 size-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              <p className="text-sm text-zinc-600">Select a bucket to get started</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
