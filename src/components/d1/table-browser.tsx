"use client";
import { useEffect, useState, useCallback } from "react";
import type { D1TableSchema } from "@/types/cloudflare";

interface Props {
  connectionId: string;
  databaseId: string;
  tables: D1TableSchema[];
}

interface TableData {
  columns: string[];
  rows: unknown[][];
  total: number;
  page: number;
  pageSize: number;
}

interface EditState {
  rowIndex: number;
  colIndex: number;
  value: string;
}

export function TableBrowser({ connectionId, databaseId, tables }: Props) {
  const [activeTable, setActiveTable] = useState<string>(tables[0]?.name ?? "");
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTable = useCallback(
    async (table: string, p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/cloudflare/d1/table?connectionId=${connectionId}&databaseId=${databaseId}&table=${encodeURIComponent(table)}&page=${p}`
        );
        const raw = await res.json() as TableData & { error?: string };
        if (!res.ok) throw new Error(raw.error ?? "Failed");
        setData(raw);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [connectionId, databaseId]
  );

  useEffect(() => {
    if (activeTable) {
      setPage(1);
      loadTable(activeTable, 1);
    }
  }, [activeTable, loadTable]);

  async function handleSave(rowIndex: number, colIndex: number, value: string) {
    if (!data) return;
    setSaving(true);
    try {
      const rowidColIndex = data.columns.indexOf("rowid");
      const rowid = rowidColIndex >= 0 ? Number((data.rows[rowIndex] as unknown[])[rowidColIndex]) : rowIndex;
      const column = data.columns[colIndex];

      await fetch("/api/cloudflare/d1/table", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, databaseId, table: activeTable, column, value, rowid }),
      });

      setData((prev) => {
        if (!prev) return prev;
        const newRows = prev.rows.map((row, i) => {
          if (i !== rowIndex) return row;
          const newRow = [...(row as unknown[])];
          newRow[colIndex] = value;
          return newRow;
        });
        return { ...prev, rows: newRows };
      });
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
      setEdit(null);
    }
  }

  if (tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-600">
        No tables found
      </div>
    );
  }

  const visibleColumns = data?.columns.filter((c) => c !== "rowid") ?? [];
  const visibleColIndexes = data?.columns.map((c, i) => ({ col: c, i })).filter(({ col }) => col !== "rowid") ?? [];

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

      <div className="flex flex-1 flex-col overflow-hidden">
        {error && (
          <div className="border-b border-zinc-800 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-xs text-zinc-600">Loading…</div>
        ) : data ? (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-zinc-900">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th key={col} className="border-b border-zinc-800 px-3 py-2 text-left font-medium text-zinc-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      {visibleColIndexes.map(({ col, i }) => {
                        const cell = (row as unknown[])[i];
                        const isEditing = edit?.rowIndex === rowIndex && edit?.colIndex === i;
                        return (
                          <td
                            key={col}
                            className="px-3 py-1.5"
                            onDoubleClick={() => setEdit({ rowIndex, colIndex: i, value: cell === null ? "" : String(cell) })}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                value={edit.value}
                                onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSave(rowIndex, i, edit.value);
                                  if (e.key === "Escape") setEdit(null);
                                }}
                                onBlur={() => handleSave(rowIndex, i, edit.value)}
                                disabled={saving}
                                className="w-full rounded border border-orange-500/40 bg-orange-500/10 px-1.5 py-0.5 text-xs text-orange-200 outline-none focus:ring-1 focus:ring-orange-500/30"
                              />
                            ) : cell === null ? (
                              <span className="text-zinc-600 italic">null</span>
                            ) : typeof cell === "number" ? (
                              <span className="text-violet-400">{String(cell)}</span>
                            ) : (
                              <span className="text-zinc-300">{String(cell)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.total > data.pageSize && (
              <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2 text-xs text-zinc-500">
                <span>
                  Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => { const p = page - 1; setPage(p); loadTable(activeTable, p); }}
                    className="rounded px-2 py-0.5 hover:bg-zinc-800 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={data.page * data.pageSize >= data.total}
                    onClick={() => { const p = page + 1; setPage(p); loadTable(activeTable, p); }}
                    className="rounded px-2 py-0.5 hover:bg-zinc-800 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
