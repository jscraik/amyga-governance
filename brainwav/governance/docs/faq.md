# FAQ

## General

**Q: What is this framework?**
A: A portable governance pack for AI-assisted development teams. Copy it into any repository to inherit ArcTDD gates, oversight rules, and security standards.

**Q: Do I need to install anything?**
A: The governance documents work standalone. Optional: install Cortex Aegis MCP (`npm i -g @brainwav/cortex-aegis-mcp`) for automated oversight.

**Q: Is this a runtime or application?**
A: No. This is a governance framework—policies, templates, and workflows. Your project provides the runtime.

## Workflow

**Q: What are G0–G10 gates?**
A: ArcTDD workflow gates: Intake, Specification, Research, Plan, Build, Review, Fix, Final Review, Merge, Archive, Close.

**Q: What is the Evidence Triplet?**
A: Mandatory proof for each task: (1) milestone test red→green, (2) contract snapshot, (3) reviewer JSON disposition.

**Q: How do I get a waiver for a rule?**
A: Create a waiver document under `.cortex/waivers/`, get maintainer approval via the Apply Waiver workflow, and ensure it has an expiry date.

## Integration

**Q: How do I use this with VS Code?**
A: Add MCP server configurations to your settings, install recommended extensions, and follow the task folder structure.

**Q: How do I use this with CI/CD?**
A: Add governance hash verification, security scans (Semgrep, Gitleaks, Trivy), and checklist enforcement to your pipeline.

**Q: Can I customize the rules?**
A: Yes. Package-level `AGENTS.md` files can tighten rules but never weaken root policy. Waivers handle temporary exceptions.
