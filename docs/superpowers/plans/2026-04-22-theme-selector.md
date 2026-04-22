# Theme Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add light/dark theme support to CF Studio using CSS custom properties, defaulting to light, persisted in localStorage.

**Architecture:** CSS custom properties on `:root` (light default) and `[data-theme="dark"]` define all UI colors. A `ThemeProvider` client component reads localStorage on mount and sets the `data-theme` attribute on `<html>`. Components use `bg-[var(--surface-panel)]`-style classes instead of hardcoded hex/opacity values.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, TypeScript — no new dependencies.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/app/globals.css` | CSS custom properties for light + dark themes |
| Create | `src/components/theme/theme-provider.tsx` | ThemeContext, ThemeProvider, useTheme hook |
| Modify | `src/app/layout.tsx` | Wrap body children in ThemeProvider |
| Modify | `src/app/(dashboard)/layout.tsx` | Replace hardcoded `bg-[#0d0f16]` |
| Modify | `src/components/layout/sidebar.tsx` | Replace all hardcoded dark colors |
| Modify | `src/components/layout/header.tsx` | Replace colors + add sun/moon toggle button |
| Modify | `src/app/(dashboard)/dashboard/settings/page.tsx` | Replace colors + add Appearance section |

---

## Task 1: CSS Custom Properties

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css with themed CSS vars**

Replace the entire file with:

```css
@import "tailwindcss";

:root {
  --surface-base: #f5f6fa;
  --surface-panel: #f0f1f6;
  --border: rgba(0, 0, 0, 0.08);
  --text-primary: #111827;
  --text-muted: #6b7280;
  --text-faint: #9ca3af;
  --hover-bg: rgba(0, 0, 0, 0.04);
  --active-bg: rgba(0, 0, 0, 0.07);
}

[data-theme="dark"] {
  --surface-base: #0d0f16;
  --surface-panel: #0c0e14;
  --border: rgba(255, 255, 255, 0.05);
  --text-primary: #ffffff;
  --text-muted: #737373;
  --text-faint: #525252;
  --hover-bg: rgba(255, 255, 255, 0.05);
  --active-bg: rgba(255, 255, 255, 0.08);
}

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--surface-base);
  color: var(--text-primary);
  font-family: Arial, Helvetica, sans-serif;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add CSS custom properties for light/dark themes"
```

---

## Task 2: ThemeProvider Component

**Files:**
- Create: `src/components/theme/theme-provider.tsx`

- [ ] **Step 1: Create the ThemeProvider**

Create `src/components/theme/theme-provider.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("cf-theme");
    const resolved: Theme = stored === "dark" ? "dark" : "light";
    setThemeState(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem("cf-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/theme/theme-provider.tsx
git commit -m "feat: add ThemeProvider with localStorage persistence"
```

---

## Task 3: Wire ThemeProvider to Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Wrap body children in ThemeProvider**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CF Studio",
  description: "Manage your Cloudflare resources",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap app in ThemeProvider"
```

---

## Task 4: Update Dashboard Layout

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Replace hardcoded background**

In `src/app/(dashboard)/layout.tsx`, change line 21:

```tsx
// Before
<div className="flex h-screen overflow-hidden bg-[#0d0f16]">

// After
<div className="flex h-screen overflow-hidden bg-[var(--surface-base)]">
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/layout.tsx"
git commit -m "style: use CSS var for dashboard layout background"
```

---

## Task 5: Update Sidebar Colors

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Replace entire sidebar file**

Replace `src/components/layout/sidebar.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  },
  {
    label: "D1 Databases",
    href: "/dashboard/d1",
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    label: "R2 Storage",
    href: "/dashboard/r2",
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    label: "Workers",
    href: "/dashboard/workers",
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
  },
  {
    label: "Pages",
    href: "/dashboard/pages",
    icon: (
      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("cf-sidebar-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("cf-sidebar-collapsed", next ? "1" : "0");
  }

  const isCollapsed = mounted && collapsed;

  return (
    <aside
      className="flex h-full flex-col border-r border-[var(--border)] bg-[var(--surface-panel)] transition-all duration-200"
      style={{ width: isCollapsed ? 52 : 220 }}
    >
      {/* Logo */}
      <div className="flex h-13 items-center justify-between border-b border-[var(--border)] px-3.5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500 shadow-lg shadow-orange-500/20">
            <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              CF Studio
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={toggle}
            title="Collapse sidebar"
            className="rounded-md p-1 text-[var(--text-faint)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-muted)]"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 ${
                isActive
                  ? "bg-[var(--active-bg)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-orange-400" />
              )}
              <span className={isActive ? "text-orange-400" : ""}>{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-2 space-y-0.5">
        <Link
          href="/dashboard/settings"
          title={isCollapsed ? "Settings" : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] ${isCollapsed ? "justify-center px-0" : ""}`}
        >
          <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          {!isCollapsed && "Settings"}
        </Link>

        {isCollapsed && (
          <button
            onClick={toggle}
            title="Expand sidebar"
            className="flex w-full items-center justify-center rounded-lg py-2 text-[var(--text-faint)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-muted)]"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "style: replace hardcoded sidebar colors with CSS vars"
```

---

## Task 6: Update Header + Add Theme Toggle

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Replace entire header file**

Replace `src/components/layout/header.tsx` with:

```tsx
"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useTheme } from "@/components/theme/theme-provider";

interface HeaderProps {
  session: Session | null;
  title: string;
}

export function Header({ session, title }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-13 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-panel)] px-4">
      <span className="text-xs font-medium text-[var(--text-muted)]">{title}</span>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
        >
          {theme === "light" ? (
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          ) : (
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          )}
        </button>

        {session?.user && (
          <>
            <span className="hidden text-xs text-[var(--text-faint)] sm:block">
              {session.user.email}
            </span>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name ?? "User avatar"}
                className="size-7 rounded-full object-cover ring-1 ring-[var(--border)]"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-orange-500/10 text-xs font-semibold text-orange-400 ring-1 ring-[var(--border)]">
                {session.user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md px-2.5 py-1.5 text-xs text-[var(--text-faint)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-muted)]"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: add theme toggle button to header"
```

---

## Task 7: Update Settings Page + Add Appearance Section

**Files:**
- Modify: `src/app/(dashboard)/dashboard/settings/page.tsx`

- [ ] **Step 1: Replace entire settings page file**

Replace `src/app/(dashboard)/dashboard/settings/page.tsx` with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/dashboard/settings/page.tsx"
git commit -m "feat: add Appearance section to settings, replace hardcoded colors"
```

---

## Verification Checklist

After all tasks complete, run `npm run dev` and verify:

- [ ] App loads in **light mode** by default (white/light gray background)
- [ ] Moon icon visible in header; clicking switches to dark mode instantly
- [ ] Sun icon visible in header in dark mode; clicking switches back to light
- [ ] Refreshing the page **preserves** the selected theme
- [ ] Settings → Appearance section shows segmented `Light | Dark` control
- [ ] Active theme button is highlighted orange in the segmented control
- [ ] Sidebar collapse/expand still works in both themes
- [ ] Sign out button still works
- [ ] No TypeScript errors: `npm run build:next`
