export default function WorkersPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10">
          <svg className="size-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Workers</h2>
          <p className="text-sm text-[var(--text-muted)]">Serverless scripts — coming soon</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
        <p className="text-sm text-[var(--text-faint)]">Workers management is in development.</p>
      </div>
    </div>
  );
}
