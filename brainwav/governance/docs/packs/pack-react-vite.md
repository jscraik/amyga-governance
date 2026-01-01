---
summary: "React 19 + Vite conventions for UI delivery without framework lock-in."
read_when: "Building React apps with Vite."
applies_to: ["pack-react-vite"]
owner: "Governance Team"
---

# Pack: React + Vite

## Standards

- **React 19** with functional components and hooks.
- **Component roles**: container (data/state) vs presentational (pure).
- **Async UI states**: Loading, Error (retry), Empty, Success for every async surface.
- **Accessibility**: WCAG 2.2 AA; keyboard-complete; no color-only cues.

## Tooling

- **Vite** config uses explicit env prefixes and typed `import.meta.env`.
- **Testing**: Vitest + Testing Library; avoid snapshot-heavy DOM tests.

## Evidence

- Storybook stories required for new UI components (if Storybook is enabled).
- A11y reports for UI changes.
