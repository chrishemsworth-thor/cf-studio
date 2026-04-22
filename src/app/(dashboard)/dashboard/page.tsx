import Link from "next/link";

const services = [
  {
    href: "/dashboard/d1",
    label: "D1",
    description: "SQLite databases at the edge",
    icon: (
      <svg className="size-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625v2.625m-16.5-2.625v2.625" />
      </svg>
    ),
    color: "bg-orange-500/10 border-orange-500/20",
  },
  {
    href: "/dashboard/r2",
    label: "R2",
    description: "Object storage without egress fees",
    icon: (
      <svg className="size-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    color: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    href: "/dashboard/workers",
    label: "Workers",
    description: "Serverless compute at the edge",
    icon: (
      <svg className="size-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
    color: "bg-violet-500/10 border-violet-500/20",
  },
  {
    href: "/dashboard/pages",
    label: "Pages",
    description: "Deploy full-stack web apps",
    icon: (
      <svg className="size-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    color: "bg-blue-500/10 border-blue-500/20",
  },
];

export default function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Overview</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Manage your Cloudflare resources from one place.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((svc) => (
          <Link
            key={svc.href}
            href={svc.href}
            className={`flex flex-col gap-3 rounded-xl border p-5 transition-colors hover:bg-[var(--hover-bg)] ${svc.color}`}
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--surface-panel)]">
              {svc.icon}
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{svc.label}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{svc.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
