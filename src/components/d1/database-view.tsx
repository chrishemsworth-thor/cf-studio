"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SqlEditor } from "./sql-editor";
import { TableBrowser } from "./table-browser";
import { SchemaViewer } from "./schema-viewer";
import type { D1TableSchema } from "@/types/cloudflare";

type Tab = "tables" | "sql" | "schema";

interface Props {
  connectionId: string;
  databaseId: string;
  databaseName: string;
}

export function DatabaseView({ connectionId, databaseId, databaseName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab) ?? "tables";
  const [tables, setTables] = useState<D1TableSchema[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingSchema(true);
    setSchemaError(null);
    fetch(`/api/cloudflare/d1/schema?connectionId=${connectionId}&databaseId=${databaseId}`)
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { tables?: D1TableSchema[]; error?: string };
        if (data.error) setSchemaError(data.error);
        else setTables(data.tables ?? []);
      })
      .catch(() => setSchemaError("Failed to load schema"))
      .finally(() => setLoadingSchema(false));
  }, [connectionId, databaseId]);

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "tables", label: "Tables" },
    { id: "sql", label: "SQL Editor" },
    { id: "schema", label: "Schema" },
  ];

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center border-b border-zinc-800 px-4">
        <span className="mr-4 text-sm font-medium text-zinc-300">{databaseName}</span>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`relative px-3 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id ? "text-orange-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-orange-500" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {loadingSchema && activeTab !== "sql" ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">Loading schema…</div>
        ) : schemaError && activeTab !== "sql" ? (
          <div className="flex h-full items-center justify-center text-xs text-red-400">{schemaError}</div>
        ) : activeTab === "tables" ? (
          <TableBrowser connectionId={connectionId} databaseId={databaseId} tables={tables} />
        ) : activeTab === "sql" ? (
          <SqlEditor connectionId={connectionId} databaseId={databaseId} />
        ) : (
          <SchemaViewer tables={tables} />
        )}
      </div>
    </div>
  );
}
