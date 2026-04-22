# Theme Selector Design

**Date:** 2026-04-22
**Status:** Approved

## Overview

Add light/dark theme support to CF Studio. Default is light. User preference persists in localStorage. Toggle available in header (icon button) and settings page (segmented control).

## Decisions

- **Default:** Light (always, regardless of OS preference)
- **Persistence:** localStorage key `cf-theme`
- **Mechanism:** CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark)
- **Toggle locations:** Header icon button + Settings page segmented control
- **No new dependencies**

## Color System

`globals.css` defines all theme colors as CSS custom properties.

```css
:root {
  --surface-base: #f5f6fa;
  --surface-panel: #f0f1f6;
  --border: rgba(0,0,0,0.08);
  --text-primary: #111827;
  --text-muted: #6b7280;
  --text-faint: #9ca3af;
  --hover-bg: rgba(0,0,0,0.04);
  --active-bg: rgba(0,0,0,0.07);
}

[data-theme="dark"] {
  --surface-base: #0d0f16;
  --surface-panel: #0c0e14;
  --border: rgba(255,255,255,0.05);
  --text-primary: #ffffff;
  --text-muted: #737373;
  --text-faint: #525252;
  --hover-bg: rgba(255,255,255,0.05);
  --active-bg: rgba(255,255,255,0.08);
}
```

Brand accent colors (`orange-500`, `orange-400`) remain unchanged in both themes.

## Architecture

### ThemeProvider (`src/components/theme/theme-provider.tsx`)

Client component. On mount:
1. Reads `localStorage.getItem("cf-theme")`
2. Falls back to `"light"` if absent
3. Sets `document.documentElement.setAttribute("data-theme", theme)`
4. Exposes `{ theme, setTheme }` via `ThemeContext`

Setter also writes to localStorage and updates `data-theme` attribute.

Root `layout.tsx` wraps `<body>` children in `<ThemeProvider>`.

### Flash behavior

`:root` CSS vars are light by default. Light users see no flash. Dark users see a brief light flash on first paint before JS corrects — acceptable given localStorage choice.

## Toggle UI

### Header (`src/components/layout/header.tsx`)

Sun/moon SVG icon button on the right side, before the user avatar. Single click toggles theme. No label.

### Settings page (`src/app/(dashboard)/dashboard/settings/page.tsx`)

New "Appearance" section at the top. Segmented two-button control: `Light | Dark`. Active option highlighted. Uses `useTheme()` hook from `ThemeContext`.

## Files

### New
- `src/components/theme/theme-provider.tsx`

### Modified
- `src/app/globals.css` — CSS vars for both themes
- `src/app/layout.tsx` — wrap body children in `<ThemeProvider>`
- `src/app/(dashboard)/layout.tsx` — replace `bg-[#0d0f16]` with `bg-[var(--surface-base)]`
- `src/components/layout/sidebar.tsx` — replace all hardcoded dark colors with CSS var classes
- `src/components/layout/header.tsx` — replace colors, add toggle button
- `src/app/(dashboard)/dashboard/settings/page.tsx` — add Appearance section

## Out of Scope

- System preference (`prefers-color-scheme`) support
- Cookie-based persistence
- Per-page or per-component theming
- Any data components (D1, R2, Workers views)
