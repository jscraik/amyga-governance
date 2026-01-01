---
summary: "Nx affected-only orchestration and diagnostics."
read_when: "Using Nx for monorepo task orchestration."
applies_to: ["pack-nx"]
owner: "Governance Team"
---

# Pack: Nx

## Standards

- Prefer affected-only execution (`nx affected` / smart wrappers).
- Use non-interactive mode (`NX_INTERACTIVE=false`) in CI.
- Emit consistent diagnostics:
  `[nx-smart] target=<t> base=<sha> head=<sha> changed=<n> strategy=affected|all`

## Evidence

- Capture affected summary in CI logs for reproducibility.
