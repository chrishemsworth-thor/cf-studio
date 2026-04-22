"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme/theme-provider";

interface Connection {
  id: string;
  label: string;
  accountId: string;
}

function ConnectionCard({
  connection,
  onDeleted,
  onRenamed,
}: {
  connection: Connection;
  onDeleted: (id: string) => void;
  onRenamed: (id: string, label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(connection.label);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || label === connection.label) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cloudflare/connections/${connection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename");
      onRenamed(connection.id, label.trim());
      setEditing(false);
    } catch {
      setError("Failed to rename. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Disconnect "${connection.label}"? Any saved queries for this account will also be removed.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cloudflare/connections/${connection.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      onDeleted(connection.id);
    } catch {
      setError("Failed to disconnect. Try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--hover-bg)] p-4 transition-colors hover:bg-[var(--active-bg)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
            <svg className="size-5 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>

          <div className="min-w-0">
            {editing ? (
              <form onSubmit={handleRename} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
                  className="rounded-md border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-sm font-semibold text-orange-200 outline-none focus:ring-1 focus:ring-orange-500/30"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-orange-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setLabel(connection.label); setEditing(false); }}
                  className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="group flex items-center gap-1.5 text-left"
                title="Click to rename"
              >
                <span className="text-sm font-semibold text-[var(--text-primary)]">{connection.label}</span>
                <svg className="size-3.5 text-[var(--text-faint)] opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
              </button>
            )}
            <p className="mt-0.5 font-mono text-xs text-[var(--text-faint)]">{connection.accountId}</p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          {deleting ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cloudflare/connections")
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { connections?: Connection[] };
        setConnections(data.connections ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleDeleted(id: string) {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }

  function handleRenamed(id: string, label: string) {
    setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage your connected Cloudflare accounts and preferences.
          </p>
        </div>

        {/* Appearance */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-muted)]">Appearance</h3>
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--hover-bg)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Theme</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Choose your preferred color scheme</p>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-[var(--border)]">
              <button
                onClick={() => setTheme("light")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  theme === "light"
                    ? "bg-orange-500 text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-orange-500 text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </section>

        {/* Connected accounts */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">Connected accounts</h3>
            <Link
              href="/dashboard/connect"
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-colors hover:bg-orange-600"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add account
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--hover-bg)]" />
              ))}
            </div>
          ) : connections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-panel)] p-8 text-center">
              <p className="text-sm font-medium text-[var(--text-muted)]">No accounts connected yet</p>
              <p className="mt-1 text-xs text-[var(--text-faint)]">
                Add a Cloudflare account to start managing your D1, R2, Workers and Pages resources.
              </p>
              <Link
                href="/dashboard/connect"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
              >
                Connect your first account →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((c) => (
                <ConnectionCard
                  key={c.id}
                  connection={c}
                  onDeleted={handleDeleted}
                  onRenamed={handleRenamed}
                />
              ))}
            </div>
          )}
        </section>

        {connections.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 text-xs text-[var(--text-faint)]">
            <span className="font-medium text-[var(--text-muted)]">Tip:</span> Click a label to rename it.
            Disconnecting removes it from CF Studio — does not affect your Cloudflare account.
          </div>
        )}
      </div>
    </div>
  );
}
