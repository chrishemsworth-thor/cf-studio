"use client";
import { useState } from "react";

export function ConnectAccountForm() {
  const [label, setLabel] = useState("");
  const [accountId, setAccountId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cloudflare/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, accountId, apiToken }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Connection failed");
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Connection label</label>
        <input
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. My Production Account"
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Account ID</label>
        <input
          required
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="32-character hex string"
          className={inputClass}
          spellCheck={false}
        />
        <p className="text-xs text-zinc-600">
          Found in the Cloudflare dashboard under Account Home → right sidebar
        </p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">API Token</label>
        <input
          required
          type="password"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="Your Cloudflare API token"
          className={inputClass}
          spellCheck={false}
        />
        <p className="text-xs text-zinc-600">
          Create one at My Profile → API Tokens with D1, R2, Workers, and Pages read permissions
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition-colors hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Verifying & connecting…" : "Connect account"}
      </button>
    </form>
  );
}
