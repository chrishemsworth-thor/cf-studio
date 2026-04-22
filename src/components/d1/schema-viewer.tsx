"use client";
import { useState } from "react";
import type { D1TableSchema } from "@/types/cloudflare";

interface Props {
  tables: D1TableSchema[];
}

const TYPE_COLORS: Record<string, string> = {
  TEXT: "bg-blue-500/20 text-blue-300",
  INTEGER: "bg-violet-500/20 text-violet-300",
  REAL: "bg-emerald-500/20 text-emerald-300",
  BLOB: "bg-orange-500/20 text-orange-300",
  NUMERIC: "bg-yellow-500/20 text-yellow-300",
};

function typeColor(type: string) {
  const upper = type.toUpperCase();
  for (const [key, cls] of Object.entries(TYPE_COLORS)) {
    if (upper.includes(key)) return cls;
  }
  return "bg-zinc-700 text-zinc-300";
}

export function SchemaViewer({ tables }: Props) {
  const [activeTable, setActiveTable] = useState<string>(tables[0]?.name ?? "");
  const table = tables.find((t) => t.name === activeTable);

  if (tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-600">
        No tables found
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex w-48 shrink-0 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-900/50 py-2">
        {tables.map((t) => (
          <button
            key={t.name}
            onClick={() => setActiveTable(t.name)}
            className={`px-3 py-1.5 text-left text-xs font-medium transition-colors ${
              activeTable === t.name
                ? "bg-orange-500/15 text-orange-300"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {table && (
          <>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Columns</h3>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-900">
                    <tr>
                      {["Name", "Type", "Nullable", "PK", "Default"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col) => (
                      <tr key={col.name} className="border-t border-zinc-800/60">
                        <td className="px-3 py-2 font-mono text-zinc-200">{col.name}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeColor(col.type)}`}>
                            {col.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-500">{col.notnull ? "No" : "Yes"}</td>
                        <td className="px-3 py-2 text-zinc-500">{col.pk ? "✓" : "—"}</td>
                        <td className="px-3 py-2 font-mono text-zinc-500">{col.dflt_value ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {table.indexes.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Indexes</h3>
                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-900">
                      <tr>
                        {["Name", "Unique", "Origin"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-zinc-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.indexes.map((idx) => (
                        <tr key={idx.name} className="border-t border-zinc-800/60">
                          <td className="px-3 py-2 font-mono text-zinc-200">{idx.name}</td>
                          <td className="px-3 py-2 text-zinc-500">{idx.unique ? "Yes" : "No"}</td>
                          <td className="px-3 py-2 text-zinc-500">{idx.origin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {table.foreignKeys.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Foreign Keys</h3>
                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-900">
                      <tr>
                        {["From", "To Table", "To Column", "On Delete"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-zinc-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.foreignKeys.map((fk, i) => (
                        <tr key={i} className="border-t border-zinc-800/60">
                          <td className="px-3 py-2 font-mono text-zinc-200">{fk.from}</td>
                          <td className="px-3 py-2 font-mono text-zinc-200">{fk.table}</td>
                          <td className="px-3 py-2 font-mono text-zinc-200">{fk.to}</td>
                          <td className="px-3 py-2 text-zinc-500">{fk.on_delete}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
