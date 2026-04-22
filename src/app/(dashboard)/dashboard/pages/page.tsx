export default function PagesPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
          <svg className="size-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pages</h2>
          <p className="text-sm text-[var(--text-muted)]">Web deployments — coming soon</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
        <p className="text-sm text-[var(--text-faint)]">Pages deployment management is in development.</p>
      </div>
    </div>
  );
}
