# brAInwav Agentic Governance Framework

> **Neutral, portable governance for AI-assisted delivery teams**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

The brAInwav framework packages policies, workflows, templates, and automation for governing human + AI collaboration. It is intentionally project-neutral: copy it into any repository to inherit ArcTDD gates, Cortex-Aegis oversight, reuse-first delivery checks, and SHA-pinned policy validation.

---

## Table of Contents

- [Why Teams Adopt This Framework](#why-teams-adopt-this-framework)
- [Getting Started (Adopters)](#getting-started-adopters)
- [Repository Layout](#repository-layout)
- [Architecture: Core + Packs + Adapters](#architecture-core--packs--adapters)
- [Creative vs Delivery Modes](#creative-vs-delivery-modes)
- [Profiles & Overlays (local-only defaults)](#profiles--overlays-local-only-defaults)
- [Compatibility Policy (Gold Standard)](#compatibility-policy-gold-standard)
- [Adoption Paths (Jan 2026 best practice)](#adoption-paths-jan-2026-best-practice)
- [Governance Commands](#governance-commands)
- [Release Process (Maintainers)](#release-process-maintainers)

---

## Why Teams Adopt This Framework

- **ArcTDD + Phase Machine** – Standardized G0–G10 workflow (R→G→F→REVIEW) with ≤7-step plans, failing-first tests, and evidence capture at every gate.
- **Evidence Triplet & Run Manifests** – Mandatory pointers to (1) milestone test red→green proof, (2) contract snapshot, (3) reviewer disposition JSON.
- **Cortex-Aegis Oversight** – Live MCP/CLI gate that enforces academic research, license validation, and vibe checks before any side-effecting work.
- **Security & Compliance** – Standards are pinned in `brainwav/governance/90-infra/standards.versions.json` (Jan 2026 baseline) and include OWASP Top 10:2025, ASVS 5.0.0, OWASP LLM Top 10 (2025 v1.1), NIST SSDF 1.1, NIST AI RMF + GenAI Profile, WCAG 2.2, SLSA v1.2, CycloneDX 1.7, SPDX 3.0.1, Sigstore Cosign, and OpenSSF Scorecard (see `SECURITY.md`).
- **Governance Integrity** – `brainwav/governance/90-infra/governance-index.json` pins SHA-256 hashes for every normative doc; CI blocks mismatches.
- **MCP-First Tooling** – RepoPrompt, Context7, Local Memory, and Cortex-Aegis MCP servers with run-manifest logging, plus Local Memory parity rules.
- **Modular Control Framework** – Core + capability packs + GitHub Actions adapters, with controls-as-data for auditability and external defensibility.

---

## Getting Started (Adopters)

### Prerequisites (must match CI)

- Node.js 24.11.x + pnpm 10.26.x (pinned via `package.json` engines and CI workflow).
- Security toolchain installed locally and in CI: `semgrep`, `gitleaks`, `trivy`, `cosign`, `cyclonedx`, plus OSV/pnpm audit support (`pnpm audit`, `osv-scanner`).
- MCP clients (VS Code, Claude Desktop, RepoPrompt CLI) with access to Context7, Local Memory, and Cortex-Aegis servers.

### Bootstrap Steps (pack maintainers)

```bash
# 1. Clone the framework
git clone https://github.com/jscraik/brainwav-agentic-governance.git

# 2. Install dependencies + security tools
pnpm install
pnpm ensure:tools        # installs repo-required CLIs (Semgrep, Gitleaks, etc.)

# 3. Run governance bootstrap (discover hashes, MCP config, governance index)
pnpm cortex:governance-bootstrap

# 4. (Optional) Validate MCP health + oversight
pnpm oversight:vibe-check --goal "<task>" --plan "<≤7 steps>" --session "demo"

# 5. Verify required tooling and governance files
pnpm readiness:check
```

### Install & Verify in a consumer project

> Use this when you want to drop governance into an existing repo.

Pointer mode is the default, canonical-only adoption path. Use the install/upgrade commands below for consumer repos.

1. From this repo: `pnpm install` (Node 24.11.x, pnpm 10.26.x).  
2. Recommended install path (devDependency + pnpm exec):  
   `pnpm add -D @brainwav/brainwav-agentic-governance`  
   `pnpm exec brainwav-governance install --root /path/to/consumer-repo --mode pointer --profile delivery [--packs a11y,supply-chain]`  
3. Bootstrap-only path (not the standard):  
   `pnpm dlx @brainwav/brainwav-agentic-governance@<version> brainwav-governance install --root /path/to/consumer-repo --mode pointer --profile delivery [--packs a11y,supply-chain]`  
   - **Private package notice:** `@brainwav/brainwav-agentic-governance` is private to the `@brainwav` org.
     Consumers and CI must be authenticated (Trusted Publishing or `NODE_AUTH_TOKEN`)
     before running `pnpm add` / `pnpm exec` installs.
   - Default profile is `delivery`. CI should use `release` for gold-standard gating.
   - Default install mode is `pointer` (canonical-only distribution). Use `full` only for air-gapped or exceptional cases.
   - `full` copies AGENTS, CODESTYLE, SECURITY, `brainwav/governance/**`, and the GitHub Actions workflow.  
   - `pointer` writes pointer stubs + `.agentic-governance/pointer.json` and expects a lockfile-pinned `@brainwav/brainwav-agentic-governance` dependency.
   - **Supported CLI:** `brainwav-governance` is the only stable public entrypoint. `brainwav-agentic-governance` is a legacy alias.
4. In the consumer repo, run:  
   `pnpm exec brainwav-governance validate --root .` (checks required tokens + Step Budget ≤7 + overlay rules)  
   `pnpm exec brainwav-governance validate --root . --strict` (fail on warnings in CI)
5. Commit the added files and ensure the consumer CI uses Node 24.11.x + pnpm 10.26.x. The included `governance.yml` workflow will enforce readiness, hash drift, oversight, security scans, dependency boundaries, and task scaffolds on every PR.

### Upgrade in a consumer project

```bash
pnpm exec brainwav-governance upgrade --root /path/to/consumer-repo [--packs a11y,supply-chain]
```

`upgrade` refreshes pointer stubs + workflows, updates the pinned dependency, and runs `pnpm install` when a pnpm lockfile is present.

By default, `upgrade` preserves existing files. Use `--force` to overwrite existing governance files when you intend to replace local edits.

For automated upgrades, see `.github/workflows/governance-upgrade.yml`.

### Verify (quick sanity checks)

- `pnpm exec brainwav-governance validate --root .` should succeed.
- `pnpm governance:sync-hashes:check` should report no drift.
- `pnpm governance:validate-evidence` should pass once at least one task folder exists with evidence placeholders.
- `pnpm exec brainwav-governance cleanup-plan --root . --report .agentic-governance/reports/cleanup-plan.json` emits a delete/move plan for pointer-mode repos.
- `pnpm exec brainwav-governance cleanup-plan --root . --apply --force` applies the plan (move/delete) and writes `cleanup.applied.json`.

### Packs catalog

- See `docs/packs.md` for the generated pack catalog (IDs, dependencies, runners, docs, checks).
- If `AGENTS.pack.md` or `CODESTYLE.pack.md` is missing for a pack, install/upgrade synthesizes the section from the manifest.
- Swift/AppKit quick-start (packOptions.swift-appkit):

```json
{
  "packOptions": {
    "swift-appkit": {
      "xcode": {
        "project": "MyApp.xcodeproj",
        "scheme": "MyApp-macOS",
        "destination": "platform=macOS,arch=arm64"
      },
      "entitlements": {
        "paths": ["MyApp/MyApp.entitlements"]
      },
      "privacy": {
        "plists": ["MyApp/Info.plist"],
        "requiredKeys": ["NSCameraUsageDescription", "NSMicrophoneUsageDescription"]
      }
    }
  }
}
```

### Automation scripts (wired)

- `pnpm ensure:tools` — checks required CLIs (rg, fd, jq, semgrep, gitleaks, trivy, cosign, osv-scanner, markdownlint-cli2) and engine versions.
- `pnpm cortex:governance-bootstrap` — writes `.agentic-governance/agent-context.json` with AGENTS.md hash and workflow pointers.
- `pnpm oversight:vibe-check --goal "..." --plan "..." [--session <id>] [--slug <task>]` — posts to the Cortex Aegis HTTP endpoint (default `http://127.0.0.1:2091/vibe_check`) and logs JSON under the task.
- `pnpm readiness:check` — confirms core governance files exist and required tools are present.
- `brainwav-governance install --root <path>` — copy governance pack + CI workflow into another repo.
- `brainwav-governance validate --root <path>` — verify required tokens and Step Budget <=7 across tasks.
- `brainwav-governance task init --slug <id> --tier <feature|fix|refactor|research|update>` — scaffold a task folder with Evidence Triplet placeholders.
- `brainwav-governance spec init --slug <id> --spec-root specs` — scaffold `specs/<slug>/{spec.md,plan.md,tasks.md}` when the `sdd` pack is enabled.
- `brainwav-governance spec init --slug <id> --compat speckit` — scaffold a spec-kit compatible `.specify/specs/<slug>/` layout.
- `brainwav-governance spec validate --spec-root specs --report .agentic-governance/reports/spec-validate.json` — validate spec-kit compatible layout and spec lifecycle.
- `brainwav-governance spec clarify --spec-root specs` — flag missing requirements in spec artifacts.
- `brainwav-governance spec analyze --spec-root specs` — cross-check spec/plan/tasks consistency.
- `brainwav-governance spec checklist --spec-root specs` — run "tests for English" checklist.
- `brainwav-governance cleanup-plan --root . --report .agentic-governance/reports/cleanup-plan.json` — plan pointer-mode cleanup.
- `brainwav-governance cleanup-plan --root . --apply --force` — apply cleanup plan (writes `cleanup.applied.json`).
- `brainwav-governance packs list [--json]` — list available packs/presets for discovery.
- `pnpm governance:validate-standards` — check standards link freshness and `as_of` age in `standards.versions.json`.
- `pnpm governance:sync-hashes:check` — fail on governance hash drift (non-writing).
- `pnpm docs:validate` — validate doc links + referenced paths in core policy docs.
- `pnpm task:scaffold --slug <id>` / `pnpm task:validate --slug <id>` — create and check task folders for Evidence Triplet placeholders.
- `pnpm governance:check-nx` — run Nx graph when nx.json exists (skips if absent); included in CI template.
- `pnpm governance:validate-evidence` — verify Evidence Triplet files, memory IDs, trace context, and academic research logs are present and non-empty.
- `pnpm governance:validate-agents` — enforce AGENTS.md size + referenced path/job integrity.
- See `brainwav/governance/docs/gold-standard-checklist.md` for the CI contract vs advisory vs local-only checks.
- `brainwav-governance upgrade --root <path>` — refresh installs + update dependency in a consumer repo.
- `brainwav-governance doctor --root <path>` — readiness + tooling checks.
- `brainwav-governance <command>` — CLI wrapper for install/upgrade/validate/doctor (alias: `brainwav-agentic-governance`).
- **SDD pack** (spec-driven development) stores work artifacts under `specs/<slug>/` and is included in default presets for delivery/release.
- `pnpm commands:docs-list` — list governance docs with summaries for fast discovery.
- `pnpm governance:generate-control-docs` — generate control catalog docs into `brainwav/governance/generated/`.

Customize `AGENTS.md`, `brainwav/governance/00-core/constitution.md`, and templates under `brainwav/governance/templates/` with your maintainers, escalation paths, and brand wording. Use `.agentic-governance/config.json` for profile selection and overlays (local tightenings only). Update `.agentic-governance/mcp.runtime.json` in consumer repos if you add or relocate MCP transports.

### Documentation quality checklist (OpenAI Cookbook aligned)
- State prerequisites up front (here: Node 24.11.x, pnpm 10.26.x, security toolchain).
- Provide a minimal happy path (see “Install & Verify in a consumer project”).
- Include verification commands (`governance:validate`, `governance:sync-hashes:check`) so readers can confirm success.
- Keep steps copy/pasteable and ordered; mark optional steps clearly.
- Link enforcement to CI templates so readers know what’s automated vs manual.

---

## Repository Layout

```
brainwav/governance/
├── 00-core/                  # Constitution, charter, LLM threat controls, skills policy
├── 10-flow/                  # Agentic coding workflow, assurance system, quickstart
├── 20-checklists/            # Unified reviewer + gate checklists
├── 30-compliance/            # e.g., EU AI Act mapping
├── 90-infra/                 # governance-index.json, dependency guards, structure schemas
├── commands/                 # Executable commands (memorize, recall, daily-summary, incident-review)
├── docs/                     # Pack catalog (generated)
├── runbooks/                 # Incident + ops procedures
└── templates/                # Feature, research, TDD plan templates

AGENTS.md                     # Root operational policy (ArcTDD charter, Oversight rules)
CODESTYLE.md                  # Code + architecture standards (named exports, <=40-line funcs)
SECURITY.md                   # Standards & References (Jan 2026) + CI gate expectations
tasks/<slug>/                 # Per-task folders with run manifests + evidence triplets
```

---

## Architecture: Core + Packs + Adapters

**Core (mandatory):** AGENTS.md, step budget, evidence triplet, hash-pinned governance index, profile system (creative/delivery/release), and AI risk controls by default.  
**Capability packs (opt-in):** security-appsec, supply-chain, a11y, ai-risk, compliance-overlays.  
**Adapters:** GitHub Actions templates and stack-specific command mappings (policy text stays identical).

Controls are stored as data in the control catalog `brainwav/governance/90-infra/control-registry.core.yaml` (schema in `control-registry.schema.json`) and mapped to public standards for auditability.

---

## Creative vs Delivery Modes

**Creative mode (default for ideation/spikes):** No side-effecting actions, no deploys, no secrets; output is a short artifact + next steps.  
**Delivery mode (full gates):** ArcTDD gates, evidence triplets, oversight, and security/a11y checks apply for daily work.  
**Release mode (gold standard):** Delivery + supply-chain and publication evidence. CI enforces **Release** regardless of local mode.

Local profile selection (creative/delivery/release) lives in `.agentic-governance/config.json` and only affects local workflow defaults. CI enforces **release** gates by default for gold-standard delivery. `core`/`full` are accepted as legacy synonyms.

## Profiles & Overlays (local-only defaults)

- **Profiles** (`creative`, `delivery`, `release`) only affect local defaults. CI enforces **release** gates by default.
- **Overlays** let consumer repos tighten rules without editing base governance files.
- **Base governance is immutable**: files under `brainwav/governance/**` are hash-pinned; modify only via upstream changes and hash updates.

---

## Compatibility Policy (Gold Standard)

`brainwav/governance/90-infra/compat.json` defines the supported toolchain (Node/pnpm), CI provider baseline (GitHub Actions), and the compatibility policy. Minor releases are additive and must not change required evidence structure; majors may do so with migration notes.

---

## Adoption Paths (Jan 2026 best practice)

1) **Fast path (no Docker):** minimal local checks, full CI gates.  
2) **Containerized tooling:** single tools image for scanners and SBOM/provenance.  
3) **Full local install:** all scanners and governance tools installed locally.

## Governance Commands

The framework ships executable commands under `brainwav/governance/commands/`. Run them with Node.js:

```bash
# Recall context from Local Memory MCP
TASK_SLUG=my-task node brainwav/governance/commands/recall.mjs "governance workflow" --limit=5

# Store task context to memory
TASK_SLUG=my-task node brainwav/governance/commands/memorize.mjs

# Generate daily standup summary
TASK_SLUG=my-task DAILY_FOCUS="observability" node brainwav/governance/commands/daily-summary.mjs

# Prepare incident post-mortem
INCIDENT_ID=INC-742 node brainwav/governance/commands/incident-review.mjs
```

| Command | Markdown Spec | Executable | Purpose |
|---------|---------------|------------|---------|
| `/memorize` | `memorize.md` | `memorize.mjs` | Store governance context to Local Memory |
| `/recall` | `recall.md` | `recall.mjs` | Retrieve context via semantic search |
| `/daily-summary` | `daily-summary.md` | `daily-summary.mjs` | Generate standup summary with git status |
| `/incident-review` | `incident-review.md` | `incident-review.mjs` | Prepare structured post-incident review |
| `/gather` | `gather.md` | — | LLM prompt for context collection |
| `/reframe` | `reframe.md` | — | LLM prompt for plan validation |
| `/truth` | `truth.md` | — | LLM prompt for factual audits |
| `/sprint-goals` | `sprint-goals.md` | — | LLM prompt for sprint planning |

---

## Release Process (Maintainers)

- Releases are automated on tag push matching `v0.x.y`.
- npm is the canonical distribution source (private package `@brainwav/brainwav-agentic-governance`).
- A draft GitHub Release attaches the packed tarball, SBOM, provenance, and signatures generated in CI; it is published after npm + canary succeed.
- Release gating runs `pnpm lint:ci`, `pnpm test:cli`, and `pnpm test:fixtures`.
- `docs/packs.md` is regenerated during release; the workflow fails if the file is out of date.
- Post-publish canary validation runs against `brainwav-governance-canary` to confirm install + validate.
- Keep `0.x` versions until fixture-based CLI tests cover all target stacks.

---

## Operational Pillars

### Hierarchy of Authority

1. **Governance Pack** – `brainwav/governance/**/*` (Constitution, Charter, workflows, checklists).
2. **CODESTYLE.md** – Enforced coding and architectural rules.
3. **Root `AGENTS.md`** – Repository-wide agent instructions.
4. **Nearest package `AGENTS.md`** – May tighten rules, never weaken.

### ArcTDD + Phase Machine

- ArcTDD gates G0–G10 map to the R→G→F→REVIEW pipeline.
- Plans MUST be ≤7 steps per arc, with Ask-First clarifications ≤3 per session.
- Every task maintains `tasks/<slug>/json/run-manifest.json` with gate status, evidence pointers, and MCP session logs.

### Task & Evidence Contract

Each task produces a governed folder:

```
tasks/<slug>/
├── context/ (research, connector health, requirements)
├── plan/ (PLAN.md, risk register, tdd-plan)
├── work/implementation-log.md
├── evidence/ (tests.md, critic-review.json, confession-report.json, aegis-report.json)
├── logs/vibe-check/*.json
├── logs/academic-research/*.json
├── json/run-manifest.json + memory-ids.json
└── SUMMARY.md + session-retrospective
```

### Oversight & Academic Research

- Cortex-Aegis MCP server (`@brainwav/cortex-aegis-mcp`, default port 2091) runs `vibe_check`, `connector_health`, `license_validate`, and `time_freshness` tools.
- Agents must run research via Wikidata MCP (3029), arXiv MCP (3041), Semantic Scholar/OpenAlex APIs, and Context7 before calling Aegis.
- Oversight gates: G2 (always) and G5 (when risk ≥ medium). Responses live in `logs/vibe-check/*.json` and `evidence/aegis-report.json`.

### Security & Compliance

- Follow `SECURITY.md` for OWASP Top 10:2025, OWASP ASVS 5.0.0 targeting, OWASP LLM Top 10 (2025 v1.1), and MITRE ATLAS tagging.
- CI gates: Semgrep (block on policy rules), Gitleaks (`ANY=block`), OSV/pnpm audit (block on high/critical runtime deps), Trivy (vuln/misconfig/secret/license), CycloneDX SBOM, Sigstore Cosign v3 attestation.
- Evidence of each scanner runs during G5, and waivers must be recorded + time-boxed per `AGENTS.md` §27.

### MCP & Local Memory Integration

- RepoPrompt handles context building, planning, and minimal diffs.
- Context7 supplies up-to-date third-party documentation before each API touch.
- Local Memory MCP enforces memory parity between `.github/instructions/memories.instructions.md` and the Qdrant-backed service.
- Run manifests log every MCP session (server, transport, endpoint, evidence anchors).

---

## Adopting in CI/CD

- Wire `pnpm cortex:governance-bootstrap` into repo attach to refresh governance hashes.
- Enforce `brainwav/governance/90-infra/governance-index.json` verification in CI (already included in `agents-guard`).
- Run `pnpm readiness:check`, `pnpm lint:smart`, `pnpm test:smart`, `pnpm typecheck:smart`, and security gates before merging.
- Attach Evidence Triplet artifacts to every pull request and require the unified checklist from `brainwav/governance/20-checklists/checklists.md`.

---

## Documentation Map

- [AGENTS.md](AGENTS.md) – Operational policy, Oversight gate, Reuse-first rules.
- [CODESTYLE.md](CODESTYLE.md) – Architectural conventions, dependency boundaries.
- [SECURITY.md](SECURITY.md) – Standards & References (Jan 2026), CI gate requirements.
- [docs/packs.md](docs/packs.md) – Generated pack catalog (IDs, runners, checks).
- [brainwav/governance/10-flow/agentic-coding-workflow.md](brainwav/governance/10-flow/agentic-coding-workflow.md) – Detailed G0–G10 guidance.
- [brainwav/governance/docs/cortex-aegis.md](brainwav/governance/docs/cortex-aegis.md) – Oversight MCP installation and evidence expectations.
- [brainwav/governance/templates/](brainwav/governance/templates/) – Feature, research, and TDD plan templates.

---

## Contributing

1. Fork the repo (or create a feature branch if upstream contributor).
2. Run `pnpm cortex:governance-bootstrap` to refresh governance hashes.
3. Follow the ArcTDD workflow with task folders, Evidence Triplet, Cortex-Aegis oversight, and security gates.
4. Open a PR referencing the relevant governance sections; ensure `agents-guard`, lint, typecheck, tests, and security pipelines pass.

---

<!-- PROJECT-SPECIFIC: START -->
## Project Configuration

> **Instructions:** Edit this section to customize the governance framework for your project. This section is NOT overwritten when upgrading the governance pack.

### Project Identity

| Field | Value |
|-------|-------|
| Project Name | _Your Project Name_ |
| Repository | _your-org/your-repo_ |
| Primary Contact | _@your-handle_ |
| Slack Channel | _#your-project_ |

### Custom Badges

<!-- Add your project badges here -->
<!-- [![CI](https://github.com/your-org/your-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/your-repo/actions) -->

### Getting Started Overrides

<!-- Add any project-specific bootstrap steps that differ from the default -->

### Project-Specific MCP Servers

| Server | Port | Purpose |
|--------|------|--------|
| _Example_ | _3100_ | _Project-specific tooling_ |

<!-- PROJECT-SPECIFIC: END -->

---

## License & Maintainer

- License: [Apache 2.0](LICENSE)
- Maintainer: [@jamiescottcraik](https://github.com/jamiescottcraik) · brAInwav
