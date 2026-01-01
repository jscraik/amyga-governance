---
summary: "Tailwind v4 usage, class sorting, and composition rules."
read_when: "Using Tailwind CSS in any UI surface."
applies_to: ["pack-tailwind"]
owner: "Governance Team"
---

# Pack: Tailwind CSS

## Standards

- **Tailwind v4** baseline.
- **Class ordering**: enforce Biome `useSortedClasses` (or approved equivalent).
- **Composition**: prefer component extraction over string-concat class soup.
- **Design tokens**: centralize colors, spacing, typography; avoid ad-hoc values.

## Evidence

- Lint passes with class sorting rule enabled.
- Visual regression or story evidence for significant UI changes.
