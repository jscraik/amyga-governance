# Cloudflare Worker Distribution Runbook

> Publish the governance pack once and serve it to all projects (new or existing) via a Cloudflare Worker endpoint.

## Artifacts to serve
- `AGENTS.md`, `CODESTYLE.md`, `SECURITY.md`
- `brainwav/governance/**/*` (authoritative governance pack, including `90-infra/governance-index.json` for SHA validation)
- `brainwav/governance-pack/dist/*` (merged overlays; defaults already present in repo)

## Build the distributable
```bash
# From repo root
mkdir -p dist
PACK=dist/brainwav-governance-pack.tar.gz
rm -f "$PACK"

tar -czf "$PACK" \
  AGENTS.md CODESTYLE.md SECURITY.md \
  brainwav/governance \
  brainwav/governance-pack/dist

# Inspect
tar -tzf "$PACK" | head
```

## Worker layout (serving static pack)
Use KV (small) or R2 (larger) to store the tarball + `governance-index.json`. Example Worker with KV:

```ts
// src/index.ts
export default {
  async fetch(_req: Request, env: Env): Promise<Response> {
    const url = new URL(_req.url);
    if (url.pathname === "/pack") {
      const blob = await env.GOV_PACK.get("brainwav-governance-pack.tar.gz", "arrayBuffer");
      if (!blob) return new Response("pack missing", { status: 503 });
      return new Response(blob, {
        headers: {
          "content-type": "application/gzip",
          "content-disposition": "attachment; filename=brainwav-governance-pack.tar.gz",
        },
      });
    }
    if (url.pathname === "/index") {
      const json = await env.GOV_PACK.get("governance-index.json", "text");
      if (!json) return new Response("index missing", { status: 503 });
      return new Response(json, { headers: { "content-type": "application/json" } });
    }
    return new Response("ok", { status: 200 });
  },
};
```

```jsonc
// wrangler.jsonc
{
  "name": "governance-pack",
  "main": "src/index.ts",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true, "head_sampling_rate": 1 },
  "kv_namespaces": [
    { "binding": "GOV_PACK", "id": "<kv-id>", "preview_id": "<kv-preview-id>" }
  ]
}
```

Upload assets once after each pack refresh:
```bash
wrangler kv:key put --namespace-id <kv-id> brainwav-governance-pack.tar.gz @dist/brainwav-governance-pack.tar.gz
wrangler kv:key put --namespace-id <kv-id> governance-index.json @brainwav/governance/90-infra/governance-index.json
wrangler deploy
```

## Consumer workflow (new or existing repo)
```bash
# 1) Fetch and verify hashes
curl -sS https://<worker-domain>/index -o /tmp/governance-index.json
# (validate SHA entries for AGENTS and charter before continuing)

# 2) Pull the pack and extract into repo root
curl -sSL https://<worker-domain>/pack | tar -xzf -

# 3) Run governance bootstrap to cache hashes
pnpm cortex:governance-bootstrap

# 4) Initialize task manifest when you start work
mkdir -p tasks/<slug>/json
# populate run-manifest.json per brainwav/governance/10-flow/agentic-coding-workflow.md
```

## Update cadence
- Rebuild the tarball whenever `AGENTS.md`, `CODESTYLE.md`, `SECURITY.md`, or any `brainwav/governance/**/*` file changes.
- Re-upload `governance-index.json` after hash updates.
- Redeploy the Worker after each upload so clients always pull the latest pack.

## Notes
- Clients MUST refuse to proceed if the downloaded `governance-index.json` hashes do not match local files after extraction.
- Keep overlays in `brainwav/governance-pack/overlays/*` in sync with the dist output you publish.
- If the pack size grows, prefer R2 over KV and serve with `get()` streaming.
