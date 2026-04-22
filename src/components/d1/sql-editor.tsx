"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { QueryResults } from "./query-results";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

interface Props {
  connectionId: string;
  databaseId: string;
}

interface ResultState {
  columns: string[];
  rows: unknown[][];
  meta: { duration: number; rows_read: number; rows_written: number };
}

const HISTORY_KEY = (databaseId: string) => `cf-sql-history:${databaseId}`;

export function SqlEditor({ connectionId, databaseId }: Props) {
  const [sql, setSql] = useState("SELECT 1;");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sqlRef = useRef(sql);
  sqlRef.current = sql;

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY(databaseId));
    if (saved) setSql(saved);
  }, [databaseId]);

  const runQuery = useCallback(async () => {
    const query = sqlRef.current.trim();
    if (!query) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/cloudflare/d1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, databaseId, sql: query }),
      });
      const data = await res.json() as ResultState & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      setResult(data);
      localStorage.setItem(HISTORY_KEY(databaseId), query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setRunning(false);
    }
  }, [connectionId, databaseId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runQuery();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [runQuery]);

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <button
          onClick={runQuery}
          disabled={running}
          className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {running ? (
            <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
            </svg>
          )}
          Run
        </button>
        <span className="text-xs text-zinc-600">⌘ + Enter</span>
      </div>

      <div className="flex-[11] overflow-hidden">
        <CodeMirror
          value={sql}
          onChange={setSql}
          height="100%"
          theme="dark"
          extensions={[]}
          style={{ height: "100%", fontSize: "13px" }}
          basicSetup={{ lineNumbers: true, foldGutter: false }}
        />
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="flex-[9] overflow-hidden bg-zinc-950">
        {error ? (
          <div className="p-3 text-sm text-red-400">{error}</div>
        ) : result ? (
          <QueryResults columns={result.columns} rows={result.rows} meta={result.meta} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-700">
            Run a query to see results
          </div>
        )}
      </div>
    </div>
  );
}
