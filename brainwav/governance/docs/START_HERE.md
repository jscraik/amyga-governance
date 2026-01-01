---
summary: "Two-page entrypoint for adoption and daily use."
read_when: "First time in the repo or onboarding."
applies_to: "core"
owner: "Governance Team"
---

# Start Here

## What this is

The governance pack provides portable, gold‑standard rules for AI‑assisted delivery: evidence‑first workflows, safety gates, and supply‑chain controls.

## Modes (local defaults)

- **Creative** — ideation and spikes; no side effects.
- **Delivery** — full gates for daily work.
- **Release** — delivery + supply‑chain and publication evidence.

CI enforces **Release** gates by default for gold-standard delivery.

## One‑command install

```bash
pnpm governance:install --dest /path/to/your-project --mode pointer --profile release
```

## One‑command start (per task)

```bash
pnpm task:scaffold --slug <task-id>
```

## Where to go next

- **Getting Started**: `getting-started.md`
- **Architecture**: `architecture.md`
- **Policies & Gates**: `policies.md`, `testing-qa.md`, `security.md`
- **Packs**: `packs/` (stack‑specific guidance)
