export default function R2Page() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <svg className="size-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">R2 Storage</h2>
          <p className="text-sm text-[var(--text-muted)]">Object storage — coming soon</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
        <p className="text-sm text-[var(--text-faint)]">R2 bucket management is in development.</p>
      </div>
    </div>
  );
}
