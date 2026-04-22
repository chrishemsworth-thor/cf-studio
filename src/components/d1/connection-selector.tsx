"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Connection {
  id: string;
  label: string;
  accountId: string;
}

interface Props {
  onSelect: (connectionId: string) => void;
}

export function ConnectionSelector({ onSelect }: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/cloudflare/connections")
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { connections?: Connection[] };
        const conns = data.connections ?? [];
        setConnections(conns);
        const current = searchParams.get("connectionId");
        if (!current && conns.length > 0) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("connectionId", conns[0].id);
          router.replace(`?${params.toString()}`);
          onSelect(conns[0].id);
        } else if (current) {
          onSelect(current);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("connectionId", id);
    router.replace(`?${params.toString()}`);
    onSelect(id);
  }

  if (loading) {
    return <div className="h-8 animate-pulse rounded-md bg-zinc-800/60 mx-3" />;
  }

  if (connections.length === 0) {
    return (
      <p className="px-3 text-xs text-zinc-500">
        No accounts connected.{" "}
        <a href="/dashboard/connect" className="text-orange-400 hover:underline">
          Add one
        </a>
      </p>
    );
  }

  return (
    <select
      value={searchParams.get("connectionId") ?? connections[0]?.id}
      onChange={handleChange}
      className="mx-3 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white outline-none focus:border-orange-500/60"
    >
      {connections.map((c) => (
        <option key={c.id} value={c.id}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
