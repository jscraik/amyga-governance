# Repository Rebranding

**Date**: January 5, 2026
**Previous Name**: brAInwav Agentic Governance
**New Name**: AMYGA (Agentic Monitoring, Yielding Governance & Assurance)

## Summary

This repository has been rebranded from **brAInwav Agentic Governance** to **AMYGA** to better reflect the product's core mission: Agentic Monitoring, Yielding Governance & Assurance.

## What Changed

### Repository
- **New URL**: https://github.com/jscraik/amyga-governance
- **Previous URL**: https://github.com/jscraik/brainwav-agentic-governance

### Package
- **New Package**: `@brainwav/amyga-governance`
- **Previous Package**: `@brainwav/brainwav-agentic-governance`

### CLI Commands
- **New Primary Command**: `amyga`
- **Legacy Commands**: `brainwav-governance` and `brainwav-agentic-governance` (still supported as aliases)

### Docker Images
- **New Images**: `ghcr.io/jscraik/amyga-governance/governance-tools:*`
- **Previous Images**: `ghcr.io/jscraik/brainwav-agentic-governance/governance-tools:*`

## Migration Guide

### For Package Users

If you have the old package installed:

```bash
# Remove the old package
pnpm remove @brainwav/brainwav-agentic-governance

# Install the new package
pnpm add -D @brainwav/amyga-governance

# Update your scripts to use the new CLI name
# Old: pnpm exec brainwav-governance validate
# New: pnpm exec amyga validate
```

**Note**: The old CLI commands (`brainwav-governance`, `brainwav-agentic-governance`) continue to work as legacy aliases for backward compatibility.

### For Docker Users

Update your Docker references:

```bash
# Old
docker pull ghcr.io/jscraik/brainwav-agentic-governance/governance-tools:standard

# New
docker pull ghcr.io/jscraik/amyga-governance/governance-tools:standard
```

### For CI/CD Pipelines

Update GitHub Actions or CI configurations:

```yaml
# Old
- uses: jscraik/brainwav-agentic-governance/.github/actions/governance@main

# New
- uses: jscraik/amyga-governance/.github/actions/governance@main
```

## What Stayed the Same

- **Governance Framework**: All core governance policies, workflows, and templates remain unchanged
- **File Structure**: The `brainwav/governance/` directory structure is preserved
- **Configuration**: All `.agentic-governance/` configuration files work without changes
- **Functionality**: No changes to governance behavior, validation rules, or workflows
- **License**: Still Apache-2.0

## Breaking Changes

**None**. The old package name and CLI commands continue to work as legacy aliases.

## Questions?

If you have questions about this rebranding, please open an issue at:
https://github.com/jscraik/amyga-governance/issues

---

**AMYGA** – Agentic Monitoring, Yielding Governance & Assurance
