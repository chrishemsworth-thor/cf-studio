"use client";

interface Props {
  columns: string[];
  rows: unknown[][];
  meta?: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

export function QueryResults({ columns, rows, meta }: Props) {
  if (columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-zinc-600">No results</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {meta && (
        <div className="flex items-center gap-4 border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-500">
          <span>{rows.length} row{rows.length !== 1 ? "s" : ""}</span>
          <span>{meta.duration.toFixed(1)}ms</span>
          {meta.rows_read > 0 && <span>{meta.rows_read} read</span>}
          {meta.rows_written > 0 && <span>{meta.rows_written} written</span>}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-zinc-900">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border-b border-zinc-800 px-3 py-2 text-left font-medium text-zinc-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                {(row as unknown[]).map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 text-zinc-300">
                    {cell === null ? (
                      <span className="text-zinc-600 italic">null</span>
                    ) : typeof cell === "number" ? (
                      <span className="text-violet-400">{String(cell)}</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
