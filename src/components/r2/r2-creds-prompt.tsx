"use client";

export function R2CredsPrompt() {
  return (
    <div className="m-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <svg className="mt-0.5 size-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-300">R2 credentials required</p>
          <p className="mt-1 text-xs text-amber-400/80">
            Object operations need an R2 API token (Access Key ID + Secret). Add them in{" "}
            <a href="/dashboard/settings" className="underline hover:text-amber-300">
              Settings → R2 Credentials
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
