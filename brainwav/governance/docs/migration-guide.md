# Migration Guide

## Adopting the Framework

### From No Governance

1. Copy governance artefacts into your repository root.
2. Configure MCP clients for Cortex Aegis.
3. Create task folder structure for current work.
4. Begin following ArcTDD gates (G0–G10).

### From Another Framework

1. Map existing gates to ArcTDD equivalents.
2. Update checklist templates to match unified format.
3. Migrate evidence to task folder structure.
4. Update CI/CD to enforce governance index verification.

## Upgrading the Framework

### Minor Updates (patches, clarifications)

1. Pull latest from governance repository.
2. Copy updated files over existing ones.
3. Review changelog for behavioral changes.

### Major Updates (new rules, breaking changes)

1. Review the changelog and migration notes.
2. Update governance index with new SHA hashes.
3. Adjust CI/CD gates for new requirements.
4. Update team documentation and training.
5. Create waivers for transitional exceptions.

## Version Compatibility

The governance framework uses SemVer:

- **MAJOR** – Breaking changes to rules or structure
- **MINOR** – New rules or features (additive)
- **PATCH** – Clarifications and fixes

Check `brainwav/governance/90-infra/governance-index.json` for current versions.
