---
summary: "Cloudflare Workers runtime constraints, egress policy, and testing."
read_when: "Deploying or testing Cloudflare Workers."
applies_to: ["pack-cloudflare-workers"]
owner: "Governance Team"
---

# Pack: Cloudflare Workers

## Standards

- Respect Workers runtime constraints (no Node-only APIs unless compatibility enabled).
- **Egress governance**: default-deny outbound calls; explicit allowlists required.
- **Secrets**: use Workers secrets/bindings; never hardcode.

## Testing

- Use Miniflare/workerd for deterministic tests.
- Include scheduled/queue tests when relevant.

## Evidence

- `verification/egress-allowlist.json` attached.
- Worker test logs attached under `verification/worker-tests.log`.
