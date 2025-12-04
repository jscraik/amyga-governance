# Governance Hash Updates → governance-maintainers.md

**Status**: CONSOLIDATED - Content moved to comprehensive maintainer guide  
**New Location**: `90-infra/governance-maintainers.md`  
**Last Updated**: 2025-12-03

---

## 📋 Documentation Consolidated

Governance hash update procedures and all infrastructure file management have been **merged into** the comprehensive maintainers guide:

👉 **See**: `90-infra/governance-maintainers.md`

This consolidation provides:

- Complete hash sync procedures
- Infrastructure file purposes and usage
- Emergency procedures and troubleshooting
- Document lifecycle management
- CI integration guidance
- ✅ Before committing governance changes
- ✅ When CI `agents-governance` job fails with hash mismatch errors

### Workflow Example

```bash
# 1. Make changes to governance docs
vim 00-core/AGENT_CHARTER.md  # edit the fragment block between <!-- BEGIN/END CHARTER_FRAGMENT --> markers

# 2. Sync hashes
pnpm governance:sync-hashes

# Output:
# [brAInwav] Starting governance hash sync...
# [brAInwav] Step 1: Updating governance-index.json...
# [brAInwav] Updating AGENT_CHARTER fragment block:
#   Old: b1aad74cf8492c371bb4795e4720496facdbd06f4b6aa23b9a8c3483516c8d87
#   New: faf6254926f327ac182261de41f0f100b4c4ac24f2ca4700949c091a66cda13a
# [brAInwav] ✅ Updated /home/user/Cortex-OS/governance/governance-index.json
# ...
# [brAInwav] ✅ Governance hash sync complete!

# 3. Verify hashes are stable (should show "is current")
pnpm governance:sync-hashes

# 4. Commit changes
git add governance/
git commit -m "docs: update AGENT_CHARTER fragment and sync governance hashes"
```

## Implementation Details

### Script Location

`scripts/governance/sync-hashes.mjs`

### Algorithm

1. Read `governance/governance-index.json`
2. For each document in the index:
   - Compute actual SHA-256 of the file
   - Compare with hash in index
   - Update index if mismatch found
3. Extract the AGENT_CHARTER fragment hash from the updated index
4. Update `AGENTS.md` with correct hash
5. Update `CLAUDE.md` with correct hash

### Idempotency

The script is idempotent - running it multiple times with no changes produces:

```
[brAInwav] ✓ AGENT_CHARTER fragment hash is current
[brAInwav] ✓ agentic-coding-workflow.md hash is current
...
[brAInwav] ✓ AGENTS.md is current
[brAInwav] ✓ CLAUDE.md is current
```

## Adding New Governance Documents

### Step 1: Create the Document

```bash
touch governance/my-new-policy.md
# ... edit the file ...
```

### Step 2: Add to Governance Index

Edit `governance/governance-index.json`:

```json
{
  "precedence": [
    "AGENT_CHARTER.md#fragment",
    "my-new-policy.md",  // Add to precedence list
    ...
  ],
  "docs": {
    ...
    "my-new-policy.md": {
      "path": "/governance/my-new-policy.md",
      "sha256": "PLACEHOLDER_WILL_BE_COMPUTED",
      "required_tokens": [
        "policy keyword",
        "required phrase"
      ]
    }
  }
}
```

### Step 3: Sync Hashes

```bash
pnpm governance:sync-hashes
```

The script will compute the correct SHA-256 and replace the placeholder.

## Troubleshooting

### Error: Hash mismatch for AGENT_CHARTER fragment

**Cause:** The file was edited but hashes weren't updated.

**Solution:**

```bash
pnpm governance:sync-hashes
```

### Error: Circular dependency in CHARTER_FRAGMENT marker self-reference

**Note:** The fragment now lives inside `AGENT_CHARTER.md` between the marker comments, and that region still carries a historical self-referencing hash. This marker line is **informational only** and is NOT auto-updated to avoid circular dependencies. The authoritative hash is in `governance-index.json`.

### CI failure: `agents-governance` job

**Cause:** Committed governance docs without syncing hashes.

**Solution:**

```bash
pnpm governance:sync-hashes
git add governance/governance-index.json AGENTS.md CLAUDE.md
git commit --amend --no-edit
git push --force-with-lease
```

## Pre-Commit Hook (Recommended)

Add to `.husky/pre-commit` or use lefthook:

```bash
#!/bin/sh

# Check if any governance files changed
if git diff --cached --name-only | grep -q "^governance/"; then
  echo "Governance files changed, syncing hashes..."
  pnpm governance:sync-hashes

  # Stage updated files
  git add governance/governance-index.json AGENTS.md CLAUDE.md
fi
```

## Related Documentation

- **Governance Index Schema:** `governance/governance-index.json`
- **Loader Implementation:** `packages/agents/src/governance/loader.ts`
- **CI Enforcement:** `.github/workflows/agents-governance.yml`
- **Charter Fragment:** `brainwav/governance/00-core/AGENT_CHARTER.md` (extract between `<!-- BEGIN/END CHARTER_FRAGMENT -->` markers)

## FAQ

**Q: Why not just use content without hashes?**
A: Hashes provide tamper detection and ensures CI validates the exact governance rules that agents execute against.

**Q: Can I manually update hashes?**
A: Yes, but use `pnpm governance:sync-hashes` - it's faster and error-proof.

**Q: What if `governance-index.json` is missing a document?**
A: Add the document entry (see "Adding New Governance Documents" above) then run the sync script.

**Q: Does this work with CLAUDE.md?**
A: Yes! CLAUDE.md is automatically updated alongside AGENTS.md.

---

**Maintainer:** brAInwav Development Team
**Script:** `scripts/governance/sync-hashes.mjs`
**Package Script:** `pnpm governance:sync-hashes`
