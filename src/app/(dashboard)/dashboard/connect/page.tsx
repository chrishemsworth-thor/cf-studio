import { ConnectAccountForm } from "@/components/connect/connect-account-form";

export default function ConnectPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connect Cloudflare Account</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Add a Cloudflare account to start managing your resources.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-6">
          <ConnectAccountForm />
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--text-muted)]">Required API token permissions</p>
          <ul className="space-y-1.5 text-xs text-[var(--text-faint)]">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-orange-400/60" />
              D1 — Edit (or Read for read-only access)
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400/60" />
              R2 — Read
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-violet-400/60" />
              Workers Scripts — Read
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-blue-400/60" />
              Pages — Read
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
