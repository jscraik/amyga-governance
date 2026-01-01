---
summary: "Storybook setup and a11y/interaction policy for UI components."
read_when: "Using Storybook for component development or testing."
applies_to: ["pack-storybook"]
owner: "Governance Team"
---

# Pack: Storybook

## Standards

- Use the official **Storybook React + Vite** framework.
- New components must include stories that cover states and variants.
- Enable a11y addon and interaction tests for critical UI.

## Evidence

- Storybook build/test logs attached in CI for UI changes.
- A11y addon reports stored under `verification/wcag/`.
