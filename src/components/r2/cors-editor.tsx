"use client";
import { useEffect, useState } from "react";
import type { R2CorsRule } from "@/types/cloudflare";

interface Props {
  connectionId: string;
  bucket: string;
}

const EMPTY_RULE: R2CorsRule = {
  allowedOrigins: ["*"],
  allowedMethods: ["GET"],
  allowedHeaders: [],
  exposeHeaders: [],
  maxAgeSeconds: 3600,
};

function RuleEditor({ rule, onChange, onRemove }: {
  rule: R2CorsRule;
  onChange: (r: R2CorsRule) => void;
  onRemove: () => void;
}) {
  function listField(label: string, key: keyof R2CorsRule, optional?: boolean) {
    const val = (rule[key] as string[] | undefined) ?? [];
    return (
      <div>
        <label className="mb-1 block text-xs text-zinc-500">{label}{optional ? " (optional)" : ""}</label>
        <input
          value={val.join(", ")}
          onChange={(e) => onChange({ ...rule, [key]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          placeholder={optional ? "—" : "e.g. https://example.com"}
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-emerald-500/60"
        />
      </div>
    );
  }

  const ALL_METHODS = ["GET", "PUT", "POST", "DELETE", "HEAD"];

  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400">CORS Rule</span>
        <button onClick={onRemove} className="rounded p-0.5 text-zinc-600 hover:text-red-400">
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {listField("Allowed Origins", "allowedOrigins")}

      <div>
        <label className="mb-1 block text-xs text-zinc-500">Allowed Methods</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                const cur = rule.allowedMethods;
                onChange({ ...rule, allowedMethods: cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m] });
              }}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                rule.allowedMethods.includes(m)
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {listField("Allowed Headers", "allowedHeaders", true)}
      {listField("Expose Headers", "exposeHeaders", true)}

      <div>
        <label className="mb-1 block text-xs text-zinc-500">Max Age (seconds)</label>
        <input
          type="number"
          value={rule.maxAgeSeconds ?? ""}
          onChange={(e) => onChange({ ...rule, maxAgeSeconds: Number(e.target.value) || undefined })}
          className="w-32 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-emerald-500/60"
        />
      </div>
    </div>
  );
}

export function CorsEditor({ connectionId, bucket }: Props) {
  const [rules, setRules] = useState<R2CorsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cloudflare/r2/cors?connectionId=${connectionId}&bucket=${encodeURIComponent(bucket)}`)
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as { rules?: R2CorsRule[]; error?: string };
        if (data.error) setError(data.error);
        else setRules(data.rules ?? []);
      })
      .catch(() => setError("Failed to load CORS config"))
      .finally(() => setLoading(false));
  }, [connectionId, bucket]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cloudflare/r2/cors?connectionId=${connectionId}&bucket=${encodeURIComponent(bucket)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-xs text-zinc-600">Loading CORS config…</div>;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-xs font-semibold text-zinc-400">CORS Rules</span>
        <div className="flex gap-2">
          <button
            onClick={() => setRules((prev) => [...prev, { ...EMPTY_RULE }])}
            className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          >
            + Add Rule
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

        {rules.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-zinc-600">
            No CORS rules configured. Click "+ Add Rule" to create one.
          </div>
        ) : (
          rules.map((rule, i) => (
            <RuleEditor
              key={i}
              rule={rule}
              onChange={(updated) => setRules((prev) => prev.map((r, idx) => idx === i ? updated : r))}
              onRemove={() => setRules((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))
        )}
      </div>
    </div>
  );
}
