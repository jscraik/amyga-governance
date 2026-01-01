---
summary: "React 19 + Next.js 16 (RSC/App Router) guidance."
read_when: "Using Next.js App Router or React Server Components."
applies_to: ["pack-react-next"]
owner: "Governance Team"
---

# Pack: React + Next.js

## Standards

- **Baselines**: React 19 and Next.js 16 (upgrade immediately on advisories).
- **RSC default**: Server Components by default; `"use client"` only when required.
- **Server actions**: Use `use server` with explicit input validation.
- **Async UI states**: Suspense + Error Boundaries with retry paths.

## Accessibility

- WCAG 2.2 AA; keyboard-complete navigation; visible focus.

## Evidence

- A11y report attached for UI changes.
- Route-level contract snapshot when API routes change.
