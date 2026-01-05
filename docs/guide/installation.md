# Installation

Install AMYGA in your project using one of the methods below.

## Prerequisites

- **Node.js** 22+ or 24+
- **pnpm** 9+ or 10+

That's it for Starter tier. Standard and Enterprise tiers require additional tools (see below).

## Method 1: Install as Dev Dependency (Recommended)

```bash
pnpm add -D @brainwav/amyga-governance
pnpm exec amyga init
```

## Method 2: One-Time Use (Try Without Installing)

```bash
pnpm dlx @brainwav/amyga-governance init
```

## Method 3: Docker (All Tools Included)

```bash
docker pull ghcr.io/jscraik/amyga-governance/governance-tools:standard
docker run --rm -v $(pwd):/workspace ghcr.io/jscraik/amyga-governance/governance-tools:standard validate
```

## Method 4: Docker Compose (Local Development)

```bash
docker-compose up -d
docker-compose run --rm governance-standard validate
```

## Tier-Specific Requirements

### Starter Tier
- **Zero external tools required**
- Works immediately after installation

### Standard Tier
Requires these tools (install via `pnpm exec amyga doctor`):
- `semgrep` – Policy linting
- `gitleaks` – Secret scanning
- `osv-scanner` – Dependency vulnerabilities

Or use Docker (tools pre-installed):
```bash
docker-compose --profile standard up
```

### Enterprise Tier
Requires all Standard tools plus:
- `trivy` – Container/misconfig scanning
- `cosign` – Code signing
- `cyclonedx` – SBOM generation

Or use Docker (tools pre-installed):
```bash
docker-compose --profile enterprise up
```

## Verify Installation

```bash
pnpm exec amyga --version
pnpm exec amyga doctor
```

## Upgrade

```bash
pnpm exec amyga upgrade
```

## Uninstall

```bash
pnpm remove amyga
rm -rf .agentic-governance/
```

## Next Steps

- [Initialize your project](../QUICKSTART-5min.md)
- [Choose your tier](../TIERED-OFFERING-STRUCTURE.md)
- [Configure your profile](./profiles.md)
